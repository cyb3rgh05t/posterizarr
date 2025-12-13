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
        self.auth_db = None
        
        # Try to load ConfigDB
        try:
            from config_database import ConfigDB
            self.auth_db = ConfigDB(db_path, config_path)
            logger.info("AUTH: Database connection established")
        except Exception as e:
            logger.error(f"AUTH: Database error: {e}")

        # Initial config load
        self._load_config()
        logger.info(f"AUTH: Middleware Initialized (Enabled: {self.enabled}, User: {self.username})")

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
            
            # --- ROBUST CONFIG LOADING ---
            # 1. Look for settings in the "WebUI" group (Nested)
            webui = config.get("WebUI", {})
            enabled_nested = webui.get("basicAuthEnabled")
            user_nested = webui.get("basicAuthUsername")
            pass_nested = webui.get("basicAuthPassword")

            # 2. Look for settings at the Root (Flat)
            enabled_root = config.get("basicAuthEnabled")
            user_root = config.get("basicAuthUsername")
            pass_root = config.get("basicAuthPassword")

            # 3. Prioritize: Use Root if present, otherwise Nested
            enabled_val = enabled_root if enabled_root is not None else enabled_nested
            user_val = user_root if user_root is not None else (user_nested or "admin")
            pass_val = pass_root if pass_root is not None else (pass_nested or "posterizarr")

            # Convert to boolean safely
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
        
        # 1. API Key Check (Always check this first)
        api_key_candidate = request.query_params.get("api_key") or request.query_params.get("secret") or request.headers.get("X-API-Key")
        if api_key_candidate and self.auth_db:
            if self.auth_db.validate_api_key(api_key_candidate):
                return await call_next(request)

        # 2. Webhook Hard Block
        if path.startswith("/api/webhook/"):
            return self._unauthorized_response()

        # 3. Whitelist Static Files & Frontend (CRITICAL FIX)
        # If the request is NOT for the API, let it pass so the UI can load.
        # The UI will then make API calls which WILL be caught by step 4.
        if not path.startswith("/api/"):
             return await call_next(request)

        # 4. Public Access Logic (When Basic Auth is DISABLED)
        if not self.enabled:
            # Prevent direct API access to sensitive endpoints without browser headers
            if path.startswith("/api/config") or path.startswith("/api/auth/keys"):
                referer = request.headers.get("referer", "")
                origin = request.headers.get("origin", "")
                host = request.headers.get("host", "")

                is_valid_source = False
                if host:
                    if referer and host in referer: is_valid_source = True
                    if origin and host in origin: is_valid_source = True
                
                if not is_valid_source:
                    return self._unauthorized_response()

            return await call_next(request)

        # 5. Basic Auth Logic (When Basic Auth is ENABLED)
        # Allow pre-flight OPTIONS requests for CORS and auth check
        if request.method == "OPTIONS" or path == "/api/auth/check":
            return await call_next(request)

        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Basic "):
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
        """
        Returns 401 Unauthorized Response WITHOUT triggering browser popup.
        Crucial for custom frontend login screens.
        """
        return Response(
            content="Unauthorized", 
            status_code=status.HTTP_401_UNAUTHORIZED, 
            headers={
                # DO NOT ADD "WWW-Authenticate" here! It causes the double prompt.
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
        )

# Helper function for main.py (Standalone)
def load_auth_config(config_path: Path) -> dict:
    """Helper for main.py to check auth status without instantiating middleware"""
    default_config = {"enabled": False}
    try:
        if not config_path.exists():
            return default_config
            
        with open(config_path, "r", encoding="utf-8") as f:
            config = json.load(f)
            
        # Check both locations
        val_root = config.get("basicAuthEnabled")
        val_nested = config.get("WebUI", {}).get("basicAuthEnabled")
        
        enabled = val_root if val_root is not None else val_nested
        return {"enabled": str(enabled).lower() in ["true", "1", "yes"]}
    except Exception:
        return default_config