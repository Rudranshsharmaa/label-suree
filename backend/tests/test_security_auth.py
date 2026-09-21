import jwt
import pytest
from backend.app.config import settings
from backend.app.services.auth_service import (
    get_password_hash,
    verify_password,
    create_access_token,
    verify_access_token
)

def test_bcrypt_hashing_and_salt_uniqueness():
    password = "SuperSecretPassword123!"
    hash1 = get_password_hash(password)
    hash2 = get_password_hash(password)

    # Hashes must be unique due to salt generation
    assert hash1 != hash2
    assert hash1.startswith("$2b$") or hash1.startswith("$2a$")
    assert verify_password(password, hash1) is True
    assert verify_password(password, hash2) is True
    assert verify_password("WrongPassword!", hash1) is False

def test_user_signup_success(client):
    payload = {
        "full_name": "Charlie Tester",
        "email": "charlie@labelsure.io",
        "password": "SecurePassword999!",
        "organization": "Compliance Corp"
    }
    response = client.post("/api/v1/auth/signup", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "charlie@labelsure.io"
    assert "labelsure_refresh_token" in response.cookies

def test_duplicate_signup_rejection(client, test_user_a):
    payload = {
        "full_name": "Alice Duplicate",
        "email": test_user_a.email,
        "password": "NewPassword123!"
    }
    response = client.post("/api/v1/auth/signup", json=payload)
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]

def test_login_success_and_invalid_password(client, test_user_a):
    # Valid login
    res_valid = client.post("/api/v1/auth/login", json={
        "email": test_user_a.email,
        "password": "Password123!"
    })
    assert res_valid.status_code == 200
    assert "access_token" in res_valid.json()

    # Invalid password
    res_invalid = client.post("/api/v1/auth/login", json={
        "email": test_user_a.email,
        "password": "WrongPassword!"
    })
    assert res_invalid.status_code == 401

def test_tampered_jwt_rejection(client, test_user_a):
    token = create_access_token(test_user_a.id, test_user_a.email)
    tampered_token = token[:-4] + "abcd"

    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {tampered_token}"})
    assert response.status_code == 401
