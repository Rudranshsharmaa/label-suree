from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from backend.app.config import settings
from backend.app.database import engine, Base
from backend.app.limiter import limiter
from backend.app.middleware.security_headers import SecurityHeadersMiddleware
from backend.app.middleware.csrf_middleware import CSRFProtectionMiddleware
from backend.app.routes import auth_routes, upload_routes, scan_routes, analyze_routes

# Initialize Database Schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs" if settings.APP_ENV != "production" else None,
    openapi_url="/openapi.json" if settings.APP_ENV != "production" else None,
    redoc_url=None
)

@app.get("/api/docs", include_in_schema=False)
def api_docs_alias():
    return RedirectResponse(url="/docs")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 1. Custom Security Response Headers Middleware (HSTS, CSP, nosniff, DENY framing)
app.add_middleware(SecurityHeadersMiddleware)

# 2. CSRF Defense Middleware for Cookie Refresh
app.add_middleware(CSRFProtectionMiddleware)

# 3. CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]
)

# Include API Routers
app.include_router(auth_routes.router, prefix="/api/v1")
app.include_router(upload_routes.router, prefix="/api/v1")
app.include_router(scan_routes.router, prefix="/api/v1")
app.include_router(analyze_routes.router, prefix="/api/v1")

@app.get("/api/v1/health", tags=["Health"])
def health_check():
    return {
        "status": "HEALTHY",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.APP_ENV
    }
