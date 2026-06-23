import uvicorn
import os
import sys
from backend.main import app

if __name__ == "__main__":
    # This entrypoint simplifies PyInstaller tracking
    uvicorn.run(app, host="0.0.0.0", port=8000)
