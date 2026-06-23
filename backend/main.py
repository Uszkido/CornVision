import asyncio
import json
import random
import time
from datetime import datetime
from typing import List, Dict

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordRequestForm
import pandas as pd
import os
import sys

# PyInstaller path resolution
def get_resource_path(relative_path):
    if getattr(sys, 'frozen', False):
        base_path = sys._MEIPASS
    else:
        base_path = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_path, relative_path)

# Fix path for standalone importing
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from . import models, database, auth
from ai_models.inference import CornVisionAI

# Initialize AI Engine
ai_engine = CornVisionAI()
from .database import SessionLocal, engine

# Global configuration
GLOBAL_CONFIG = {
    "detection_threshold": 0.5,
    "simulation_speed": 1.0,
    "active_lines": ["CONVEYOR_01"]
}

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmartCorn AI Management API")

# Serve static components
BASE_DIR = os.path.dirname(__file__)
if getattr(sys, 'frozen', False):
    # When packaged in EXE
    test_images_path = get_resource_path("ai_models/test_images")
    processed_images_path = get_resource_path("ai_models/processed")
    frontend_path = get_resource_path("frontend/dist")
else:
    # When running normally
    test_images_path = os.path.join(BASE_DIR, "..", "ai_models", "test_images")
    processed_images_path = os.path.join(BASE_DIR, "..", "ai_models", "processed")
    frontend_path = os.path.join(BASE_DIR, "..", "frontend", "dist")

if os.path.exists(test_images_path):
    app.mount("/images/raw", StaticFiles(directory=test_images_path), name="raw_images")
if os.path.exists(processed_images_path):
    app.mount("/images/processed", StaticFiles(directory=processed_images_path), name="proc_images")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models ---
class DetectionResult(BaseModel):
    timestamp: str
    line_id: str
    type: str  # burnt, broken, foreign, normal
    confidence: float
    image_url: str = None

class ProductionStats(BaseModel):
    total_processed: int
    defects_count: int
    uptime_seconds: int
    efficiency: float

# --- State ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def apprenticeship(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()
start_time = time.time()
processed_count = 0
defect_count = 0

# --- Simulation Logic ---
async def detection_simulator():
    global processed_count, defect_count
    defect_types = ["burnt", "broken", "discolored", "foreign_material"]
    
    while True:
        await asyncio.sleep(random.uniform(0.5, 2.0) / GLOBAL_CONFIG["simulation_speed"])
        processed_count += 1
        
        # 10% chance of a defect
        is_defect = random.random() < 0.1
        
        current_time = datetime.now()
        det_type = "normal" if not is_defect else random.choice(defect_types)
        is_defect = random.random() < 0.1
        
        # Pick a physical image file to "process"
        raw_dir = test_images_path
        available_files = [f for f in os.listdir(raw_dir) if f.endswith('.png')]
        
        # Logic to pick defect or normal file
        if is_defect:
            files = [f for f in available_files if f != 'normal.png']
        else:
            files = ['normal.png']
        
        target_file = random.choice(files)
        full_path = os.path.join(raw_dir, target_file)
        
        # Run AI Inference
        ai_result = ai_engine.analyze_flake(full_path)
        
        current_time = datetime.now()
        image_url = f"http://localhost:8000/images/processed/{ai_result['processed_image']}"

        detection = {
            "timestamp": current_time.isoformat(),
            "line_id": "CONVEYOR_01",
            "type": ai_result["type"],
            "confidence": ai_result["confidence"],
            "image_url": image_url,
            "id": f"det_{int(time.time() * 1000)}"
        }
        
        # Save to Database
        db = SessionLocal()
        try:
            db_detection = models.Detection(
                timestamp=current_time,
                line_id="CONVEYOR_01",
                type=ai_result["type"],
                confidence=ai_result["confidence"],
                image_url=image_url
            )
            db.add(db_detection)
            db.commit()
        except Exception as e:
            print(f"Error saving detection: {e}")
            db.rollback()
        finally:
            db.close()

        if is_defect:
            defect_count += 1
            # Broadcast defect alert immediately via WebSocket
            await manager.broadcast(json.dumps({
                "event": "DEFECT_DETECTED",
                "data": detection
            }))
        else:
            # Also broadcast normal detections to keep UI alive
            await manager.broadcast(json.dumps({
                "event": "NORMAL_DETECTION",
                "data": detection
            }))
        
        # Periodically broadcast stats
        if processed_count % 10 == 0:
            stats = {
                "total_processed": processed_count,
                "defects_count": defect_count,
                "uptime_seconds": int(time.time() - start_time),
                "efficiency": round((processed_count - defect_count) / max(1, processed_count) * 100, 2)
            }
            await manager.broadcast(json.dumps({
                "event": "PROD_STATS_UPDATE",
                "data": stats
            }))
            
            # Save stats snapshot to DB
            db = SessionLocal()
            try:
                db_stats = models.StatsSnapshot(
                    timestamp=datetime.now(),
                    total_processed=stats["total_processed"],
                    defects_count=stats["defects_count"],
                    uptime_seconds=stats["uptime_seconds"],
                    efficiency=stats["efficiency"]
                )
                db.add(db_stats)
                db.commit()
            except Exception as e:
                print(f"Error saving stats: {e}")
                db.rollback()
            finally:
                db.close()

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(detection_simulator())

# --- Endpoints ---
@app.get("/")
async def root():
    return {"message": "SmartCorn AI Backend is running"}

@app.get("/stats", response_model=ProductionStats)
async def get_stats():
    return ProductionStats(
        total_processed=processed_count,
        defects_count=defect_count,
        uptime_seconds=int(time.time() - start_time),
        efficiency=round((processed_count - defect_count) / max(1, processed_count) * 100, 2)
    )

@app.get("/detections")
async def get_detections(limit: int = 100):
    db = SessionLocal()
    try:
        detections = db.query(models.Detection).order_by(models.Detection.timestamp.desc()).limit(limit).all()
        return detections
    finally:
        db.close()

# --- Auth & Export ---
@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Dummy user for demo (Admin / Admin123)
    if form_data.username == "admin" and form_data.password == "admin123":
        access_token = auth.create_access_token(data={"sub": form_data.username})
        return {"access_token": access_token, "token_type": "bearer"}
    raise HTTPException(status_code=400, detail="Incorrect username or password")

@app.get("/export/csv")
async def export_detections(db: Session = Depends(database.get_db)):
    detections = db.query(models.Detection).all()
    df = pd.DataFrame([
        {
            "id": d.id,
            "timestamp": d.timestamp,
            "type": d.type,
            "confidence": d.confidence
        } for d in detections
    ])
    
    csv_path = "detections_export.csv"
    df.to_csv(csv_path, index=False)
    return FileResponse(csv_path, filename="corn_detections.csv", media_type="text/csv")

# --- Config Endpoints ---
@app.get("/config")
async def get_config():
    return GLOBAL_CONFIG

@app.post("/config")
async def update_config(config: Dict, current_user: str = Depends(auth.get_current_user)):
    global GLOBAL_CONFIG
    GLOBAL_CONFIG.update(config)
    return GLOBAL_CONFIG

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.apprenticeship(websocket)
    try:
        while True:
            # We can receive commands from frontend here if needed
            data = await websocket.receive_text()
            # Echo or process
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# --- SPA Routing ---
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
else:
    @app.get("/")
    async def root_fallback():
        return {"message": "Frontend not built. Run 'npm run build' in the frontend folder."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
