import pypdf
from io import BytesIO
from typing import List, Dict
import re

async def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract all text from PDF and clean it"""
    try:
        reader = pypdf.PdfReader(BytesIO(file_bytes))
        full_text = []
        for page_num, page in enumerate(reader.pages, 1):
            text = page.extract_text()
            if text:
                # Clean the text: remove extra newlines, multiple spaces
                cleaned = ' '.join(text.split())
                full_text.append(cleaned)
        # Join with spaces, not newlines
        return " ".join(full_text)
    except Exception as e:
        raise Exception(f"Failed to extract PDF text: {str(e)}")


async def extract_chapter_text(
    file_bytes: bytes, 
    start_page: int, 
    end_page: int
) -> str:
    """Extract text from specific page range"""
    try:
        reader = pypdf.PdfReader(BytesIO(file_bytes))
        chapter_text = []
        
        for page_num in range(start_page - 1, min(end_page, len(reader.pages))):
            text = reader.pages[page_num].extract_text()
            if text:
                # Clean the text: remove newlines, extra spaces
                cleaned = ' '.join(text.split())
                chapter_text.append(cleaned)
        
        result = " ".join(chapter_text)
        
        # Don't limit - keep all content
        return result
        
    except Exception as e:
        raise Exception(f"Failed to extract chapter text: {str(e)}")

async def detect_chapters(file_bytes: bytes) -> List[Dict]:
    """Detect chapters by parsing Table of Contents or page ranges"""
    try:
        reader = pypdf.PdfReader(BytesIO(file_bytes))
        total_pages = len(reader.pages)
        chapters = []
        
        # First, try to find Table of Contents (usually within first 10 pages)
        toc_pages = []
        toc_found = False
        
        for page_num in range(min(10, total_pages)):
            text = reader.pages[page_num].extract_text()
            if text and any(keyword in text.lower() for keyword in ['contents', 'table of contents', 'chapter', 'part']):
                toc_pages.append((page_num + 1, text))
                toc_found = True
        
        if toc_found:
            # Parse TOC to extract chapter titles and page numbers
            chapter_patterns = [
                r'Chapter\s+(\d+)\s+\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\s+(\d+)',  # "Chapter 1 ............. 5"
                r'Chapter\s+(\d+)\s*\.\.\.+\s*(\d+)',  # "Chapter 1 ... 5"
                r'(\d+)\s+\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\s+(\d+)',  # "1 ............. 5"
                r'(\d+)\s*\.\.\.+\s*(\d+)',  # "1 ... 5"
                r'Chapter\s+(\d+)[:\s]+([^\n]+?)\s+(\d+)',  # "Chapter 1: Title 5"
                r'^(\d+)\s+([A-Za-z][^\n]+?)\s+(\d+)$',  # "1 Introduction 5"
            ]
            
            for page_num, toc_text in toc_pages:
                lines = toc_text.split('\n')
                for line in lines:
                    for pattern in chapter_patterns:
                        match = re.search(pattern, line, re.IGNORECASE)
                        if match:
                            groups = match.groups()
                            if len(groups) == 2:
                                # Pattern like "Chapter 1 ........ 5"
                                if groups[0].isdigit():
                                    chapter_num = int(groups[0])
                                    page_ref = int(groups[1])
                                else:
                                    chapter_num = len(chapters) + 1
                                    page_ref = int(groups[1])
                                chapter_title = f"Chapter {chapter_num}"
                            elif len(groups) >= 3:
                                # Pattern like "Chapter 1: Title 5"
                                chapter_num = int(groups[0])
                                chapter_title = groups[1].strip()[:50]
                                page_ref = int(groups[2])
                            else:
                                continue
                            
                            # Find the actual page where content starts (may need offset)
                            content_page = page_ref
                            if content_page <= total_pages:
                                chapters.append({
                                    "chapter_number": chapter_num,
                                    "title": chapter_title,
                                    "start_page": content_page,
                                    "end_page": total_pages  # Will update later
                                })
                                break
        
        # If TOC parsing worked, set end pages for each chapter
        if chapters:
            chapters.sort(key=lambda x: x["start_page"])
            for i in range(len(chapters)):
                if i < len(chapters) - 1:
                    chapters[i]["end_page"] = chapters[i + 1]["start_page"] - 1
                else:
                    chapters[i]["end_page"] = total_pages
            return chapters
        
        # If TOC parsing failed, create chapters by page ranges
        pages_per_chapter = 20
        start = 1
        chapter_num = 1
        while start <= total_pages:
            end = min(start + pages_per_chapter - 1, total_pages)
            chapters.append({
                "chapter_number": chapter_num,
                "title": f"Pages {start}-{end}",
                "start_page": start,
                "end_page": end
            })
            start = end + 1
            chapter_num += 1
        
        return chapters
        
    except Exception as e:
        reader = pypdf.PdfReader(BytesIO(file_bytes))
        total_pages = len(reader.pages)
        return [{"chapter_number": 1, "title": "Full Textbook", "start_page": 1, "end_page": total_pages}]