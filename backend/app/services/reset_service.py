import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.app.config import settings
from backend.app.models.user import User
from backend.app.models.token import PasswordResetToken
from backend.app.services.auth_service import get_password_hash, revoke_all_user_sessions
from backend.app.services.email_service import send_password_reset_email

def hash_token(raw_token: str) -> str:
    """Computes SHA-256 cryptographic hash of a reset token for secure DB storage."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

def create_password_reset_token(db: Session, email: str) -> str:
    """
    Creates a single-use 256-bit entropy password reset token with 15-minute TTL.
    Dispatches email via email_service.
    Returns the raw token string (kept out of logs).
    """
    user = db.query(User).filter(User.email == email.lower().strip()).first()
    if not user:
        # Anti-enumeration: Return dummy token or silently succeed
        return ""

    raw_token = secrets.token_urlsafe(32)
    token_hash = hash_token(raw_token)
    expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES)

    # Invalidate any previous unused reset tokens for this user
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used == False
    ).update({"used": True})

    db_token = PasswordResetToken(
        token_hash=token_hash,
        user_id=user.id,
        used=False,
        expires_at=expires_at
    )
    db.add(db_token)
    db.commit()

    # Dispatch via email service
    send_password_reset_email(user.email, raw_token)
    return raw_token

def reset_password_with_token(db: Session, raw_token: str, new_password: str) -> bool:
    """
    Validates the reset token, updates the password, marks token as used,
    and revokes all existing refresh tokens for the account.
    """
    token_hash = hash_token(raw_token)
    db_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash
    ).first()

    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or unrecognized password reset token."
        )

    if db_token.used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password reset token has already been used."
        )

    if datetime.now(timezone.utc).replace(tzinfo=None) > db_token.expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password reset token has expired."
        )

    user = db.query(User).filter(User.id == db_token.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    # Atomic update
    with db.begin_nested():
        user.hashed_password = get_password_hash(new_password)
        db_token.used = True
        # Invalidate all active sessions for security
        revoke_all_user_sessions(db, user.id)

    db.commit()
    return True
