import os
import sys
import traceback

# Add current directory, parent directory, and project root to sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)

for path in [CURRENT_DIR, ROOT_DIR, os.getcwd()]:
    if path and path not in sys.path:
        sys.path.insert(0, path)

try:
    from backend.app.main import app
except Exception as e:
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    
    app = FastAPI(title="LabelSure Diagnostic Handler")
    err_tb = traceback.format_exc()
    
    @app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"])
    def debug_fallback(path_name: str = ""):
        return JSONResponse(
            status_code=500,
            content={
                "error": "Backend initialization failed",
                "exception": str(e),
                "traceback": err_tb,
                "sys_path": sys.path,
                "cwd": os.getcwd(),
                "dir_contents": os.listdir(os.getcwd()) if os.path.exists(os.getcwd()) else []
            }
        )
