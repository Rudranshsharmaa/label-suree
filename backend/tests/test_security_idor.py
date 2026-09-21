import json
from datetime import datetime, timedelta
import pytest
from backend.app.models.scan import Scan

def test_idor_cross_user_access_prevention(client, test_user_a, test_user_b, auth_headers_user_a, auth_headers_user_b, db_session):
    # User A creates a proprietary compliance report
    scan = Scan(
        scan_id="SCN-CONFIDENTIAL-001",
        user_id=test_user_a.id,
        product_name="Alice Secret Formula",
        scan_date=datetime.utcnow().strftime("%Y-%m-%d"),
        data_payload=json.dumps({"findings": "Proprietary audit data"}),
        image_paths="[]"
    )
    db_session.add(scan)
    db_session.commit()

    # User A can access it
    res_a = client.get(f"/api/v1/scans/{scan.scan_id}", headers=auth_headers_user_a)
    assert res_a.status_code == 200

    # User B attempts to access User A's report (IDOR Vector)
    res_b = client.get(f"/api/v1/scans/{scan.scan_id}", headers=auth_headers_user_b)
    assert res_b.status_code == 404
    assert "not found or access denied" in res_b.json()["detail"].lower()

    # User B attempts to download User A's PDF
    pdf_b = client.get(f"/api/v1/scans/{scan.scan_id}/report.pdf", headers=auth_headers_user_b)
    assert pdf_b.status_code == 404

    # User B attempts to delete User A's report
    del_b = client.delete(f"/api/v1/scans/{scan.scan_id}", headers=auth_headers_user_b)
    assert del_b.status_code == 404

def test_dynamic_12_month_retention_boundary(client, test_user_a, auth_headers_user_a, db_session):
    now = datetime.utcnow()
    recent_date = (now - timedelta(days=30)).strftime("%Y-%m-%d")
    old_date = (now - timedelta(days=400)).strftime("%Y-%m-%d")

    # Recent scan (within 12 months)
    recent_scan = Scan(
        scan_id="SCN-RECENT-01",
        user_id=test_user_a.id,
        product_name="Recent Biscuit Pack",
        scan_date=recent_date,
        data_payload="{}",
        image_paths="[]"
    )
    # Expired scan (older than 12 months)
    expired_scan = Scan(
        scan_id="SCN-EXPIRED-02",
        user_id=test_user_a.id,
        product_name="Old Archived Pack",
        scan_date=old_date,
        data_payload="{}",
        image_paths="[]"
    )
    db_session.add(recent_scan)
    db_session.add(expired_scan)
    db_session.commit()

    res = client.get("/api/v1/scans", headers=auth_headers_user_a)
    assert res.status_code == 200
    scan_ids = [s["scan_id"] for s in res.json()]

    assert "SCN-RECENT-01" in scan_ids
    assert "SCN-EXPIRED-02" not in scan_ids
