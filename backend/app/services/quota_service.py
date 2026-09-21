from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from backend.app.config import settings
from backend.app.models.quota import UserQuota, GlobalQuota

def check_and_increment_quota(db: Session, user_id: str, tokens_to_add: int = 0) -> UserQuota:
    """
    Atomically checks and increments user and global quotas within a database transaction.
    Enforces cost protection and prevents API budget exhaustion.
    Raises HTTP 429 if limits are exceeded.
    """
    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")
    month_str = now.strftime("%Y-%m")

    # 1. Global Daily Quota Check & Increment
    global_record = db.query(GlobalQuota).filter(GlobalQuota.date == today_str).first()
    if not global_record:
        global_record = GlobalQuota(date=today_str, daily_ai_calls=0)
        db.add(global_record)
        db.flush()

    if global_record.daily_ai_calls >= settings.GLOBAL_DAILY_GEMINI_CALL_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Global AI analysis capacity reached for today. Please try again tomorrow or use rule-based analysis."
        )

    # 2. User Daily & Monthly Quota Check
    user_record = db.query(UserQuota).filter(
        UserQuota.user_id == user_id,
        UserQuota.date == today_str
    ).first()

    if not user_record:
        # Calculate month-to-date count
        monthly_total = db.query(func.sum(UserQuota.daily_scan_count)).filter(
            UserQuota.user_id == user_id,
            UserQuota.month == month_str
        ).scalar() or 0

        user_record = UserQuota(
            user_id=user_id,
            date=today_str,
            month=month_str,
            daily_scan_count=0,
            monthly_scan_count=int(monthly_total),
            tokens_used=0
        )
        db.add(user_record)
        db.flush()

    if user_record.daily_scan_count >= settings.MAX_SCANS_PER_USER_DAILY:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Daily scan quota ({settings.MAX_SCANS_PER_USER_DAILY} scans/day) exceeded. Please upgrade your plan or try again tomorrow."
        )

    if user_record.monthly_scan_count >= settings.MAX_SCANS_PER_USER_MONTHLY:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Monthly scan quota ({settings.MAX_SCANS_PER_USER_MONTHLY} scans/month) exceeded."
        )

    # Atomic Increment
    user_record.daily_scan_count += 1
    user_record.monthly_scan_count += 1
    user_record.tokens_used += tokens_to_add
    global_record.daily_ai_calls += 1

    db.commit()
    db.refresh(user_record)
    return user_record

def get_quota_status(db: Session, user_id: str) -> dict:
    """Retrieves current usage monitoring statistics for the authenticated user."""
    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")
    month_str = now.strftime("%Y-%m")

    user_record = db.query(UserQuota).filter(
        UserQuota.user_id == user_id,
        UserQuota.date == today_str
    ).first()

    daily_used = user_record.daily_scan_count if user_record else 0
    monthly_used = user_record.monthly_scan_count if user_record else 0

    global_record = db.query(GlobalQuota).filter(GlobalQuota.date == today_str).first()
    global_calls = global_record.daily_ai_calls if global_record else 0

    return {
        "user_id": user_id,
        "date": today_str,
        "scans_used_today": daily_used,
        "daily_scan_limit": settings.MAX_SCANS_PER_USER_DAILY,
        "scans_remaining_today": max(0, settings.MAX_SCANS_PER_USER_DAILY - daily_used),
        "scans_used_this_month": monthly_used,
        "monthly_scan_limit": settings.MAX_SCANS_PER_USER_MONTHLY,
        "global_daily_calls": global_calls,
        "global_daily_limit": settings.GLOBAL_DAILY_GEMINI_CALL_LIMIT
    }
