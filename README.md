# 🌽 CornVision AI: Industrial Quality Intelligence

![Build Status](https://img.shields.io/badge/Build-Standalone_EXE-blue)
![Python](https://img.shields.io/badge/Python-3.9+-red)
![React](https://img.shields.io/badge/React-18-cyan)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-green)

**CornVision AI** is a production-grade, end-to-end quality control dashboard for cornflake manufacturing. It leverages computer vision (YOLOv8 logic), real-time telemetry, and predictive analytics to ensure maximum production efficiency and minimum waste.

## 🚀 Key Features

*   **Real-time AI Vision Stream**: Live bounding-box overlays for defects (Burnt, Broken, Discolored, Foreign Material).
*   **Predictive Maintenance**: AI-driven modeling of mechanical wear and failure probability.
*   **Multilingual Support**: Fully localized in **English**, **Hausa**, and **Yoruba**.
*   **Secure Gateway**: JWT-authenticated access for authorized factory personnel.
*   **Audit Reporting**: Instant CSV export of historical quality metrics.
*   **Standalone Deployment**: One-click EXE generation for Windows, Linux, and macOS.

## 📦 Deployment Options

### 1. Standalone EXE (Easiest)
Download the `CornVisionAI.exe` from the Releases page (or build it yourself) and run it. No dependencies required.

### 2. Docker Compose
```bash
docker-compose up --build
```
Access the dashboard at `http://localhost:8000`.

### 3. Manual Build
```bash
# 1. Build Frontend
cd frontend && npm install && npm run build

# 2. Start Backend
cd ../backend && pip install -r requirements.txt && python main.py
```

## 🛠️ Tech Stack

*   **Backend**: FastAPI, SQLAlchemy, SQLite, OpenCV, PyInstaller.
*   **Frontend**: React, Vite, Framer Motion (Animations), Recharts (Analytics), Lucide (Icons).
*   **AI**: YOLOv8 Architecture, Custom Dataset Simulation.

## 🌍 Africa AI Focus
This project is built with a focus on West African industrial needs, including high-performance processing on edge hardware and local language support.

---
© 2026 CornVision AI // Industrial Quality Intelligence Platform
