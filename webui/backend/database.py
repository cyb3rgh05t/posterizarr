"""
Database module for ImageChoices tracking
"""

import sqlite3
from pathlib import Path
from typing import List, Dict, Optional
import logging
import csv
import threading

logger = logging.getLogger(__name__)


class ImageChoicesDB:
    """Database handler for ImageChoices.csv data"""

    def __init__(self, db_path: Path):
        self.db_path = db_path
        self.lock = threading.RLock()  # Thread-safety lock
        self.init_database()

    def _get_connection(self):
        """Helper to create a new, thread-safe connection"""
        conn = sqlite3.connect(self.db_path, timeout=10)
        conn.row_factory = sqlite3.Row
        return conn

    def init_database(self):
        """Initialize the database and create table if it doesn't exist"""
        logger.info("=" * 60)
        logger.info("INITIALIZING IMAGECHOICES DATABASE")
        logger.debug(f"Database path: {self.db_path}")

        try:
            self.db_path.parent.mkdir(parents=True, exist_ok=True)

            with self.lock:
                conn = self._get_connection()
                cursor = conn.cursor()
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS imagechoices (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        Title TEXT NOT NULL,
                        Type TEXT,
                        Rootfolder TEXT,
                        LibraryName TEXT,
                        Language TEXT,
                        Fallback TEXT,
                        TextTruncated TEXT,
                        DownloadSource TEXT,
                        FavProviderLink TEXT,
                        Manual TEXT,
                        tmdbid TEXT,
                        tvdbid TEXT,
                        imdbid TEXT,
                        created_at TIMESTAMP DEFAULT (datetime('now', 'localtime')),
                        updated_at TIMESTAMP DEFAULT (datetime('now', 'localtime')),
                        UNIQUE(Title, Rootfolder, Type, LibraryName)
                    )
                """
                )

                # Add index for faster lookups
                cursor.execute(
                    "CREATE INDEX IF NOT EXISTS idx_rootfolder ON imagechoices(Rootfolder)"
                )
                cursor.execute(
                    "CREATE INDEX IF NOT EXISTS idx_title ON imagechoices(Title)"
                )

                conn.commit()
                conn.close()
            logger.info("✓ ImageChoices database initialized successfully")
            logger.info("=" * 60)
        except sqlite3.Error as e:
            logger.error(f"Error initializing ImageChoices database: {e}")
            if 'conn' in locals():
                conn.rollback()
                conn.close()
            raise

    def close(self):
        """Close connection - No longer needed as connections are per-function."""
        pass

    def insert_choice(self, **kwargs) -> int:
        """Insert a new choice into the database"""
        with self.lock:
            try:
                conn = self._get_connection()
                cursor = conn.cursor()

                columns = ", ".join(kwargs.keys())
                placeholders = ", ".join("?" * len(kwargs))
                values = list(kwargs.values())

                query = f"INSERT OR IGNORE INTO imagechoices ({columns}) VALUES ({placeholders})"
                cursor.execute(query, values)

                inserted_id = cursor.lastrowid
                conn.commit()
                conn.close()
                return inserted_id
            except sqlite3.Error as e:
                logger.error(f"Error inserting choice: {e}")
                if 'conn' in locals():
                    conn.rollback()
                    conn.close()
                raise

    def get_all_choices(self) -> List[sqlite3.Row]:
        """Get all choices from the database"""
        with self.lock:
            try:
                conn = self._get_connection()
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM imagechoices ORDER BY id DESC")
                rows = cursor.fetchall()
                conn.close()
                return rows
            except sqlite3.Error as e:
                logger.error(f"Error getting all choices: {e}")
                if 'conn' in locals():
                    conn.close()
                return []

    def get_choice_by_id(self, record_id: int) -> Optional[sqlite3.Row]:
        """Get a specific choice by its ID"""
        with self.lock:
            try:
                conn = self._get_connection()
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM imagechoices WHERE id = ?", (record_id,))
                row = cursor.fetchone()
                conn.close()
                return row
            except sqlite3.Error as e:
                logger.error(f"Error getting choice by ID: {e}")
                if 'conn' in locals():
                    conn.close()
                return None

    def get_choice_by_title(self, title: str) -> Optional[sqlite3.Row]:
        """Get a specific choice by its Title"""
        with self.lock:
            try:
                conn = self._get_connection()
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM imagechoices WHERE Title = ?", (title,))
                row = cursor.fetchone()
                conn.close()
                return row
            except sqlite3.Error as e:
                logger.error(f"Error getting choice by Title: {e}")
                if 'conn' in locals():
                    conn.close()
                return None

    def get_choice_by_rootfolder(self, rootfolder: str) -> Optional[sqlite3.Row]:
        """Get a specific choice by its Rootfolder"""
        with self.lock:
            try:
                conn = self._get_connection()
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM imagechoices WHERE Rootfolder = ?", (rootfolder,))
                row = cursor.fetchone()
                conn.close()
                return row
            except sqlite3.Error as e:
                logger.error(f"Error getting choice by Rootfolder: {e}")
                if 'conn' in locals():
                    conn.close()
                return None

    def update_choice(self, record_id: int, **kwargs):
        """Update an existing choice and auto-update 'updated_at'"""
        with self.lock:
            try:
                conn = self._get_connection()
                cursor = conn.cursor()

                # Start SET clause with the automatic updated_at
                set_clause_parts = ["updated_at = (datetime('now', 'localtime'))"]
                values = []

                # Add the rest of the kwargs
                for k, v in kwargs.items():
                    set_clause_parts.append(f'"{k}" = ?')
                    values.append(v)

                set_clause = ", ".join(set_clause_parts)
                values.append(record_id)  # Add the record_id for the WHERE clause

                query = f"UPDATE imagechoices SET {set_clause} WHERE id = ?"
                cursor.execute(query, values)

                conn.commit()
                conn.close()
            except sqlite3.Error as e:
                logger.error(f"Error updating choice: {e}")
                if 'conn' in locals():
                    conn.rollback()
                    conn.close()
                raise

    def delete_choice(self, record_id: int):
        """Delete a choice by its ID"""
        with self.lock:
            try:
                conn = self._get_connection()
                cursor = conn.cursor()
                cursor.execute("DELETE FROM imagechoices WHERE id = ?", (record_id,))
                conn.commit()
                conn.close()
            except sqlite3.Error as e:
                logger.error(f"Error deleting choice: {e}")
                if 'conn' in locals():
                    conn.rollback()
                    conn.close()
                raise

    def import_from_csv(self, csv_path: Path) -> dict:
        """
        Import data from ImageChoices.csv, skipping duplicates
        Uses batch processing for performance
        """
        if not csv_path.exists():
            return {"added": 0, "skipped": 0, "errors": 0, "error_details": []}

        with self.lock:
            conn = None
            try:
                conn = self._get_connection()
                cursor = conn.cursor()

                records_to_insert = []
                errors = 0
                error_details = []

                with open(csv_path, "r", encoding="utf-8", errors="ignore") as f:
                    reader = csv.DictReader(f, delimiter=";")

                    for i, row in enumerate(reader):
                        try:
                            # Clean up quotes from values
                            clean_row = {k.strip('"'): v.strip('"') for k, v in row.items()}

                            if not clean_row.get("Title") and not clean_row.get("Rootfolder"):
                                continue

                            records_to_insert.append((
                                clean_row.get("Title", ""),
                                clean_row.get("Type", ""),
                                clean_row.get("Rootfolder", ""),
                                clean_row.get("LibraryName", ""),
                                clean_row.get("Language", ""),
                                clean_row.get("Fallback", ""),
                                clean_row.get("TextTruncated", ""),
                                clean_row.get("Download Source", ""),
                                clean_row.get("Fav Provider Link", ""),
                                clean_row.get("Manual", ""),
                            ))
                        except Exception as e_row:
                            logger.warning(f"Error processing CSV row {i+1}: {e_row}")
                            errors += 1
                            error_details.append(f"Row {i+1}: {str(e_row)}")

                if records_to_insert:
                    cursor.executemany(
                        """
                        INSERT OR IGNORE INTO imagechoices (
                            Title, Type, Rootfolder, LibraryName, Language,
                            Fallback, TextTruncated, DownloadSource, FavProviderLink, Manual
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        records_to_insert
                    )
                    conn.commit()

                    added_count = cursor.rowcount
                    skipped_count = len(records_to_insert) - added_count

                    conn.close()
                    return {
                        "added": added_count,
                        "skipped": skipped_count,
                        "errors": errors,
                        "error_details": error_details,
                    }

                conn.close()
                return {"added": 0, "skipped": 0, "errors": errors, "error_details": error_details}

            except Exception as e:
                logger.error(f"Error importing CSV: {e}")
                if conn:
                    conn.rollback()
                    conn.close()
                return {"added": 0, "skipped": 0, "errors": errors + 1, "error_details": [str(e)]}

    # --- NEW: Bulk update function ---
    def bulk_update_manual_status(self, record_ids: List[int], manual_status: str) -> int:
        """
        Update the 'Manual' status for a list of record IDs in a single transaction.

        Args:
            record_ids: A list of integer record IDs to update.
            manual_status: The new status to set (e.g., "Yes" or "No").

        Returns:
            The number of rows updated.
        """
        if not record_ids:
            return 0

        with self.lock:
            try:
                conn = self._get_connection()
                cursor = conn.cursor()

                # Create placeholders for the IN clause
                placeholders = ",".join("?" * len(record_ids))

                # Prepare query
                query = f"""
                    UPDATE imagechoices
                    SET
                        Manual = ?,
                        updated_at = (datetime('now', 'localtime'))
                    WHERE id IN ({placeholders})
                """

                # Prepare values (status + all IDs)
                values = [manual_status] + record_ids

                cursor.execute(query, values)
                updated_count = cursor.rowcount

                conn.commit()
                conn.close()

                logger.info(f"Bulk updated {updated_count} records to Manual='{manual_status}'")
                return updated_count
            except sqlite3.Error as e:
                logger.error(f"Error bulk updating manual status: {e}")
                if 'conn' in locals():
                    conn.rollback()
                    conn.close()
                raise
    # --- END: New function ---

def init_database(db_path: Path) -> ImageChoicesDB:
    """Initialize the database"""
    return ImageChoicesDB(db_path)