import uuid
from typing import Optional
from fastapi import Depends, HTTPException, Request, Header, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.services.auth_service import verify_access_token

security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Extracts Bearer token from Authorization header, validates signature and expiration,
    and returns the authenticated User entity.
    """
    token = credentials.credentials
    payload = verify_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials."
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Authenticated user no longer exists."
        )
    return user

def get_current_user_or_anonymous(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security),
    x_anonymous_session_id: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> dict:
    """
    Returns authenticated User if Bearer token present, OR an anonymous user context
    with a client-provided or generated anonymous session ID.
    """
    if credentials:
        token = credentials.credentials
        try:
            payload = verify_access_token(token)
            user_id = payload.get("sub")
            if user_id:
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    return {
                        "is_anonymous": False,
                        "user_id": user.id,
                        "email": user.email,
                        "user": user
                    }
        except Exception:
            pass

    anon_id = x_anonymous_session_id or request.cookies.get("labelsure_anon_session")
    if not anon_id:
        anon_id = f"anon_{uuid.uuid4().hex[:12]}"

    return {
        "is_anonymous": True,
        "user_id": anon_id,
        "email": f"{anon_id}@anonymous.labelsure.io",
        "user": None
    }
