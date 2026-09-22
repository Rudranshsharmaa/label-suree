import os
import sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)

for path in [CURRENT_DIR, ROOT_DIR, os.getcwd()]:
    if path and path not in sys.path:
        sys.path.insert(0, path)

from backend.app.main import app

handler = app
