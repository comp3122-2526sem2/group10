from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "debunk_ai.db"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_connection() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def init_db() -> None:
    with get_connection() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT NOT NULL,
                points INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                subject TEXT NOT NULL,
                source_text TEXT NOT NULL,
                content_html TEXT NOT NULL,
                status TEXT NOT NULL,
                error_density INTEGER NOT NULL,
                created_by TEXT NOT NULL,
                total_errors INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (created_by) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS task_highlights (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id TEXT NOT NULL,
                highlight_id INTEGER NOT NULL,
                text TEXT NOT NULL,
                error_type TEXT NOT NULL,
                canonical_reason TEXT NOT NULL,
                explanation TEXT NOT NULL,
                is_golden INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                UNIQUE(task_id, highlight_id),
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS task_study_guides (
                task_id TEXT PRIMARY KEY,
                resource_title TEXT NOT NULL,
                overview TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS task_study_sections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id TEXT NOT NULL,
                section_order INTEGER NOT NULL,
                section_title TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS task_study_references (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id TEXT NOT NULL,
                highlight_id INTEGER NOT NULL,
                concept_title TEXT NOT NULL,
                textbook_excerpt TEXT NOT NULL,
                explanation TEXT NOT NULL,
                review_points_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                UNIQUE(task_id, highlight_id),
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS annotations (
                id TEXT PRIMARY KEY,
                task_id TEXT NOT NULL,
                highlight_id INTEGER NOT NULL,
                student_id TEXT NOT NULL,
                error_type TEXT NOT NULL,
                reason TEXT NOT NULL,
                is_correct INTEGER NOT NULL,
                points_earned INTEGER NOT NULL,
                ai_feedback TEXT NOT NULL,
                created_at TEXT NOT NULL,
                UNIQUE(task_id, highlight_id, student_id),
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS classrooms (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                code TEXT NOT NULL,
                enrolled INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS classroom_teachers (
                id TEXT PRIMARY KEY,
                classroom_id TEXT NOT NULL,
                email TEXT NOT NULL,
                name TEXT NOT NULL,
                role_label TEXT NOT NULL DEFAULT 'Member',
                created_at TEXT NOT NULL,
                FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS classroom_invitations (
                id TEXT PRIMARY KEY,
                classroom_id TEXT NOT NULL,
                email TEXT NOT NULL,
                invitation_type TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE
            );

            -- ============================================================
            -- NEW TABLES FOR TEXTBOOK FEATURE
            -- ============================================================
            
            CREATE TABLE IF NOT EXISTS textbooks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                teacher_id TEXT NOT NULL,
                filename TEXT NOT NULL,
                original_name TEXT NOT NULL,
                file_path TEXT NOT NULL,
                total_pages INTEGER,
                uploaded_at TEXT NOT NULL,
                FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS textbook_chapters (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                textbook_id INTEGER NOT NULL,
                chapter_number INTEGER,
                chapter_title TEXT,
                start_page INTEGER NOT NULL,
                end_page INTEGER NOT NULL,
                extracted_text TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (textbook_id) REFERENCES textbooks(id) ON DELETE CASCADE
            );

            -- ============================================================
            -- MODIFY tasks TABLE - ADD textbook columns
            -- ============================================================
            -- Note: SQLite doesn't support ALTER TABLE ADD COLUMN IF NOT EXISTS
            -- We'll check and add columns manually in Python
            """
        )
        
        # Add textbook columns to tasks table if they don't exist
        cursor = connection.cursor()
        
        # Check and add textbook_id column
        cursor.execute("PRAGMA table_info(tasks)")
        existing_columns = [col[1] for col in cursor.fetchall()]
        
        if "textbook_id" not in existing_columns:
            cursor.execute("ALTER TABLE tasks ADD COLUMN textbook_id INTEGER REFERENCES textbooks(id)")
        
        if "chapter_id" not in existing_columns:
            cursor.execute("ALTER TABLE tasks ADD COLUMN chapter_id INTEGER REFERENCES textbook_chapters(id)")
        
        connection.commit()


def seed_classrooms() -> None:
    defaults: Iterable[tuple[str, str, str, int]] = (
        ("class-cs101", "Computer Science 101", "CS-101-FALL", 42),
        ("class-hist202", "World History - AI Era", "WH-202-SPRG", 128),
        ("class-phys101", "Physics & Computing", "PH-101-FALL", 85),
    )

    with get_connection() as connection:
        count = connection.execute("SELECT COUNT(*) AS count FROM classrooms").fetchone()["count"]
        if count:
            return

        now = utc_now()
        connection.executemany(
            """
            INSERT INTO classrooms (id, name, code, enrolled, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            [(class_id, name, code, enrolled, now) for class_id, name, code, enrolled in defaults],
        )


def bootstrap() -> None:
    init_db()
    seed_classrooms()