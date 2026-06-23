@echo off
echo ==========================================
echo    CORNVISION AI STANDALONE STARTER (WIN)
echo ==========================================
echo.

:: Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install Python 3.9+.
    pause
    exit /b
)

:: Check for Frontend Build
if not exist "frontend\dist\index.html" (
    echo [WARNING] Frontend build not found.
    echo [INFO] Building React app...
    cd frontend
    call npm install
    call npm run build
    cd ..
)

:: Install Dependencies
echo [INFO] Updating Python dependencies...
pip install -r backend\requirements.txt

:: Launch Backend (Serving Frontend)
echo [INFO] Starting CornVision AI Server on http://localhost:8000
cd backend
python main.py
pause
