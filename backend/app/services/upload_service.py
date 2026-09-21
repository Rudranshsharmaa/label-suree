import os
import io
import uuid
from typing import Tuple, List
from PIL import Image
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.app.config import settings
from backend.app.models.token import PendingFileCleanup

ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}
EXTENSION_MAP = {"JPEG": "jpg", "PNG": "png", "WEBP": "webp"}

def validate_and_save_image(file_bytes: bytes, original_filename: str, user_id: str) -> Tuple[str, str, int, int]:
    """
    Validates binary header via Pillow magic bytes, strips EXIF metadata,
    enforces dimension/size constraints, and saves with a secure UUID4 filename.
    Returns (saved_path, format, width, height).
    """
    # 1. Size Limit Verification
    if len(file_bytes) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_BYTES / (1024*1024):.0f}MB."
        )

    # 2. Pillow Magic-Bytes & Header Validation
    try:
        image = Image.open(io.BytesIO(file_bytes))
        image.verify() # Verify image header integrity
        # Re-open after verify() as required by Pillow
        image = Image.open(io.BytesIO(file_bytes))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or corrupted image format. Please upload a genuine JPEG, PNG, or WEBP file."
        )

    img_format = image.format
    if img_format not in ALLOWED_FORMATS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image format: {img_format}. Allowed formats are JPEG, PNG, WEBP."
        )

    width, height = image.size
    if width > settings.MAX_IMAGE_DIMENSION or height > settings.MAX_IMAGE_DIMENSION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image dimensions ({width}x{height}) exceed maximum allowed {settings.MAX_IMAGE_DIMENSION}x{settings.MAX_IMAGE_DIMENSION}px."
        )

    # 3. EXIF Stripping & Clean Storage
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = EXTENSION_MAP.get(img_format, "jpg")
    filename = f"{uuid.uuid4().hex}.{ext}"
    saved_path = os.path.join(settings.UPLOAD_DIR, filename)

    # Convert RGBA to RGB for JPEG saving
    if img_format == "JPEG" and image.mode in ("RGBA", "P"):
        image = image.convert("RGB")

    # Save clean image without EXIF metadata
    image.save(saved_path, format=img_format)
    return saved_path, img_format, width, height

def delete_user_files(db: Session, user_id: str, file_paths: List[str]) -> List[str]:
    """
    Safely deletes physical packaging image files from disk.
    If an individual file cannot be deleted immediately (e.g. temporary Windows file lock),
    it records the path in PendingFileCleanup for retryable asynchronous cleanup.
    """
    failed_paths = []
    for path in file_paths:
        if not path or not os.path.exists(path):
            continue
        try:
            os.remove(path)
        except Exception as e:
            failed_paths.append(path)
            # Record in retryable pending table
            cleanup_record = PendingFileCleanup(
                file_path=path,
                user_id=user_id,
                retry_count=0
            )
            db.add(cleanup_record)
    
    if failed_paths:
        db.commit()
    return failed_paths
