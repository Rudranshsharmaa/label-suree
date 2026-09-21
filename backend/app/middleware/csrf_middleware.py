import secrets
import hmac
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from backend.app.config import settings

def generate_csrf_token() -> str:
    """Generates a cryptographically secure 256-bit URL-safe CSRF token."""
    return secrets.token_urlsafe(32)

class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """
    CSRF Defense Middleware tailored for Cookie-authenticated endpoints.
    Pure Bearer-token API calls are immune to CSRF and proceed without overhead.
    """
    COOKIE_REFRESH_PATH = "/api/v1/auth/refresh"
    COOKIE_LOGOUT_PATH = "/api/v1/auth/logout"

    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path
        
        # Enforce CSRF check specifically on Cookie-authenticated refresh / state-change endpoints
        if path in (self.COOKIE_REFRESH_PATH, self.COOKIE_LOGOUT_PATH) and request.method in ("POST", "PUT", "DELETE"):
            # Check if request is relying on cookies
            refresh_cookie = request.cookies.get("labelsure_refresh_token")
            if refresh_cookie:
                header_csrf = request.headers.get("x-csrf-token")
                cookie_csrf = request.cookies.get("labelsure_csrf_token")
                
                # If neither is present or mismatch, reject
                if not header_csrf:
                    return JSONResponse(
                        status_code=403,
                        content={"detail": "CSRF verification failed: Missing X-CSRF-Token header."}
                    )
                if cookie_csrf and not hmac.compare_digest(header_csrf, cookie_csrf):
                    return JSONResponse(
                        status_code=403,
                        content={"detail": "CSRF verification failed: Invalid X-CSRF-Token."}
                    )
        
        return await call_next(request)
