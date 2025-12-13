"""
Basic Authentication Middleware for Posterizarr Web UI
"""

from fastapi import Request, HTTPException, status
from fastapi.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware
import base64
import secrets
import logging
import bcrypt
from pathlib import Path
import json

# Use the root logger so output appears in console/BackendServer.log
logger = logging.getLogger(__name__)

class BasicAuthMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, config_path: Path, db_path: Path):
        super().__init__(app)
        self.config_path = config_path
        self.db_path = db_path
        
        # Try to load ConfigDB
        try:
            from config_database import ConfigDB
            self.auth_db = ConfigDB(db_path, config_path)
            logger.info("AUTH: Database connection established")
        except Exception as e:
            logger.error(f"AUTH: Database error: {e}")
            self.auth_db = None

        self._load_config()
        logger.info(f"AUTH: Middleware Initialized (Enabled: {self.enabled})")

    def _verify_password(self, plain_password: str, hashed_password: str) -> bool:
        try:
            return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
        except ValueError:
            return False

    def _load_config(self) -> dict:
        default_config = {"enabled": False, "username": "admin", "password": ""}
        try:
            if not self.config_path.exists(): 
                self.enabled = False
                return default_config
                
            with open(self.config_path, "r", encoding="utf-8") as f: 
                config = json.load(f)
            
            # CHECK 1: Try reading from root (Flat structure)
            enabled_root = config.get("basicAuthEnabled")
            user_root = config.get("basicAuthUsername")
            pass_root = config.get("basicAuthPassword")

            # CHECK 2: Try reading from WebUI group (Grouped structure)
            webui = config.get("WebUI", {})
            enabled_nested = webui.get("basicAuthEnabled")
            user_nested = webui.get("basicAuthUsername")
            pass_nested = webui.get("basicAuthPassword")

            # PRIORITIZE: Use root value if present, otherwise nested
            # This handles cases where config is flat OR grouped
            enabled_val = enabled_root if enabled_root is not None else enabled_nested
            user_val = user_root if user_root is not None else (user_nested or "admin")
            pass_val = pass_root if pass_root is not None else (pass_nested or "posterizarr")

            self.enabled = str(enabled_val).lower() in ["true", "1", "yes"]
            self.username = user_val
            self.password_hash = pass_val
            
        except Exception as e:
            logger.error(f"AUTH: Error loading config: {e}")
            self.enabled = False


    async def dispatch(self, request: Request, call_next):
        # Reload config on every request to support dynamic changes
        self._load_config()
        
        path = request.url.path
        
        # 1. API Key Check (Always check this first to allow scripts/webhooks with keys)
        # Allows legitimate automated access if a valid key is provided
        api_key_candidate = request.query_params.get("api_key") or request.query_params.get("secret") or request.headers.get("X-API-Key")
        if api_key_candidate and self.auth_db:
            if self.auth_db.validate_api_key(api_key_candidate):
                return await call_next(request)

        # 2. Webhook Hard Block
        # These endpoints require specific handling logic and shouldn't be accessed generically
        if path.startswith("/api/webhook/"):
            return self._unauthorized_response()

        # 3. Public Access Logic (When Basic Auth is DISABLED)
        if not self.enabled:
            # STRICT SECURITY CHECK:
            # Even if auth is disabled, sensitive endpoints must NOT be accessible 
            # via direct script calls that lack browser headers (Referer/Origin).
            # This prevents information disclosure (like passwords in config) to simple GET requests.
            if path.startswith("/api/config") or path.startswith("/api/auth/keys"):
                referer = request.headers.get("referer", "")
                origin = request.headers.get("origin", "")
                host = request.headers.get("host", "")

                # Valid UI request must have Host AND (Referer matching Host OR Origin matching Host)
                # CLI tools send Host but typically no Referer/Origin
                is_valid_source = False
                if host:
                    if referer and host in referer: is_valid_source = True
                    if origin and host in origin: is_valid_source = True
                
                if not is_valid_source:
                    logger.warning(f"AUTH: Blocking direct access to {path} (No valid Referer/Origin)")
                    return self._unauthorized_response()

            # For all other endpoints (gallery, logs, etc.) when auth is disabled,
            # we allow access to support the UI and standard functionality.
            
            # Whitelist specific endpoints if needed (e.g. status checks)
            if path in ["/api/auth/check"]:
                return await call_next(request)

            return await call_next(request)

        # 4. Basic Auth Logic (When Basic Auth is ENABLED)
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Basic "):
            # Allow pre-flight OPTIONS requests for CORS
            if request.method == "OPTIONS":
                return await call_next(request)
            return self._unauthorized_response()

        try:
            creds = base64.b64decode(auth_header[6:]).decode("utf-8")
            u, p = creds.split(":", 1)
            # Verify username and password
            if secrets.compare_digest(u, self.username) and self._verify_password(p, self.password_hash):
                return await call_next(request)
        except Exception:
            pass
            
        return self._unauthorized_response()

    def _unauthorized_response(self):
        return Response(
            content="Unauthorized", 
            status_code=status.HTTP_401_UNAUTHORIZED, 
            headers={"WWW-Authenticate": "Basic", "Cache-Control": "no-cache"}
        )
