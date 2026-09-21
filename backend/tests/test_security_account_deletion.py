import json
import pytest
from backend.app.models.user import User
from backend.app.models.scan import Scan
from backend.app.models.token import RefreshToken

def test_account_deletion_with_wrong_password_rejected(client, test_user_a, auth_headers_user_a):
    res = client.request(
        "DELETE",
        "/api/v1/auth/delete-account",
        json={"current_password": "WrongPassword!"},
        headers=auth_headers_user_a
    )
    assert res.status_code == 401
    assert "Incorrect password" in res.json()["detail"]

def test_transactional_account_deletion_cascades_all_data(client, test_user_a, auth_headers_user_a, db_session):
    # 1. Create dummy scan and token for User A
    scan = Scan(
        scan_id="SCN-DEL-001",
        user_id=test_user_a.id,
        product_name="Product to be Deleted",
        scan_date="2026-09-21",
        data_payload=json.dumps({"test": True}),
        image_paths=json.dumps([])
    )
    token = RefreshToken(jti="jti_del_001", user_id=test_user_a.id, expires_at=test_user_a.created_at)
    db_session.add(scan)
    db_session.add(token)
    db_session.commit()

    # 2. Delete account with correct password
    delete_res = client.request(
        "DELETE",
        "/api/v1/auth/delete-account",
        json={"current_password": "Password123!"},
        headers=auth_headers_user_a
    )
    assert delete_res.status_code == 200

    # 3. Verify user and all cascading data is wiped from DB
    assert db_session.query(User).filter(User.id == test_user_a.id).first() is None
    assert db_session.query(Scan).filter(Scan.user_id == test_user_a.id).count() == 0
    assert db_session.query(RefreshToken).filter(RefreshToken.user_id == test_user_a.id).count() == 0
