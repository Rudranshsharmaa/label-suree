import pytest
from backend.app.limiter import limiter

def test_rate_limiting_triggers_429(client, test_user_a):
    # Reset storage and enable limiter specifically for this test
    try:
        limiter._limiter.storage.reset()
    except Exception:
        pass

    limiter.enabled = True
    client.app.state.limiter.enabled = True

    try:
        responses = []
        for i in range(7):
            res = client.post("/api/v1/auth/login", json={
                "email": "rate_limit_test_user@labelsure.io",
                "password": "WrongPassword!"
            })
            responses.append(res.status_code)

        # Must contain at least one 429 Too Many Requests
        assert 429 in responses
    finally:
        limiter.enabled = False
        client.app.state.limiter.enabled = False
        try:
            limiter._limiter.storage.reset()
        except Exception:
            pass
