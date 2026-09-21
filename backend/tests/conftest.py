import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.main import app
from backend.app.database import Base, get_db
from backend.app.models.user import User
from backend.app.services.auth_service import get_password_hash, create_access_token

from backend.app.limiter import limiter

# In-Memory SQLite Test Database
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Disable rate limiter for testing by default
limiter.enabled = False
app.state.limiter.enabled = False

@pytest.fixture(scope="function")
def db_session():
    """Creates a fresh in-memory database schema for each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI TestClient with overridden database dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    limiter.enabled = False
    app.state.limiter.enabled = False
    try:
        limiter._limiter.storage.reset()
    except Exception:
        pass

    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    limiter.enabled = False
    app.state.limiter.enabled = False
    try:
        limiter._limiter.storage.reset()
    except Exception:
        pass

@pytest.fixture(scope="function")
def test_user_a(db_session):
    """Creates User A for testing."""
    user = User(
        id="usr_test_a_001",
        full_name="Alice Auditor",
        email="alice@labelsure.io",
        hashed_password=get_password_hash("Password123!"),
        role="Compliance Reviewer",
        organization="Alpha Labs"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
def test_user_b(db_session):
    """Creates User B for IDOR and cross-tenant testing."""
    user = User(
        id="usr_test_b_002",
        full_name="Bob Inspector",
        email="bob@labelsure.io",
        hashed_password=get_password_hash("Password456!"),
        role="Quality Analyst",
        organization="Beta Foods"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
def auth_headers_user_a(test_user_a):
    token = create_access_token(test_user_a.id, test_user_a.email)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="function")
def auth_headers_user_b(test_user_b):
    token = create_access_token(test_user_b.id, test_user_b.email)
    return {"Authorization": f"Bearer {token}"}
