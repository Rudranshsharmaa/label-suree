from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from backend.app.database import Base

class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(String(64), unique=True, index=True, nullable=False)
    user_id = Column(String(64), index=True, nullable=False)
    product_name = Column(String(255), nullable=False)
    brand = Column(String(255), default="")
    category = Column(String(128), default="General Packaged Food")
    food_classification = Column(String(64), default="Food Product")
    compliance_status = Column(String(64), default="COMPLIANT")
    health_rating = Column(String(8), default="B")
    health_score = Column(Float, default=70.0)
    scan_date = Column(String(10), index=True, nullable=False) # YYYY-MM-DD
    scan_time = Column(String(8), default="00:00")
    data_payload = Column(Text, nullable=False)  # JSON-serialized report data
    image_paths = Column(Text, default="[]")     # JSON-serialized list of uploaded image file paths
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
