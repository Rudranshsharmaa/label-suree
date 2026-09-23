from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.limiter import limiter
from backend.app.routes.deps import get_current_user_or_anonymous
from backend.app.services.quota_service import check_and_increment_quota
from backend.app.services.ai_service import analyze_packaging_with_quarantine

router = APIRouter(prefix="/analyze", tags=["Analysis & AI"])

class AnalyzeRequest(BaseModel):
    product_name: Optional[str] = "Scanned Food Product"
    category: Optional[str] = "General Packaged Food"
    image_results: List[Dict[str, Any]] = []

@router.post("")
@limiter.limit("20/minute")
def analyze_packaging(
    request: Request,
    payload: AnalyzeRequest,
    auth_context: dict = Depends(get_current_user_or_anonymous),
    db: Session = Depends(get_db)
):
    """
    Executes packaging analysis pipeline:
    1. Atomically enforces user/anonymous and global Gemini/AI daily quotas (raises 429 if exceeded).
    2. Runs structural prompt-injection quarantine on raw extracted text.
    3. Evaluates statutory compliance under FSS Act 2006 & Legal Metrology.
    4. Computes nutritional health score & grade (A+ to F).
    """
    user_id = auth_context["user_id"]
    # 1. Atomic Quota Enforcement
    check_and_increment_quota(db, user_id)

    # 2. AI & Rule Engine Execution
    analysis_results = analyze_packaging_with_quarantine(
        image_results=payload.image_results,
        product_name=payload.product_name or "Scanned Food Product",
        category=payload.category or "General Packaged Food"
    )

    return {
        "success": True,
        "results": analysis_results
    }
