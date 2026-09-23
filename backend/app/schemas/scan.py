from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class ScanCreateRequest(BaseModel):
    scan_id: Optional[str] = Field(default=None, max_length=64)
    product_name: str = Field(..., min_length=1, max_length=255)
    brand: Optional[str] = Field(default="", max_length=255)
    category: Optional[str] = Field(default="General Packaged Food", max_length=128)
    food_classification: Optional[str] = Field(default="Food Product", max_length=64)
    compliance_status: Optional[str] = Field(default="COMPLIANT", max_length=64)
    health_rating: Optional[str] = Field(default=None, max_length=64)
    health_score: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    scan_date: Optional[str] = Field(default=None, max_length=32)
    scan_time: Optional[str] = Field(default=None, max_length=32)
    data_payload: Dict[str, Any]
    image_paths: Optional[List[str]] = Field(default_factory=list)

class ScanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    scan_id: str
    user_id: str
    product_name: str
    brand: str
    category: str
    food_classification: str
    compliance_status: str
    health_rating: Optional[str] = None
    health_score: Optional[float] = None
    scan_date: str
    scan_time: str
    data_payload: Dict[str, Any]
    image_paths: List[str]
    created_at: datetime

class QuotaResponse(BaseModel):
    user_id: str
    date: str
    scans_used_today: int
    daily_scan_limit: int
    scans_remaining_today: int
    scans_used_this_month: int
    monthly_scan_limit: int
    global_daily_calls: int
    global_daily_limit: int
