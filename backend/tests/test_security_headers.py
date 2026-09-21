import pytest

def test_production_security_headers_present(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200

    headers = response.headers
    # 1. MIME Sniffing protection
    assert headers.get("x-content-type-options") == "nosniff"

    # 2. Clickjacking / Framing defense
    assert headers.get("x-frame-options") == "DENY"

    # 3. Referrer Policy
    assert headers.get("referrer-policy") == "strict-origin-when-cross-origin"

    # 4. Permissions Policy
    assert "camera=(self)" in headers.get("permissions-policy", "")

    # 5. Content Security Policy
    csp = headers.get("content-security-policy", "")
    assert "default-src 'self'" in csp
    assert "frame-ancestors 'none'" in csp

def test_hsts_header_on_https_request(client):
    response = client.get("/api/v1/health", headers={"x-forwarded-proto": "https"})
    assert response.status_code == 200
    assert "max-age=31536000" in response.headers.get("strict-transport-security", "")
