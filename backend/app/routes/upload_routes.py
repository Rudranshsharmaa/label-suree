from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Request, status

from backend.app.limiter import limiter
from backend.app.models.user import User
from backend.app.routes.deps import get_current_user
from backend.app.services.upload_service import validate_and_save_image

router = APIRouter(prefix="/upload", tags=["Upload"])

@router.post("")
@limiter.limit("30/minute")
async def upload_packaging_image(
    request: Request,
    file: UploadFile = File(...),
    view: str = Form(default="front"),
    current_user: User = Depends(get_current_user)
):
    """
    Secure packaging image upload endpoint:
    - Validates binary magic bytes (Pillow inspection)
    - Strips all EXIF metadata
    - Validates dimensions (max 4096px) and file size (max 15MB)
    - Generates secure UUID4 filename in isolated upload storage
    """
    contents = await file.read()
    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file uploaded."
        )

    saved_path, img_format, width, height = validate_and_save_image(
        file_bytes=contents,
        original_filename=file.filename or "image.jpg",
        user_id=current_user.id
    )

    return {
        "success": True,
        "view": view,
        "filename": file.filename,
        "saved_path": saved_path,
        "format": img_format,
        "dimensions": f"{width}x{height}",
        "size_bytes": len(contents)
    }
