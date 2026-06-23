#!/bin/bash
echo "=========================================="
echo "   CORNVISION AI STANDALONE STARTER (UNIX)"
echo "=========================================="

# Check for Python
if ! command -v python3 &> /dev/null
then
    echo "[ERROR] Python3 could not be found. Please install it."
    exit
fi

# Build Frontend if missing
if [ ! -f "frontend/dist/index.html" ]; then
    echo "[INFO] Building Frontend..."
    cd frontend
    npm install
    npm run build
    cd ..
fi

# Install Dependencies
echo "[INFO] Installing Backend requirements..."
pip3 install -r backend/requirements.txt

# Start Server
echo "[INFO] Running CornVision AI on http://localhost:8000"
cd backend
python3 main.py
