import pytest
from backend.app.config import settings
from backend.app.services.quota_service import check_and_increment_quota, get_quota_status

def test_user_daily_quota_limit_enforcement(client, test_user_a, auth_headers_user_a, db_session):
    # Set artificial low limit for test
    original_limit = settings.MAX_SCANS_PER_USER_DAILY
    settings.MAX_SCANS_PER_USER_DAILY = 3

    try:
        # Perform 3 scans (allowed)
        for i in range(3):
            res = client.post(
                "/api/v1/analyze",
                json={"product_name": f"Product {i}", "image_results": []},
                headers=auth_headers_user_a
            )
            assert res.status_code == 200

        # 4th scan must be rejected with 429 Too Many Requests
        res_overflow = client.post(
            "/api/v1/analyze",
            json={"product_name": "Overflow Product", "image_results": []},
            headers=auth_headers_user_a
        )
        assert res_overflow.status_code == 429
        assert "quota" in res_overflow.json()["detail"].lower()
    finally:
        settings.MAX_SCANS_PER_USER_DAILY = original_limit

def test_usage_monitoring_endpoint(client, test_user_a, auth_headers_user_a):
    res = client.get("/api/v1/scans/user/quota", headers=auth_headers_user_a)
    assert res.status_code == 200
    data = res.json()
    assert "scans_used_today" in data
    assert "daily_scan_limit" in data
    assert "scans_remaining_today" in data
