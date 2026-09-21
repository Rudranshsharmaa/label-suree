import uuid
from datetime import datetime, timedelta, timezone
from typing import Tuple, Optional, Dict, Any
import jwt
import bcrypt
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.app.config import settings
from backend.app.models.user import User
from backend.app.models.token import RefreshToken

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies plaintext password against Bcrypt hash using native bcrypt."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8")[:72], hashed_password.encode("utf-8"))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Generates a secure salted Bcrypt hash with work factor 12 using native bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8")[:72], salt).decode("utf-8")

def create_access_token(user_id: str, email: str) -> str:
    """Creates a short-lived cryptographically signed Access Token (15 min)."""
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "email": email,
        "type": "access",
        "exp": expire,
        "iat": now
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_refresh_token(db: Session, user_id: str) -> Tuple[str, str]:
    """
    Creates a long-lived Refresh Token (7 days) and records its JTI in the database.
    Returns (token_str, jti).
    """
    jti = uuid.uuid4().hex
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": user_id,
        "jti": jti,
        "type": "refresh",
        "exp": expire,
        "iat": now
    }
    token_str = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    db_token = RefreshToken(
        jti=jti,
        user_id=user_id,
        is_revoked=False,
        expires_at=expire
    )
    db.add(db_token)
    db.commit()
    return token_str, jti

def verify_access_token(token: str) -> Dict[str, Any]:
    """Decodes and validates an Access Token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type."
            )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token has expired."
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials."
        )

def rotate_refresh_token(db: Session, refresh_token_str: str) -> Tuple[str, str, str]:
    """
    Implements Refresh Token Rotation (RTR).
    Detects token reuse and immediately invalidates all active user sessions if detected.
    Returns (new_access_token, new_refresh_token, new_csrf_token).
    """
    try:
        payload = jwt.decode(refresh_token_str, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token has expired.")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token.")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type.")

    user_id = payload.get("sub")
    jti = payload.get("jti")

    db_token = db.query(RefreshToken).filter(RefreshToken.jti == jti).first()

    if not db_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token not recognized.")

    # TOKEN REUSE DETECTION TRIGGER
    if db_token.is_revoked:
        # Revoke ALL active tokens for this user immediately
        db.query(RefreshToken).filter(RefreshToken.user_id == user_id).update({"is_revoked": True})
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Security Alert: Compromised or reused refresh token detected. All active sessions have been revoked."
        )

    # Invalidate the used token
    db_token.is_revoked = True
    db.commit()

    # Issue fresh token pair
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    new_access_token = create_access_token(user.id, user.email)
    new_refresh_token, _ = create_refresh_token(db, user.id)
    new_csrf_token = uuid.uuid4().hex

    return new_access_token, new_refresh_token, new_csrf_token

def revoke_token(db: Session, refresh_token_str: str) -> bool:
    """Revokes a specific refresh token by JTI on logout."""
    try:
        payload = jwt.decode(refresh_token_str, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        jti = payload.get("jti")
        if jti:
            db_token = db.query(RefreshToken).filter(RefreshToken.jti == jti).first()
            if db_token:
                db_token.is_revoked = True
                db.commit()
                return True
    except Exception:
        pass
    return False

def revoke_all_user_sessions(db: Session, user_id: str) -> int:
    """Revokes all active refresh tokens for a given user account."""
    count = db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id,
        RefreshToken.is_revoked == False
    ).update({"is_revoked": True})
    db.commit()
    return count
