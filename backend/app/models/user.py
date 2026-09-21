import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from backend.app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, default=lambda: f"usr_{uuid.uuid4().hex[:12]}")
    full_name = Column(String(128), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(64), default="Compliance Reviewer")
    organization = Column(String(128), default="Independent Auditor")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
