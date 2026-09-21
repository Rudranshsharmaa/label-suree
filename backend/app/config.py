import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="allow")

    APP_ENV: str = "development"
    PROJECT_NAME: str = "LabelSure Security Platform"
    VERSION: str = "3.3.0"
    
    # Secrets & Cryptography
    SECRET_KEY: str = os.getenv("SECRET_KEY", "labelsure-dev-secret-key-32-chars-minimum-entropy-required-for-hs256")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    PASSWORD_RESET_EXPIRE_MINUTES: int = 15
    
    # AI & Quota Limits (Decoupled from Auth Tokens)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    MAX_SCANS_PER_USER_DAILY: int = 20
    MAX_SCANS_PER_USER_MONTHLY: int = 200
    GLOBAL_DAILY_GEMINI_CALL_LIMIT: int = 1000
    
    # SMTP & Password Reset Delivery
    SMTP_ENABLED: bool = False
    SMTP_HOST: str = "smtp.mailgun.org"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "security@labelsure.io"
    FRONTEND_URL: str = "http://localhost:5173"
    
    # CORS & Network Security
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://label-sure-five.vercel.app"
    ]
    
    # Storage & SQLite (Auto-detect serverless /tmp environment)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:////tmp/labelsure_secure.db" if (os.getenv("VERCEL") or os.getenv("VERCEL_ENV") or os.getenv("AWS_LAMBDA_FUNCTION_NAME") or os.getenv("LAMBDA_TASK_ROOT")) else "sqlite:///./backend/data/labelsure_secure.db"
    )
    UPLOAD_DIR: str = os.getenv(
        "UPLOAD_DIR",
        "/tmp/uploads" if (os.getenv("VERCEL") or os.getenv("VERCEL_ENV") or os.getenv("AWS_LAMBDA_FUNCTION_NAME") or os.getenv("LAMBDA_TASK_ROOT")) else "./backend/uploads"
    )
    MAX_UPLOAD_SIZE_BYTES: int = 15 * 1024 * 1024  # 15 MB
    MAX_IMAGE_DIMENSION: int = 4096

settings = Settings()
