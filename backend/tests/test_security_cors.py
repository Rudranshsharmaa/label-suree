import pytest

def test_cors_allowed_origin(client):
    headers = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
    }
    response = client.options("/api/v1/auth/login", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"

def test_cors_disallowed_origin(client):
    headers = {
        "Origin": "http://malicious-attacker-domain.com",
        "Access-Control-Request-Method": "POST",
    }
    response = client.options("/api/v1/auth/login", headers=headers)
    # When disallowed origin, access-control-allow-origin is NOT returned
    assert response.headers.get("access-control-allow-origin") != "http://malicious-attacker-domain.com"
