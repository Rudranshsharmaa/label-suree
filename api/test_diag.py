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
                
        data = {
            "status": "Vercel Python Runtime Active",
            "python_version": sys.version,
            "modules": installed_modules,
            "cwd": os.getcwd(),
            "sys_path": sys.path,
            "files": os.listdir(os.getcwd()) if os.path.exists(os.getcwd()) else []
        }
        self.wfile.write(json.dumps(data, indent=2).encode('utf-8'))
