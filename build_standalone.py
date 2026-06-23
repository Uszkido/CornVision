import os
import subprocess
import shutil
import sys

def build():
    print("--- Starting CornVision AI Build Process ---")
    
    # 0. Ensure directory structure
    print("[0/3] Preparing directories...")
    os.makedirs(os.path.join(os.getcwd(), "ai_models", "processed"), exist_ok=True)

    # 1. Build Frontend
    print("[1/3] Building Frontend...")
    frontend_dir = os.path.join(os.getcwd(), "frontend")
    if os.path.exists(frontend_dir):
        subprocess.run("npm install && npm run build", shell=True, cwd=frontend_dir)
    else:
        print("Error: Frontend directory not found")
        return

    # 2. Prepare PyInstaller Command
    print("[2/3] Preparing PyInstaller...")
    
    # Data flags (Syntax varies slightly by OS, but this is the general approach)
    # Windows: ;  Linux/Mac: :
    sep = ";" if sys.platform == "win32" else ":"
    
    data_args = [
        f'--add-data "frontend/dist{sep}frontend/dist"',
        f'--add-data "ai_models/test_images{sep}ai_models/test_images"',
        f'--add-data "ai_models/processed{sep}ai_models/processed"'
    ]
    
    # Dependencies that might need hidden imports
    hidden_imports = [
        "--hidden-import=uvicorn.logging",
        "--hidden-import=uvicorn.loops",
        "--hidden-import=uvicorn.loops.auto",
        "--hidden-import=uvicorn.protocols",
        "--hidden-import=uvicorn.protocols.http",
        "--hidden-import=uvicorn.protocols.http.auto",
        "--hidden-import=uvicorn.protocols.websockets",
        "--hidden-import=uvicorn.protocols.websockets.auto",
        "--hidden-import=uvicorn.lifespan",
        "--hidden-import=uvicorn.lifespan.on"
    ]
    
    cmd = [
        "pyinstaller",
        "--noconfirm",
        "--onefile",
        "--name CornVisionAI",
        *data_args,
        *hidden_imports,
        "entrypoint.py"
    ]
    
    # 3. Execute Build
    print(f"[3/3] Executing: {' '.join(cmd)}")
    subprocess.run(" ".join(cmd), shell=True)
    
    print("\n--- Build Complete! ---")
    print("Your standalone EXE can be found in the 'dist' folder.")

if __name__ == "__main__":
    build()
