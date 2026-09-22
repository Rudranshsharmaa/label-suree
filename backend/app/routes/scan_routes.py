import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.scan import Scan
from backend.app.schemas.scan import ScanCreateRequest, ScanResponse, QuotaResponse
from backend.app.services.upload_service import delete_user_files
from backend.app.services.quota_service import get_quota_status, check_and_increment_quota
from backend.app.routes.deps import get_current_user

router = APIRouter(prefix="/scans", tags=["Scans & Reports"])

@router.post("", response_model=ScanResponse)
def create_scan(
    payload: ScanCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Creates a new packaging scan and compliance audit record strictly scoped to current_user."""
    # 1. Enforce user & global scan quotas atomically (raises HTTP 429 if exceeded)
    check_and_increment_quota(db, current_user.id)

    now = datetime.utcnow()
    scan_id = payload.scan_id if (payload.scan_id and payload.scan_id.startswith("SCN-")) else f"SCN-{now.year}-{uuid.uuid4().hex[:6].upper()}"
    
    new_scan = Scan(
        scan_id=scan_id,
        user_id=current_user.id,
        product_name=payload.product_name,
        brand=payload.brand or "",
        category=payload.category or "General Packaged Food",
        food_classification=payload.food_classification or "Food Product",
        compliance_status=payload.compliance_status or "COMPLIANT",
        health_rating=payload.health_rating or "B",
        health_score=payload.health_score or 70.0,
        scan_date=payload.scan_date or now.strftime("%Y-%m-%d"),
        scan_time=payload.scan_time or now.strftime("%H:%M"),
        data_payload=json.dumps(payload.data_payload),
        image_paths=json.dumps(payload.image_paths or [])
    )
    db.add(new_scan)
    db.commit()
    db.refresh(new_scan)

    return format_scan_response(new_scan)

@router.get("", response_model=List[ScanResponse])
def get_user_scans(
    search: Optional[str] = Query(None),
    compliance_status: Optional[str] = Query(None),
    food_classification: Optional[str] = Query(None),
    health_grade: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves scan history strictly scoped to the authenticated user and
    bounded by the dynamic rolling 12-month query retention window.
    """
    now = datetime.now(timezone.utc)
    twelve_months_ago = (now - timedelta(days=365)).strftime("%Y-%m-%d")

    query = db.query(Scan).filter(
        Scan.user_id == current_user.id,
        Scan.scan_date >= twelve_months_ago
    )

    if search:
        search_pattern = f"%{search.lower()}%"
        query = query.filter(
            (Scan.product_name.ilike(search_pattern)) |
            (Scan.brand.ilike(search_pattern)) |
            (Scan.scan_id.ilike(search_pattern))
        )

    if compliance_status and compliance_status.upper() != "ALL":
        query = query.filter(Scan.compliance_status == compliance_status)

    if food_classification and food_classification.upper() != "ALL":
        query = query.filter(Scan.food_classification == food_classification)

    if health_grade and health_grade.upper() != "ALL":
        query = query.filter(Scan.health_rating == health_grade)

    scans = query.order_by(Scan.scan_date.desc(), Scan.scan_time.desc()).all()
    return [format_scan_response(s) for s in scans]

@router.get("/{scan_id}", response_model=ScanResponse)
def get_scan_by_id(
    scan_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves a single scan report with strict ownership authorization.
    Returns 404 if the scan does not exist or does not belong to the user (anti-IDOR).
    """
    scan = db.query(Scan).filter(
        Scan.scan_id == scan_id,
        Scan.user_id == current_user.id
    ).first()

    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan report not found or access denied."
        )

    return format_scan_response(scan)

@router.get("/{scan_id}/report.pdf")
def get_scan_pdf_report(
    scan_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Protected PDF report endpoint. Requires authenticated Bearer token and verifies ownership.
    No unauthenticated or public access permitted.
    """
    scan = db.query(Scan).filter(
        Scan.scan_id == scan_id,
        Scan.user_id == current_user.id
    ).first()

    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report record not found or access denied."
        )

    # Returns validated metadata for authenticated client-side or server-side PDF generator
    return {
        "success": True,
        "scan_id": scan.scan_id,
        "product_name": scan.product_name,
        "authorized_user": current_user.email,
        "download_timestamp": datetime.utcnow().isoformat(),
        "report_data": json.loads(scan.data_payload)
    }

@router.delete("/{scan_id}")
def delete_scan(
    scan_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes a scan record and its associated physical image files from disk."""
    scan = db.query(Scan).filter(
        Scan.scan_id == scan_id,
        Scan.user_id == current_user.id
    ).first()

    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan record not found or access denied."
        )

    try:
        paths = json.loads(scan.image_paths or "[]")
        delete_user_files(db, current_user.id, paths)
    except Exception:
        pass

    db.delete(scan)
    db.commit()
    return {"success": True, "message": "Scan record deleted successfully."}

@router.get("/user/quota", response_model=QuotaResponse)
def get_user_quota(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns quota and usage stats for the authenticated user."""
    stats = get_quota_status(db, current_user.id)
    return QuotaResponse(**stats)

def format_scan_response(scan: Scan) -> ScanResponse:
    try:
        data = json.loads(scan.data_payload)
    except Exception:
        data = {}
    try:
        images = json.loads(scan.image_paths or "[]")
    except Exception:
        images = []

    return ScanResponse(
        id=scan.id,
        scan_id=scan.scan_id,
        user_id=scan.user_id,
        product_name=scan.product_name,
        brand=scan.brand,
        category=scan.category,
        food_classification=scan.food_classification,
        compliance_status=scan.compliance_status,
        health_rating=scan.health_rating,
        health_score=scan.health_score,
        scan_date=scan.scan_date,
        scan_time=scan.scan_time,
        data_payload=data,
        image_paths=images,
        created_at=scan.created_at
    )
