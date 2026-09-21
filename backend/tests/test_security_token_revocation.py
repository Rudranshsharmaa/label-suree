import pytest
from backend.app.models.token import RefreshToken

def test_refresh_token_rotation_and_revocation(client, test_user_a, db_session):
    # 1. Log in to acquire tokens
    login_res = client.post("/api/v1/auth/login", json={
        "email": test_user_a.email,
        "password": "Password123!"
    })
    assert login_res.status_code == 200
    refresh_cookie = login_res.cookies.get("labelsure_refresh_token")
    csrf_token = login_res.json()["csrf_token"]
    assert refresh_cookie is not None

    # 2. Perform silent token refresh
    client.cookies.set("labelsure_refresh_token", refresh_cookie, path="/api/v1/auth")
    client.cookies.set("labelsure_csrf_token", csrf_token, path="/")
    
    refresh_res = client.post(
        "/api/v1/auth/refresh",
        headers={"x-csrf-token": csrf_token}
    )
    assert refresh_res.status_code == 200
    new_data = refresh_res.json()
    assert "access_token" in new_data
    new_refresh_cookie = refresh_res.cookies.get("labelsure_refresh_token")

    # 3. Old refresh token must be rotated
    assert new_refresh_cookie != refresh_cookie

    # 4. TOKEN REUSE DETECTION TEST: Replaying old revoked token triggers full revocation
    client.cookies.set("labelsure_refresh_token", refresh_cookie, path="/api/v1/auth")
    client.cookies.set("labelsure_csrf_token", csrf_token, path="/")
    
    reuse_res = client.post(
        "/api/v1/auth/refresh",
        headers={"x-csrf-token": csrf_token}
    )
    assert reuse_res.status_code == 401
    assert "reused refresh token detected" in reuse_res.json()["detail"].lower()

    # Verify that all active tokens for the user have been revoked
    active_tokens = db_session.query(RefreshToken).filter(
        RefreshToken.user_id == test_user_a.id,
        RefreshToken.is_revoked == False
    ).count()
    assert active_tokens == 0

def test_logout_revokes_token(client, test_user_a, db_session):
    login_res = client.post("/api/v1/auth/login", json={
        "email": test_user_a.email,
        "password": "Password123!"
    })
    refresh_cookie = login_res.cookies.get("labelsure_refresh_token")
    csrf_token = login_res.json()["csrf_token"]

    client.cookies.set("labelsure_refresh_token", refresh_cookie, path="/api/v1/auth")
    client.cookies.set("labelsure_csrf_token", csrf_token, path="/")

    logout_res = client.post(
        "/api/v1/auth/logout",
        headers={"x-csrf-token": csrf_token}
    )
    assert logout_res.status_code == 200

    # Attempting to refresh with logged-out cookie must fail
    client.cookies.set("labelsure_refresh_token", refresh_cookie, path="/api/v1/auth")
    client.cookies.set("labelsure_csrf_token", csrf_token, path="/")

    refresh_attempt = client.post(
        "/api/v1/auth/refresh",
        headers={"x-csrf-token": csrf_token}
    )
    assert refresh_attempt.status_code == 401
