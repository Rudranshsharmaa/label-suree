from http.server import BaseHTTPRequestHandler
import json
import sys
import os

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        installed_modules = {}
        for mod in ["fastapi", "pydantic", "sqlalchemy", "slowapi", "bcrypt", "jwt", "PIL", "requests", "uvicorn"]:
            try:
                __import__(mod)
                installed_modules[mod] = "OK"
            except Exception as ex:
                installed_modules[mod] = f"FAILED: {str(ex)}"
                
        backend_app_status = "UNKNOWN"
        backend_err = None
        try:
            CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
            ROOT_DIR = os.path.dirname(CURRENT_DIR)
            for path in [CURRENT_DIR, ROOT_DIR, os.getcwd()]:
                if path and path not in sys.path:
                    sys.path.insert(0, path)
            from backend.app.main import app
            backend_app_status = f"SUCCESS: {app.title}"
        except Exception as e:
            import traceback
            backend_app_status = f"FAILED: {str(e)}"
            backend_err = traceback.format_exc()

        data = {
            "status": "Vercel Python Diagnostic",
            "python_version": sys.version,
            "modules": installed_modules,
            "backend_app": backend_app_status,
            "backend_error_traceback": backend_err,
            "cwd": os.getcwd(),
            "sys_path": sys.path,
            "files": os.listdir(os.getcwd()) if os.path.exists(os.getcwd()) else []
        }
        self.wfile.write(json.dumps(data, indent=2).encode('utf-8'))

    def do_POST(self):
        self.do_GET()
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()
