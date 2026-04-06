from __future__ import annotations

import os
import uuid
from typing import Any
import random
import re

from .db import get_connection, utc_now
from .pdf_processor import extract_text_from_pdf, detect_chapters, extract_chapter_text

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "backend", "uploads", "textbooks")


def ensure_upload_dir() -> None:
    """Create upload directory if it doesn't exist"""
    os.makedirs(UPLOAD_DIR, exist_ok=True)


def extract_short_passage(full_text: str, target_sentences: int = 4) -> str:
    """
    Extract a random short passage from the full text.
    Returns approximately 2-4 sentences (150-300 words).
    """
    if not full_text:
        return "Sample text from this chapter."
    
    # Split into sentences (basic sentence splitting)
    sentences = re.split(r'(?<=[.!?])\s+', full_text)
    
    # Filter out empty sentences and very short ones (<10 chars)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
    
    if len(sentences) <= target_sentences:
        # If chapter is already short, take first few sentences
        result = ' '.join(sentences[:target_sentences])
        return clean_text(result)
    
    # Pick a random starting point
    max_start = len(sentences) - target_sentences
    start_idx = random.randint(0, max_start)
    
    # Take a continuous block of sentences
    selected_sentences = sentences[start_idx:start_idx + target_sentences]
    
    result = ' '.join(selected_sentences)
    
    # Clean up and limit length
    return clean_text(result)


def clean_text(text: str, max_words: int = 250) -> str:
    """Clean text: remove newlines, extra spaces, limit length"""
    # Replace newlines and multiple spaces with single space
    cleaned = ' '.join(text.split())
    
    # Limit by word count
    words = cleaned.split()
    if len(words) > max_words:
        cleaned = ' '.join(words[:max_words]) + "..."
    
    return cleaned

async def save_textbook(teacher_id: str, file_bytes: bytes, original_filename: str) -> int:
    """Save uploaded PDF textbook and extract chapters"""
    
    ensure_upload_dir()
    
    # Save file to disk
    unique_name = f"{uuid.uuid4().hex}.pdf"
    file_path = os.path.join(UPLOAD_DIR, unique_name)
    
    # Write file
    with open(file_path, "wb") as f:
        f.write(file_bytes)
    
    # Extract text from PDF
    import pypdf
    from io import BytesIO
    reader = pypdf.PdfReader(BytesIO(file_bytes))
    total_pages = len(reader.pages)
    
    # Extract text from ALL pages
    full_text = []
    for page_num in range(total_pages):
        text = reader.pages[page_num].extract_text()
        if text:
            cleaned = ' '.join(text.split())
            full_text.append(cleaned)
    
    extracted_text = ' '.join(full_text)
    
    # Limit length for database
    if len(extracted_text) > 5000:
        extracted_text = extracted_text[:5000] + "..."
    
    # Insert into database
    with get_connection() as conn:
        # Insert textbook
        cursor = conn.execute(
            """
            INSERT INTO textbooks (teacher_id, filename, original_name, file_path, total_pages, uploaded_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (teacher_id, unique_name, original_filename, file_path, total_pages, utc_now())
        )
        textbook_id = cursor.lastrowid
        print(f"Textbook inserted with ID: {textbook_id}")
        
        # Auto-detect chapters
        chapters = await detect_chapters(file_bytes)
        
        # Clear any existing chapters (just in case)
        conn.execute("DELETE FROM textbook_chapters WHERE textbook_id = ?", (textbook_id,))
        
        # Insert chapters
        for ch in chapters:
            chapter_num = ch.get("chapter_number")
            
            # Extract text for this chapter's page range
            chapter_text = await extract_chapter_text(
                file_bytes,
                ch["start_page"],
                ch["end_page"]
            )
            
            conn.execute(
                """
                INSERT INTO textbook_chapters 
                (textbook_id, chapter_number, chapter_title, start_page, end_page, extracted_text, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    textbook_id,
                    chapter_num,
                    ch.get("title", f"Chapter {chapter_num}" if chapter_num else "Full Text"),
                    ch["start_page"],
                    ch["end_page"],
                    chapter_text,
                    utc_now()
                )
            )

        conn.commit()
    
    return textbook_id

async def get_teacher_textbooks(teacher_id: str) -> list[dict[str, Any]]:
    """Get all textbooks for a teacher"""
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT id, original_name, uploaded_at, total_pages
            FROM textbooks
            WHERE teacher_id = ?
            ORDER BY uploaded_at DESC
            """,
            (teacher_id,),
        ).fetchall()
    
    return [dict(row) for row in rows]


async def get_textbook_chapters(textbook_id: int) -> list[dict[str, Any]]:
    """Get all chapters for a textbook"""
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT id, chapter_number, chapter_title, start_page, end_page
            FROM textbook_chapters
            WHERE textbook_id = ?
            ORDER BY chapter_number, start_page
            """,
            (textbook_id,),
        ).fetchall()
    
    return [dict(row) for row in rows]


async def get_chapter_text(chapter_id: int) -> str | None:
    """Get extracted text for a specific chapter - SHORTENED for AI"""
    with get_connection() as conn:
        row = conn.execute(
            "SELECT extracted_text FROM textbook_chapters WHERE id = ?",
            (chapter_id,),
        ).fetchone()
    
    if row and row["extracted_text"]:
        full_text = row["extracted_text"]
        # Take only first 800 characters for AI generation
        if len(full_text) > 800:
            # Try to cut at a sentence boundary
            short_text = full_text[:800]
            last_period = short_text.rfind('.')
            if last_period > 200:  # Only cut at period if we have enough text
                short_text = short_text[:last_period + 1]
            return short_text
        return full_text
    return None


async def get_textbook_path(textbook_id: int) -> tuple[str, str] | None:
    """Get file path and original name for a textbook"""
    with get_connection() as conn:
        row = conn.execute(
            "SELECT file_path, original_name FROM textbooks WHERE id = ?",
            (textbook_id,),
        ).fetchone()
    
    return (row["file_path"], row["original_name"]) if row else None