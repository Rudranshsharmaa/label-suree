import os
import sqlite3
from datetime import datetime
from backend.app.config import settings

def perform_sqlite_backup(backup_dir: str = "./backend/data/backups") -> str:
    """
    Executes a safe, lock-free, zero-downtime SQLite online backup
    using the official Python sqlite3 Connection.backup() API.
    """
    os.makedirs(backup_dir, exist_ok=True)
    source_db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    
    if not os.path.exists(source_db_path):
        raise FileNotFoundError(f"Database file not found at {source_db_path}")

    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    dest_db_path = os.path.join(backup_dir, f"labelsure_backup_{timestamp}.db")

    source_conn = sqlite3.connect(source_db_path)
    dest_conn = sqlite3.connect(dest_db_path)

    try:
        # Atomic online lock-free backup
        source_conn.backup(dest_conn)
        print(f"[BACKUP SUCCESS] Successfully backed up database to {dest_db_path}")
        return dest_db_path
    finally:
        dest_conn.close()
        source_conn.close()

if __name__ == "__main__":
    perform_sqlite_backup()
