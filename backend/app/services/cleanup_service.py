import os
import json
from sqlalchemy.orm import Session
from backend.app.config import settings
from backend.app.models.token import PendingFileCleanup
from backend.app.models.scan import Scan

def retry_failed_cleanups(db: Session, max_retries: int = 5) -> int:
    """
    Retries deletion of physical files recorded in PendingFileCleanup.
    Deletes records that succeed or exceed max_retries.
    Returns number of files successfully cleaned up.
    """
    pending = db.query(PendingFileCleanup).filter(
        PendingFileCleanup.retry_count < max_retries
    ).all()

    cleaned_count = 0
    for record in pending:
        try:
            if os.path.exists(record.file_path):
                os.remove(record.file_path)
            db.delete(record)
            cleaned_count += 1
        except Exception:
            record.retry_count += 1
            if record.retry_count >= max_retries:
                # Log permanent failure / discard
                db.delete(record)
    
    db.commit()
    return cleaned_count

def cleanup_orphan_files(db: Session) -> int:
    """
    Scans the upload directory and deletes any physical image file
    that is not referenced by any active Scan in the database.
    """
    if not os.path.exists(settings.UPLOAD_DIR):
        return 0

    # 1. Collect all referenced image paths from active database scans
    all_scans = db.query(Scan).all()
    referenced_paths = set()
    for scan in all_scans:
        try:
            paths = json.loads(scan.image_paths or "[]")
            for p in paths:
                referenced_paths.add(os.path.abspath(p))
        except Exception:
            pass

    # 2. Iterate through files in upload directory
    deleted_count = 0
    for fname in os.listdir(settings.UPLOAD_DIR):
        full_path = os.path.abspath(os.path.join(settings.UPLOAD_DIR, fname))
        if os.path.isfile(full_path) and full_path not in referenced_paths:
            try:
                os.remove(full_path)
                deleted_count += 1
            except Exception:
                pass

    return deleted_count
