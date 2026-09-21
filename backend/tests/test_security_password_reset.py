import pytest
from datetime import datetime, timedelta
from backend.app.models.token import PasswordResetToken
from backend.app.services.reset_service import create_password_reset_token

def test_forgot_password_generic_anti_enumeration_response(client, test_user_a):
    # Registered email
    res1 = client.post("/api/v1/auth/forgot-password", json={"email": test_user_a.email})
    assert res1.status_code == 200
    assert "If an account with that email address exists" in res1.json()["message"]

    # Non-registered email returns the exact same generic message
    res2 = client.post("/api/v1/auth/forgot-password", json={"email": "nonexistent@example.com"})
    assert res2.status_code == 200
    assert res2.json()["message"] == res1.json()["message"]

def test_password_reset_token_expiry_and_single_use(client, test_user_a, db_session):
    # Generate token
    raw_token = create_password_reset_token(db_session, test_user_a.email)
    assert len(raw_token) >= 32

    # 1. Reset password successfully
    reset_res = client.post("/api/v1/auth/reset-password", json={
        "token": raw_token,
        "new_password": "NewSecurePassword456!"
    })
    assert reset_res.status_code == 200

    # 2. Re-using the same token must fail (Single-use enforcement)
    reuse_res = client.post("/api/v1/auth/reset-password", json={
        "token": raw_token,
        "new_password": "AnotherPassword789!"
    })
    assert reuse_res.status_code == 400
    assert "already been used" in reuse_res.json()["detail"]

    # 3. Verify user can now log in with the new password
    login_res = client.post("/api/v1/auth/login", json={
        "email": test_user_a.email,
        "password": "NewSecurePassword456!"
    })
    assert login_res.status_code == 200

def test_expired_reset_token_rejection(client, test_user_a, db_session):
    raw_token = create_password_reset_token(db_session, test_user_a.email)

    # Artificially expire the token in DB
    db_token = db_session.query(PasswordResetToken).first()
    db_token.expires_at = datetime.utcnow() - timedelta(minutes=20)
    db_session.commit()

    res = client.post("/api/v1/auth/reset-password", json={
        "token": raw_token,
        "new_password": "BrandNewPassword999!"
    })
    assert res.status_code == 400
    assert "expired" in res.json()["detail"].lower()
