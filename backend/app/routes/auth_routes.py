import json
import secrets
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.database import get_db
from backend.app.limiter import limiter
from backend.app.models.user import User
from backend.app.models.token import RefreshToken, PasswordResetToken
from backend.app.models.quota import UserQuota
from backend.app.models.scan import Scan
from backend.app.schemas.auth import (
    SignupRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    DeleteAccountRequest,
    GenericResponse
)
from backend.app.services.auth_service import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_access_token,
    rotate_refresh_token,
    revoke_token,
    revoke_all_user_sessions
)
from backend.app.services.reset_service import create_password_reset_token, reset_password_with_token
from backend.app.services.upload_service import delete_user_files
from backend.app.services.quota_service import get_quota_status
from backend.app.routes.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/signup", response_model=TokenResponse)
@limiter.limit("5/minute")
def signup(request: Request, payload: SignupRequest, response: Response, db: Session = Depends(get_db)):
    """Registers a new user account with Bcrypt password hashing and issues JWT token pair."""
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists."
        )

    user = User(
        full_name=payload.full_name.strip(),
        email=payload.email.lower().strip(),
        hashed_password=get_password_hash(payload.password),
        role=payload.role or "Compliance Reviewer",
        organization=payload.organization or "Independent Auditor"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(user.id, user.email)
    refresh_token, _ = create_refresh_token(db, user.id)
    csrf_token = secrets.token_urlsafe(32)

    # Set secure HttpOnly cookie for refresh token
    response.set_cookie(
        key="labelsure_refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.APP_ENV != "development",
        samesite="strict",
        path="/api/v1/auth",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
    )
    # Set readable cookie for CSRF token
    response.set_cookie(
        key="labelsure_csrf_token",
        value=csrf_token,
        httponly=False,
        secure=settings.APP_ENV != "development",
        samesite="strict",
        path="/",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        csrf_token=csrf_token,
        user=UserResponse.model_validate(user)
    )

@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(request: Request, payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """Authenticates user credentials, issues JWT token pair, and sets HttpOnly refresh cookie."""
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials."
        )

    access_token = create_access_token(user.id, user.email)
    refresh_token, _ = create_refresh_token(db, user.id)
    csrf_token = secrets.token_urlsafe(32)

    response.set_cookie(
        key="labelsure_refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.APP_ENV != "development",
        samesite="strict",
        path="/api/v1/auth",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
    )
    response.set_cookie(
        key="labelsure_csrf_token",
        value=csrf_token,
        httponly=False,
        secure=settings.APP_ENV != "development",
        samesite="strict",
        path="/",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        csrf_token=csrf_token,
        user=UserResponse.model_validate(user)
    )

@router.post("/refresh", response_model=TokenResponse)
def refresh_session(request: Request, response: Response, db: Session = Depends(get_db)):
    """Silent token refresh via HttpOnly Refresh Cookie and Refresh Token Rotation (RTR)."""
    refresh_cookie = request.cookies.get("labelsure_refresh_token")
    if not refresh_cookie:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing refresh token cookie."
        )

    new_access_token, new_refresh_token, new_csrf_token = rotate_refresh_token(db, refresh_cookie)

    response.set_cookie(
        key="labelsure_refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=settings.APP_ENV != "development",
        samesite="strict",
        path="/api/v1/auth",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
    )
    response.set_cookie(
        key="labelsure_csrf_token",
        value=new_csrf_token,
        httponly=False,
        secure=settings.APP_ENV != "development",
        samesite="strict",
        path="/",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
    )

    # Fetch user for response
    payload = verify_access_token(new_access_token)
    user = db.query(User).filter(User.id == payload.get("sub")).first()

    return TokenResponse(
        access_token=new_access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        csrf_token=new_csrf_token,
        user=UserResponse.model_validate(user)
    )

@router.post("/logout", response_model=GenericResponse)
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    """Revokes the current session's refresh token and clears auth cookies."""
    refresh_cookie = request.cookies.get("labelsure_refresh_token")
    if refresh_cookie:
        revoke_token(db, refresh_cookie)

    response.delete_cookie(key="labelsure_refresh_token", path="/api/v1/auth")
    response.delete_cookie(key="labelsure_csrf_token", path="/")

    return GenericResponse(success=True, message="Successfully logged out.")

@router.post("/revoke-all", response_model=GenericResponse)
def revoke_all(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Revokes all active refresh tokens and sessions for the current user."""
    count = revoke_all_user_sessions(db, current_user.id)
    return GenericResponse(success=True, message=f"Revoked {count} active sessions.")

@router.post("/forgot-password", response_model=GenericResponse)
@limiter.limit("5/minute")
def forgot_password(request: Request, payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Generates a 256-bit single-use password reset token (15m TTL) and dispatches reset instructions.
    Responds with a generic message to prevent account enumeration.
    """
    create_password_reset_token(db, payload.email)
    return GenericResponse(
        success=True,
        message="If an account with that email address exists, password reset instructions have been sent."
    )

@router.post("/reset-password", response_model=GenericResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Validates 256-bit token, updates password with Bcrypt, and revokes all active sessions."""
    reset_password_with_token(db, payload.token, payload.new_password)
    return GenericResponse(
        success=True,
        message="Password has been reset successfully. Please log in with your new password."
    )

@router.delete("/delete-account", response_model=GenericResponse)
def delete_account(
    payload: DeleteAccountRequest,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Executes transactional cascading account deletion:
    1. Re-authenticates current password.
    2. Atomically deletes user records, tokens, quotas, and scans.
    3. Safely deletes physical packaging image files from disk.
    4. Clears authentication cookies.
    """
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Account deletion aborted for security."
        )

    # Collect all image file paths for physical deletion
    user_scans = db.query(Scan).filter(Scan.user_id == current_user.id).all()
    all_image_paths = []
    for s in user_scans:
        try:
            paths = json.loads(s.image_paths or "[]")
            all_image_paths.extend(paths)
        except Exception:
            pass

    # Atomic Database Transaction
    with db.begin_nested():
        db.query(RefreshToken).filter(RefreshToken.user_id == current_user.id).delete()
        db.query(PasswordResetToken).filter(PasswordResetToken.user_id == current_user.id).delete()
        db.query(UserQuota).filter(UserQuota.user_id == current_user.id).delete()
        db.query(Scan).filter(Scan.user_id == current_user.id).delete()
        db.query(User).filter(User.id == current_user.id).delete()
    
    db.commit()

    # Physical File Cleanup with retryable error logging
    delete_user_files(db, current_user.id, all_image_paths)

    # Clear Cookies
    response.delete_cookie(key="labelsure_refresh_token", path="/api/v1/auth")
    response.delete_cookie(key="labelsure_csrf_token", path="/")

    return GenericResponse(success=True, message="Account and all associated audit data permanently deleted.")

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Returns profile and real-time quota usage status for the authenticated user."""
    quota_info = get_quota_status(db, current_user.id)
    return {
        "user": UserResponse.model_validate(current_user),
        "quota": quota_info
    }
