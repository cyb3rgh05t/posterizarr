"""
Config Database Module
Manages configuration data in SQLite database
Automatically syncs with config.json on startup
"""

import sqlite3
import json
import logging
from pathlib import Path
from typing import Any, Dict, Optional, List, Tuple
from datetime import datetime
import threading

logger = logging.getLogger(__name__)


class ConfigDB:
    """Database class for managing configuration in SQLite"""

    def __init__(self, db_path: Path, config_json_path: Path):
        """
        Initialize the config database

        Args:
            db_path: Path to the database file
            config_json_path: Path to the config.json file
        """
        self.db_path = db_path
        self.config_json_path = config_json_path
        # REMOVED: self.connection
        self.lock = threading.RLock()  # Thread-safety lock

    def _get_connection(self):
        """Helper to create a new, thread-safe connection"""
        conn = sqlite3.connect(self.db_path, timeout=10)
        conn.row_factory = sqlite3.Row
        return conn

    def connect(self):
        """Establish database connection (now just ensures tables exist)"""
        logger.debug("Initializing config database (checking tables)...")
        self.create_tables()

    def close(self):
        """Close connection - No longer needed."""
        pass

    def create_tables(self):
        """Create the config tables if they don't exist"""
        with self.lock:
            try:
                conn = self._get_connection()
                cursor = conn.cursor()

                # Main config table
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS config (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        section TEXT NOT NULL,
                        key TEXT NOT NULL,
                        value TEXT,
                        value_type TEXT NOT NULL,
                        description TEXT,
                        created_at TIMESTAMP DEFAULT (datetime('now', 'localtime')),
                        updated_at TIMESTAMP DEFAULT (datetime('now', 'localtime')),
                        UNIQUE(section, key)
                    )
                """
                )

                # Indexes
                cursor.execute(
                    """
                    CREATE INDEX IF NOT EXISTS idx_config_section
                    ON config(section)
                """
                )
                cursor.execute(
                    """
                    CREATE INDEX IF NOT EXISTS idx_config_key
                    ON config(section, key)
                """
                )

                # Metadata table
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS config_metadata (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        last_sync_time TIMESTAMP,
                        config_file_path TEXT,
                        sync_status TEXT,
                        sync_message TEXT
                    )
                """
                )

                conn.commit()
                conn.close()
                logger.info("Config database tables created successfully")
            except sqlite3.Error as e:
                logger.error(f"Error creating config tables: {e}")
                if 'conn' in locals():
                    conn.rollback()
                    conn.close()
                raise

    def _get_value_type(self, value: Any) -> str:
        """Determine the type of a value for storage"""
        if isinstance(value, bool):
            return "boolean"
        elif isinstance(value, int):
            return "integer"
        elif isinstance(value, float):
            return "float"
        elif isinstance(value, list):
            return "list"
        elif isinstance(value, dict):
            return "dict"
        else:
            return "string"

    def _serialize_value(self, value: Any) -> str:
        """Serialize a value for storage in the database"""
        if isinstance(value, (list, dict)):
            return json.dumps(value)
        elif isinstance(value, bool):
            return "true" if value else "false"
        else:
            return str(value)

    def _deserialize_value(self, value_str: str, value_type: str) -> Any:
        """Deserialize a value from the database"""
        if value_str is None:
            return None
        try:
            if value_type == "boolean":
                return value_str.lower() == "true"
            elif value_type == "integer":
                return int(value_str)
            elif value_type == "float":
                return float(value_str)
            elif value_type == "list" or value_type == "dict":
                return json.loads(value_str)
            else:
                return value_str
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning(f"Error deserializing value '{value_str}' as type '{value_type}': {e}")
            return value_str # Fallback to string

    def import_from_json(self, config_data: Dict = None):
        """
        Import configuration from JSON data or from config.json file
        Uses a single transaction for performance.
        """
        with self.lock:
            try:
                if config_data is None:
                    if not self.config_json_path.exists():
                        logger.error(f"Config file not found: {self.config_json_path}")
                        return False
                    with open(self.config_json_path, "r", encoding="utf-8") as f:
                        config_data = json.load(f)
                    logger.info(f"Loaded config from: {self.config_json_path}")

                conn = self._get_connection()
                cursor = conn.cursor()
                entries_to_upsert: List[Tuple] = []
                now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S') # Use local time string

                for section, section_data in config_data.items():
                    if not isinstance(section_data, dict):
                        value_type = self._get_value_type(section_data)
                        value_str = self._serialize_value(section_data)
                        entries_to_upsert.append(
                            ("_root", section, value_str, value_type, now_str)
                        )
                        continue
                    for key, value in section_data.items():
                        value_type = self._get_value_type(value)
                        value_str = self._serialize_value(value)
                        entries_to_upsert.append(
                            (section, key, value_str, value_type, now_str)
                        )

                if entries_to_upsert:
                    cursor.executemany(
                        """
                        INSERT INTO config (section, key, value, value_type, updated_at)
                        VALUES (?, ?, ?, ?, ?)
                        ON CONFLICT(section, key)
                        DO UPDATE SET
                            value = excluded.value,
                            value_type = excluded.value_type,
                            updated_at = excluded.updated_at
                        """,
                        entries_to_upsert,
                    )
                    imported_count = cursor.rowcount
                    logger.info(f"Config sync complete: {imported_count} rows affected (inserted or updated)")
                else:
                    imported_count = 0
                    logger.info("Config sync: No entries found in config.json")

                cursor.execute(
                    """
                    INSERT INTO config_metadata (last_sync_time, config_file_path, sync_status, sync_message)
                    VALUES (?, ?, ?, ?)
                """,
                    (
                        now_str, str(self.config_json_path), "success", f"Synced {imported_count} entries",
                    ),
                )
                conn.commit()
                conn.close()
                return True

            except json.JSONDecodeError as e:
                logger.error(f"Error parsing JSON: {e}")
                return False
            except sqlite3.Error as e:
                logger.error(f"Database error during import: {e}")
                if 'conn' in locals():
                    conn.rollback()
                    conn.close()
                return False
            except Exception as e:
                logger.error(f"Unexpected error during import: {e}")
                if 'conn' in locals():
                    conn.rollback()
                    conn.close()
                return False

    def export_to_json(self, output_path: Path = None) -> Dict:
        """Export configuration from database to JSON format"""
        with self.lock:
            try:
                conn = self._get_connection()
                cursor = conn.cursor()
                cursor.execute(
                    """
                    SELECT section, key, value, value_type
                    FROM config
                    ORDER BY section, key
                """
                )

                config_data = {}
                for row in cursor.fetchall():
                    section = row["section"]
                    key = row["key"]
                    value_str = row["value"]
                    value_type = row["value_type"]
                    value = self._deserialize_value(value_str, value_type)

                    if section == "_root":
                        config_data[key] = value
                    else:
                        if section not in config_data:
                            config_data[section] = {}
                        config_data[section][key] = value

                conn.close()

                if output_path:
                    with open(output_path, "w", encoding="utf-8") as f:
                        json.dump(config_data, f, indent=2, ensure_ascii=False)
                    logger.info(f"Config exported to: {output_path}")

                return config_data

            except sqlite3.Error as e:
                logger.error(f"Database error during export: {e}")
                if 'conn' in locals():
                    conn.close()
                return {}
            except Exception as e:
                logger.error(f"Unexpected error during export: {e}")
                if 'conn' in locals():
                    conn.close()
                return {}

    def get_value(self, section: str, key: str, default: Any = None) -> Any:
        """Get a configuration value"""
        with self.lock:
            try:
                conn = self._get_connection()
                cursor = conn.cursor()
                cursor.execute(
                    """
                    SELECT value, value_type FROM config
                    WHERE section = ? AND key = ?
                """,
                    (section, key),
                )
                row = cursor.fetchone()
                conn.close()

                if row:
                    return self._deserialize_value(row["value"], row["value_type"])
                return default
            except sqlite3.Error as e:
                logger.error(f"Error getting value: {e}")
                if 'conn' in locals():
                    conn.close()
                return default

    def set_value(self, section: str, key: str, value: Any) -> bool:
        """Set a configuration value"""
        with self.lock:
            try:
                conn = self._get_connection()
                cursor = conn.cursor()
                value_type = self._get_value_type(value)
                value_str = self._serialize_value(value)

                cursor.execute(
                    """
                    INSERT INTO config (section, key, value, value_type, updated_at)
                    VALUES (?, ?, ?, ?, (datetime('now', 'localtime')))
                    ON CONFLICT(section, key)
                    DO UPDATE SET
                        value = excluded.value,
                        value_type = excluded.value_type,
                        updated_at = (datetime('now', 'localtime'))
                """,
                    (section, key, value_str, value_type),
                )
                conn.commit()
                conn.close()
                return True
            except sqlite3.Error as e:
                logger.error(f"Error setting value: {e}")
                if 'conn' in locals():
                    conn.rollback()
                    conn.close()
                return False

    def get_section(self, section: str) -> Dict:
        """Get all values from a configuration section"""
        with self.lock:
            try:
                conn = self._get_connection()
                cursor = conn.cursor()
                cursor.execute(
                    """
                    SELECT key, value, value_type FROM config
                    WHERE section = ?
                    ORDER BY key
                """,
                    (section,),
                )

                result = {}
                for row in cursor.fetchall():
                    key = row["key"]
                    value = self._deserialize_value(row["value"], row["value_type"])
                    result[key] = value

                conn.close()
                return result
            except sqlite3.Error as e:
                logger.error(f"Error getting section: {e}")
                if 'conn' in locals():
                    conn.close()
                return {}

    def get_all_sections(self) -> list:
        """Get list of all configuration sections"""
        with self.lock:
            try:
                conn = self._get_connection()
                cursor = conn.cursor()
                cursor.execute(
                    """
                    SELECT DISTINCT section FROM config
                    WHERE section != '_root'
                    ORDER BY section
                """
                )
                sections = [row["section"] for row in cursor.fetchall()]
                conn.close()
                return sections
            except sqlite3.Error as e:
                logger.error(f"Error getting sections: {e}")
                if 'conn' in locals():
                    conn.close()
                return []

    def initialize(self):
        """Initialize the database (connect, create tables, import from JSON)"""
        db_exists = self.db_path.exists()

        if db_exists:
            logger.info(f"Config database already exists: {self.db_path}")
        else:
            logger.info(f"Creating new config database: {self.db_path}")

        self.connect()  # This now just creates tables

        logger.info(f"Syncing config database with config.json...")
        success = self.import_from_json()

        if success:
            if not db_exists:
                logger.info(f"Config database created and populated from config.json")
            else:
                logger.info(f"Config database synced with config.json")
        else:
            logger.warning(f"Config database sync had issues")

    def get_status(self) -> dict:
        """Get status and metadata, thread-safe"""
        with self.lock:
            try:
                conn = self._get_connection()
                cursor = conn.cursor()

                cursor.execute("SELECT * FROM config_metadata ORDER BY last_sync_time DESC LIMIT 1")
                metadata_row = cursor.fetchone()
                metadata = dict(metadata_row) if metadata_row else None

                cursor.execute("SELECT COUNT(*) FROM config")
                total_entries = cursor.fetchone()[0]

                cursor.execute("SELECT DISTINCT section FROM config WHERE section != '_root' ORDER BY section")
                sections = [row["section"] for row in cursor.fetchall()]

                conn.close()
                return {
                    "database_path": str(self.db_path),
                    "sections": sections,
                    "section_count": len(sections),
                    "total_entries": total_entries,
                    "metadata": metadata,
                }
            except Exception as e:
                logger.error(f"Error getting config DB status: {e}")
                if 'conn' in locals():
                    conn.close()
                return {"error": str(e)}