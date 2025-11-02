"""
Database module for managing server_libraries.db
Separate database for media server library management
"""

import sqlite3
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class ServerLibrariesDB:
    """Database class for managing media server libraries"""

    def __init__(self, db_path: Path):
        """
        Initialize the database connection

        Args:
            db_path: Path to the database file
        """
        self.db_path = db_path
        self.connection = None

    def connect(self):
        """Establish database connection"""
        logger.debug(
            f"Attempting to connect to server libraries database: {self.db_path}"
        )
        try:
            self.connection = sqlite3.connect(self.db_path, check_same_thread=False)
            self.connection.row_factory = sqlite3.Row
            logger.info(f"Connected to server libraries database: {self.db_path}")
        except sqlite3.Error as e:
            logger.error(f"Error connecting to database: {e}")
            raise

    def close(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
            logger.info("Server libraries database connection closed")

    def create_tables(self):
        """Create the media_server_libraries table if it doesn't exist"""
        logger.debug("Creating tables if they don't exist...")
        try:
            cursor = self.connection.cursor()
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS media_server_libraries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    server_type TEXT NOT NULL,
                    library_name TEXT NOT NULL,
                    library_type TEXT,
                    is_excluded INTEGER DEFAULT 0,
                    last_fetched TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(server_type, library_name)
                )
            """
            )

            self.connection.commit()
            logger.info("Server libraries table created or already exists")
        except sqlite3.Error as e:
            logger.error(f"Error creating table: {e}")
            raise

    def initialize(self):
        """Initialize the database (connect and create tables)"""
        logger.info("=" * 60)
        logger.info("INITIALIZING SERVER LIBRARIES DATABASE")

        db_exists = self.db_path.exists()
        logger.debug(f"Database path: {self.db_path}")
        logger.debug(f"Database exists: {db_exists}")

        if db_exists:
            logger.info(f"Database already exists: {self.db_path}")
            file_size = self.db_path.stat().st_size
            logger.debug(
                f"Database file size: {file_size} bytes ({file_size/1024:.2f} KB)"
            )
        else:
            logger.info(f"Creating new server libraries database: {self.db_path}")

        self.connect()
        self.create_tables()

        logger.info("Server libraries database initialization complete")
        logger.info("=" * 60)

    def save_media_server_libraries(
        self, server_type: str, libraries: list, excluded_libraries: list = None
    ):
        """
        Save media server libraries to database

        Args:
            server_type: Type of media server ('plex', 'jellyfin', 'emby')
            libraries: List of library dicts with 'name' and 'type' keys
            excluded_libraries: Optional list of library names that are excluded
        """
        logger.info(f"Saving {len(libraries)} libraries for {server_type}")
        try:
            cursor = self.connection.cursor()

            if excluded_libraries is None:
                excluded_libraries = []

            # Get existing exclusion status before deleting
            cursor.execute(
                "SELECT library_name, is_excluded FROM media_server_libraries WHERE server_type = ?",
                (server_type,),
            )
            existing_exclusions = {row[0]: row[1] for row in cursor.fetchall()}

            # Delete existing libraries for this server type
            cursor.execute(
                "DELETE FROM media_server_libraries WHERE server_type = ?",
                (server_type,),
            )

            # Insert new libraries, preserving exclusion status
            for lib in libraries:
                lib_name = lib["name"]
                # Use provided excluded_libraries list, or preserve existing status
                is_excluded = (
                    1
                    if lib_name in excluded_libraries
                    else existing_exclusions.get(lib_name, 0)
                )

                cursor.execute(
                    """
                    INSERT INTO media_server_libraries (server_type, library_name, library_type, is_excluded)
                    VALUES (?, ?, ?, ?)
                    """,
                    (server_type, lib_name, lib.get("type", ""), is_excluded),
                )

            self.connection.commit()
            logger.info(
                f"Successfully saved {len(libraries)} libraries for {server_type}"
            )

        except sqlite3.Error as e:
            logger.error(f"Error saving media server libraries: {e}")
            raise

    def update_library_exclusions(self, server_type: str, excluded_libraries: list):
        """
        Update the exclusion status of libraries

        Args:
            server_type: Type of media server ('plex', 'jellyfin', 'emby')
            excluded_libraries: List of library names that should be excluded
        """
        logger.info(f"Updating exclusions for {server_type}: {excluded_libraries}")
        try:
            cursor = self.connection.cursor()

            # First, set all libraries for this server to included (0)
            cursor.execute(
                "UPDATE media_server_libraries SET is_excluded = 0 WHERE server_type = ?",
                (server_type,),
            )

            # Then, set the specified libraries to excluded (1)
            if excluded_libraries:
                placeholders = ",".join("?" * len(excluded_libraries))
                cursor.execute(
                    f"""
                    UPDATE media_server_libraries 
                    SET is_excluded = 1 
                    WHERE server_type = ? AND library_name IN ({placeholders})
                    """,
                    [server_type] + excluded_libraries,
                )

            self.connection.commit()
            logger.info(f"Successfully updated exclusions for {server_type}")

        except sqlite3.Error as e:
            logger.error(f"Error updating library exclusions: {e}")
            raise

    def get_media_server_libraries(self, server_type: str):
        """
        Get media server libraries from database

        Args:
            server_type: Type of media server ('plex', 'jellyfin', 'emby')

        Returns:
            dict: Dict with 'libraries' (all libraries) and 'excluded' (excluded library names)
        """
        logger.debug(f"Fetching libraries for {server_type}")
        try:
            cursor = self.connection.cursor()
            cursor.execute(
                """
                SELECT library_name, library_type, is_excluded, last_fetched
                FROM media_server_libraries
                WHERE server_type = ?
                ORDER BY library_name
                """,
                (server_type,),
            )

            rows = cursor.fetchall()
            libraries = []
            excluded = []

            for row in rows:
                lib_data = {"name": row[0], "type": row[1], "last_fetched": row[3]}
                libraries.append(lib_data)

                # Add to excluded list if is_excluded is 1
                if row[2] == 1:
                    excluded.append(row[0])

            logger.debug(
                f"Found {len(libraries)} libraries for {server_type} ({len(excluded)} excluded)"
            )
            return {"libraries": libraries, "excluded": excluded}

        except sqlite3.Error as e:
            logger.error(f"Error fetching media server libraries: {e}")
            return {"libraries": [], "excluded": []}


def init_server_libraries_db(db_path: Path) -> ServerLibrariesDB:
    """
    Initialize the server libraries database

    Args:
        db_path: Path to the database file

    Returns:
        ServerLibrariesDB: Initialized database instance
    """
    db = ServerLibrariesDB(db_path)
    db.initialize()
    return db
