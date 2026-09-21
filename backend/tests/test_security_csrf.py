import pytest

def test_cookie_refresh_without_csrf_token_rejected(client, test_user_a):
    login_res = client.post("/api/v1/auth/login", json={
        "email": test_user_a.email,
        "password": "Password123!"
    })
    assert login_res.status_code == 200
    refresh_cookie = login_res.cookies.get("labelsure_refresh_token")
    csrf_token = login_res.json()["csrf_token"]

    # 1. Attempt refresh with cookie but WITHOUT X-CSRF-Token header
    client.cookies.set("labelsure_refresh_token", refresh_cookie, path="/api/v1/auth")
    client.cookies.set("labelsure_csrf_token", csrf_token, path="/")

    res_no_csrf = client.post("/api/v1/auth/refresh")
    assert res_no_csrf.status_code == 403
    assert "CSRF verification failed" in res_no_csrf.json()["detail"]

    # 2. Attempt refresh with INVALID X-CSRF-Token header
    res_bad_csrf = client.post(
        "/api/v1/auth/refresh",
        headers={"x-csrf-token": "tampered_fake_csrf_token_123"}
    )
    assert res_bad_csrf.status_code == 403
    assert "CSRF verification failed" in res_bad_csrf.json()["detail"]

    # 3. Attempt refresh with VALID X-CSRF-Token header -> Succeeds
    res_valid = client.post(
        "/api/v1/auth/refresh",
        headers={"x-csrf-token": csrf_token}
    )
    assert res_valid.status_code == 200
