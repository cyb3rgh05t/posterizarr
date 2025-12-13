"""
Basic Authentication Middleware for Posterizarr Web UI
Hashed Passwords & Database API Keys (Dual Auth)
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
import sqlite3

# Import ConfigDB locally to avoid circular imports if in same package
try:
    from config_database import ConfigDB
except ImportError:
    from .config_database import ConfigDB

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
        # We don't unlink/clear here to preserve history
        auth_handler = logging.FileHandler(auth_log_path, encoding="utf-8", mode="a")
        auth_handler.setFormatter(
            logging.Formatter(
                "[%(asctime)s] [%(levelname)-8s] |AUTH| %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S",
            )
        )
        auth_logger.addHandler(auth_handler)

        # Handler 2: FrontendUI.log (combined log)
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
    Basic Authentication Middleware with dynamic config reload.
    - Blocks ALL requests including static files when enabled.
    - Uses bcrypt for password hashing.
    - Supports Dual Auth: Basic Auth OR API Key (from Database).
    """

    def __init__(self, app, config_path: Path, db_path: Path):
        super().__init__(app)
        self.config_path = config_path
        self.db_path = db_path
        
        # Initialize ConfigDB for auth checks
        self.auth_db = ConfigDB(db_path, config_path)
        
        # Load initial config
        auth_config = self._load_config()
        self.username = auth_config["username"]
        self.password_hash = auth_config["password"]
        self.enabled = auth_config["enabled"]

        if self.enabled:
            auth_logger.info("Basic Auth ENABLED on startup")
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
        Auto-migrates plain text passwords to hashes.
        Auto-migrates legacy webhook secrets to database.
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
            
            config_changed = False

            # --- PASSWORD MIGRATION LOGIC ---
            # Check if password exists and is NOT a bcrypt hash (doesn't start with $2b$, $2a$, etc.)
            if stored_password and not stored_password.startswith(("$2b$", "$2a$", "$2y$")):
                auth_logger.info("⚠️ Plain text password detected in config. Migrating to secure hash...")
                
                try:
                    hashed_pw = self._hash_password(stored_password)
                    if "WebUI" not in config:
                        config["WebUI"] = {}
                    config["WebUI"]["basicAuthPassword"] = hashed_pw
                    stored_password = hashed_pw
                    config_changed = True
                    auth_logger.info("✅ Password successfully migrated to hash.")
                except Exception as e:
                    auth_logger.error(f"❌ Failed to migrate password: {e}")

            # --- LEGACY SECRET MIGRATION LOGIC ---
            legacy_secret = webui_config.get("webhookSecret")
            if legacy_secret:
                auth_logger.info("⚠️ Legacy webhook secret found in config. Migrating to database API Keys...")
                try:
                    # Ensure table exists
                    self.auth_db.create_tables()
                    # Add to DB
                    self.auth_db.add_api_key("Migrated Legacy Secret", legacy_secret)
                    # Remove from config
                    del config["WebUI"]["webhookSecret"]
                    config_changed = True
                    auth_logger.info("✅ Legacy secret migrated to API Keys database and removed from config.")
                except Exception as e:
                    auth_logger.error(f"❌ Failed to migrate legacy secret: {e}")

            # Save if any changes were made
            if config_changed:
                try:
                    with open(self.config_path, "w", encoding="utf-8") as f:
                        json.dump(config, f, indent=2, ensure_ascii=False)
                except Exception as e:
                    auth_logger.error(f"Failed to save updated config: {e}")

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

        #  Always allow auth-check endpoint (for frontend status check)
        if request.url.path == "/api/auth/check":
            return await call_next(request)

        # Allow root path (/) to load index.html - MUST BE FIRST
        if request.url.path == "/" or request.url.path == "/index.html":
            return await call_next(request)

        #  Allow ALL paths that might be React Router routes (no file extension)
        if (
            not request.url.path.startswith("/api/")
            and "." not in request.url.path.split("/")[-1]
        ):
            return await call_next(request)

        #  Allow frontend static files
        frontend_static_extensions = [
            ".html", ".js", ".css", ".map", ".ico", ".svg", ".png", ".jpg", ".jpeg", ".woff", ".woff2", ".ttf",
        ]
        if any(request.url.path.endswith(ext) for ext in frontend_static_extensions):
            return await call_next(request)

        #  Allow static asset paths
        static_paths = [
            "/poster_assets/",  # Poster images
            "/test/",  # Test images
            "/assets/",  # General assets
            "/manual_poster_assets/", # Manual assets
        ]
        if any(request.url.path.startswith(path) for path in static_paths):
            return await call_next(request)

        # =========================================================
        # 1. API KEY / WEBHOOK CHECK (Both Ways Support)
        # =========================================================
        # Check query parameters (?secret=... or ?api_key=...)
        api_key_candidate = request.query_params.get("secret") or request.query_params.get("api_key")
        
        # Check Headers (X-API-Key)
        if not api_key_candidate:
            api_key_candidate = request.headers.get("X-API-Key")

        if api_key_candidate:
            # Validate against Database
            if self.auth_db.validate_api_key(api_key_candidate):
                # auth_logger.info(f"Authenticated via API Key | Path: {request.url.path}")
                return await call_next(request)
            else:
                auth_logger.warning(f"Invalid API Key attempt | IP: {request.client.host} | Path: {request.url.path}")
                # We continue to Basic Auth check below, which will likely fail and show prompt

        # =========================================================
        # 2. BASIC AUTHENTICATION CHECK
        # =========================================================
        client_ip = request.client.host if request.client else "unknown"
        auth_header = request.headers.get("Authorization")

        if not auth_header or not auth_header.startswith("Basic "):
            auth_logger.warning(
                f"Unauthorized access | IP: {client_ip} | Path: {request.url.path}"
            )
            return self._unauthorized_response()

        try:
            # Decode Base64 credentials
            credentials = base64.b64decode(auth_header[6:]).decode("utf-8")
            username, password = credentials.split(":", 1)

            # Use secrets.compare_digest for timing-safe comparison
            username_match = secrets.compare_digest(username, current_username)
            
            # Verify hashed password
            password_match = False
            if current_password_hash:
                password_match = self._verify_password(password, current_password_hash)

            if username_match and password_match:
                # Auth successful - only log on first successful login
                if request.url.path == "/":
                    auth_logger.info(
                        f"Successful login | User: {username} | IP: {client_ip}"
                    )
                response = await call_next(request)
                return response
            else:
                # Auth failed
                auth_logger.warning(
                    f"Failed login attempt | User: {username} | IP: {client_ip}"
                )
                return self._unauthorized_response()

        except Exception as e:
            auth_logger.error(f"Auth error: {e}")
            return self._unauthorized_response()

    def _unauthorized_response(self):
        """
        Returns 401 Unauthorized Response WITHOUT triggering browser popup
        """
        return Response(
            content="Unauthorized - Authentication required",
            status_code=status.HTTP_401_UNAUTHORIZED,
            headers={
                # REMOVED: "WWW-Authenticate" header to prevent browser popup
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