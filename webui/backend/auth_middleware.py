"""
Basic Authentication Middleware for Posterizarr Web UI
Version 2 - Blocks EVERYTHING including static files
"""

from fastapi import Request, HTTPException, status
from fastapi.responses import Response, HTMLResponse
from starlette.middleware.base import BaseHTTPMiddleware
import base64
import secrets
import logging
import bcrypt
from pathlib import Path
import json

# ============================================================================
# LOGGER SETUP
# ============================================================================
logger = logging.getLogger(__name__)

auth_logger = logging.getLogger("posterizarr.auth")
auth_logger.setLevel(logging.INFO)

if not auth_logger.handlers:
    try:
        if Path("/.dockerenv").exists():
            LOGS_DIR = Path("/config/UILogs")
        else:
            LOGS_DIR = Path(__file__).parent.parent.parent / "UILogs"

        LOGS_DIR.mkdir(exist_ok=True)

        # Handler 1: AuthServer.log (separate auth log)
        auth_log_path = LOGS_DIR / "AuthServer.log"
        if auth_log_path.exists():
            auth_log_path.unlink()
            logger.info(f"Cleared old AuthServer.log")

        auth_handler = logging.FileHandler(auth_log_path, encoding="utf-8", mode="w")
        auth_handler.setFormatter(
            logging.Formatter(
                "[%(asctime)s] [%(levelname)-8s] |AUTH| %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S",
            )
        )
        auth_logger.addHandler(auth_handler)

        # Handler 2: FrontendUI.log (combined log with backend and UI)
        frontend_log_path = LOGS_DIR / "FrontendUI.log"
        frontend_handler = logging.FileHandler(
            frontend_log_path, encoding="utf-8", mode="a"
        )
        frontend_handler.setFormatter(
            logging.Formatter(
                "[%(asctime)s] [%(levelname)-8s] |AUTH| %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S",
            )
        )
        auth_logger.addHandler(frontend_handler)

        logger.info(f"Auth logger initialized: {auth_log_path}")

    except Exception as e:
        logger.warning(f"Could not initialize auth logger: {e}")

logger = auth_logger


class BasicAuthMiddleware(BaseHTTPMiddleware):
    """
    Basic Authentication Middleware with dynamic config reload
    Blocks ALL requests including static files when enabled
    """

    def __init__(self, app, config_path: Path):
        super().__init__(app)
        self.config_path = config_path

        # Load initial config
        auth_config = self._load_config()
        self.username = auth_config["username"]
        self.password = auth_config["password"]
        self.enabled = auth_config["enabled"]

        if self.enabled:
            auth_logger.info("Basic Auth ENABLED on startup (Full blocking mode)")
            auth_logger.info(f"Username: {self.username}")
        else:
            auth_logger.info("Basic Auth DISABLED on startup")

    def _hash_password(self, plain_password: str) -> str:
        """Hash a password using bcrypt"""
        return bcrypt.hashpw(plain_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def _verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against a hash"""
        try:
            return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
        except ValueError:
            return False
        
    def _load_config(self) -> dict:
        """
        Loads the auth config dynamically from config.json.
        Auto-migrates plain text passwords to hashes if detected.
        """
        default_config = {"enabled": False, "username": "admin", "password": ""}
        
        try:
            if not self.config_path.exists():
                auth_logger.warning("Config file not found, using default auth settings")
                return default_config

            with open(self.config_path, "r", encoding="utf-8") as f:
                config = json.load(f)

            webui_config = config.get("WebUI", {})
            
            # Handle enabled flag
            enabled_value = webui_config.get("basicAuthEnabled", False)
            if isinstance(enabled_value, str):
                enabled = enabled_value.lower() in ["true", "1", "yes"]
            else:
                enabled = bool(enabled_value)

            username = webui_config.get("basicAuthUsername", "admin")
            stored_password = webui_config.get("basicAuthPassword", "posterizarr")

            # --- MIGRATION LOGIC START ---
            # Check if password exists and is NOT a bcrypt hash (doesn't start with $2b$, $2a$, etc.)
            if stored_password and not stored_password.startswith(("$2b$", "$2a$", "$2y$")):
                auth_logger.info("⚠️ Plain text password detected in config. Migrating to secure hash...")
                
                try:
                    # 1. Hash the plain text password
                    hashed_pw = self._hash_password(stored_password)
                    
                    # 2. Update the config object in memory
                    if "WebUI" not in config:
                        config["WebUI"] = {}
                    config["WebUI"]["basicAuthPassword"] = hashed_pw
                    
                    # 3. Write the updated config back to disk immediately
                    with open(self.config_path, "w", encoding="utf-8") as f:
                        json.dump(config, f, indent=2, ensure_ascii=False)
                    
                    auth_logger.info("✅ Password successfully migrated to hash.")
                    stored_password = hashed_pw 
                except Exception as e:
                    auth_logger.error(f"❌ Failed to save migrated password to config.json: {e}")
            # --- MIGRATION LOGIC END ---

            return {
                "enabled": enabled,
                "username": username,
                "password": stored_password, 
            }

        except Exception as e:
            auth_logger.error(f"Error loading auth config: {e}")
            return default_config

    async def dispatch(self, request: Request, call_next):
        # Load config dynamically on every request
        current_config = self._load_config()
        current_enabled = current_config["enabled"]
        current_username = current_config["username"]
        current_password_hash = current_config["password"]

        # Update internal variables if something has changed
        if current_enabled != self.enabled:
            self.enabled = current_enabled
            self.username = current_username
            self.password_hash = current_password_hash 

            if self.enabled:
                auth_logger.info("Auth Status Changed: ENABLED (Full blocking mode)")
            else:
                auth_logger.info("Auth Status Changed: DISABLED")

        # If Basic Auth is disabled, allow through
        if not self.enabled:
            return await call_next(request)

        # Allow auth-check endpoint
        if request.url.path == "/api/auth/check":
            return await call_next(request)

        # Allow root path
        if request.url.path == "/" or request.url.path == "/index.html":
            return await call_next(request)

        # Allow React Router routes (paths without extension not starting with /api/)
        if not request.url.path.startswith("/api/") and "." not in request.url.path.split("/")[-1]:
            return await call_next(request)

        # Allow static files
        frontend_static_extensions = [".html", ".js", ".css", ".map", ".ico", ".svg", ".png", ".jpg", ".jpeg", ".woff", ".woff2", ".ttf"]
        if any(request.url.path.endswith(ext) for ext in frontend_static_extensions):
            return await call_next(request)

        static_paths = ["/poster_assets/", "/test/", "/assets/", "/manual_poster_assets/"]
        if any(request.url.path.startswith(path) for path in static_paths):
            return await call_next(request)

        # Auth Check
        client_ip = request.client.host if request.client else "unknown"
        auth_header = request.headers.get("Authorization")

        if not auth_header or not auth_header.startswith("Basic "):
            auth_logger.warning(f"Unauthorized access | IP: {client_ip} | Path: {request.url.path}")
            return self._unauthorized_response()

        try:
            credentials = base64.b64decode(auth_header[6:]).decode("utf-8")
            username, password = credentials.split(":", 1)

            # 1. Check Username
            username_match = secrets.compare_digest(username, current_username)
            
            # 2. Check Password
            password_match = False
            if current_password_hash:
                password_match = self._verify_password(password, current_password_hash)

            if username_match and password_match:
                if request.url.path == "/":
                    auth_logger.info(f"Successful login | User: {username} | IP: {client_ip}")
                return await call_next(request)
            else:
                auth_logger.warning(f"Failed login attempt | User: {username} | IP: {client_ip}")
                return self._unauthorized_response()

        except Exception as e:
            auth_logger.error(f"Auth error: {e}")
            return self._unauthorized_response()

    def _unauthorized_response(self):
        """
        Returns 401 Unauthorized Response WITHOUT triggering browser popup
        We removed WWW-Authenticate header to prevent browser's built-in login dialog
        Our custom login screen in the frontend handles authentication instead
        """
        return Response(
            content="Unauthorized - Authentication required",
            status_code=status.HTTP_401_UNAUTHORIZED,
            headers={
                # REMOVED: "WWW-Authenticate" header to prevent browser popup
                # The frontend will show our custom login screen instead
                "Cache-Control": "no-cache, no-store, must-revalidate",
            },
        )


def load_auth_config(config_path) -> dict:
    """
    Legacy function for backward compatibility
    """
    try:
        config_file = Path(config_path)
        if not config_file.exists():
            auth_logger.warning("Config file not found, using default auth settings")
            return {"enabled": False, "username": "admin", "password": "posterizarr"}

        with open(config_file, "r", encoding="utf-8") as f:
            config = json.load(f)

        webui_config = config.get("WebUI", {})
        enabled_value = webui_config.get("basicAuthEnabled", False)

        if isinstance(enabled_value, str):
            enabled = enabled_value.lower() in ["true", "1", "yes"]
            auth_logger.info(
                f"Converted string value '{enabled_value}' to boolean: {enabled}"
            )
        else:
            enabled = bool(enabled_value)

        return {
            "enabled": enabled,
            "username": webui_config.get("basicAuthUsername", "admin"),
            "password": webui_config.get("basicAuthPassword", "posterizarr"),
        }

    except Exception as e:
        auth_logger.error(f"Error loading auth config: {e}")
        return {"enabled": False, "username": "admin", "password": "posterizarr"}
