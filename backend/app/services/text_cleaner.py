import re
import unicodedata
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.services.pdf_parser import ParsedDocument, ParsedPage
from app.core.logging import logger

class CleanPage(BaseModel):
    page_number: int
    clean_text: str
    metadata: Dict[str, Any] = {}

class CleanDocument(BaseModel):
    metadata: Dict[str, Any]
    pages: List[CleanPage]

class DocumentTextCleaner:
    def __init__(self):
        # Compiled regexes for performance
        # Multiple spaces (but don't touch newlines here)
        self.re_multiple_spaces = re.compile(r'[ \t]+')
        # Multiple blank lines -> single blank line
        self.re_multiple_blank_lines = re.compile(r'\n\s*\n\s*\n+')
        # Hyphenated line breaks (e.g., "retriev-\nal" -> "retrieval")
        # Be conservative: lowercase letter, hyphen, newline, lowercase letter
        self.re_hyphenated_break = re.compile(r'([a-z])-[\n\r]+([a-z])')
        
    def clean(self, parsed_doc: ParsedDocument, document_id: str, filename: str) -> CleanDocument:
        logger.info(f"Starting text cleaning for document {document_id}")
        
        # 1. Metadata Normalization
        clean_metadata = self._normalize_metadata(parsed_doc.metadata, document_id, filename, len(parsed_doc.pages))
        
        # 2. Page Cleaning
        clean_pages = []
        for page in parsed_doc.pages:
            clean_text = self._clean_text(page.text)
            
            page_metadata = {
                "document_id": document_id,
                "page_number": page.page_number,
                "source": filename
            }
            
            clean_pages.append(
                CleanPage(
                    page_number=page.page_number,
                    clean_text=clean_text,
                    metadata=page_metadata
                )
            )
            
        logger.info(f"Finished cleaning {len(clean_pages)} pages for document {document_id}")
        return CleanDocument(metadata=clean_metadata, pages=clean_pages)

    def _normalize_metadata(self, raw_metadata: Dict[str, Any], document_id: str, filename: str, page_count: int) -> Dict[str, Any]:
        """Normalizes document-level metadata to a consistent schema."""
        normalized = {
            "document_id": document_id,
            "source_type": "pdf",
            "source_name": filename,
            "filename": filename,
            "page_count": page_count
        }
        
        # Safely copy over relevant PDF metadata
        safe_keys = ["title", "author", "subject", "creator", "producer"]
        for k in safe_keys:
            # Check lowercase matching as PDF metadata can be capitalized (e.g. Title)
            # We'll just search case-insensitively
            matched_key = next((raw_k for raw_k in raw_metadata.keys() if raw_k.lower() == k), None)
            if matched_key and raw_metadata[matched_key]:
                normalized[k] = str(raw_metadata[matched_key]).strip()
                
        return normalized

    def _clean_text(self, text: str) -> str:
        if not text:
            return ""
            
        # 1. Line endings normalization (\r\n or \r -> \n)
        text = text.replace('\r\n', '\n').replace('\r', '\n')
        
        # 2. Unicode normalization (NFKC to decompose and compose appropriately, 
        # handling non-breaking spaces safely as normal spaces if NFKC does so, 
        # actually NFKC converts NBSP to space)
        text = unicodedata.normalize('NFKC', text)
        
        # 3. Hyphenated line breaks
        text = self.re_hyphenated_break.sub(r'\1\2', text)
        
        # 4. Whitespace normalization (collapse multiple spaces/tabs into one)
        # We only collapse horizontal space.
        # So we can split by lines, collapse horizontal space, then rejoin
        lines = text.split('\n')
        cleaned_lines = []
        for line in lines:
            # Strip trailing space per line
            line = line.rstrip()
            # Collapse multiple spaces (but preserve single spaces)
            line = self.re_multiple_spaces.sub(' ', line)
            cleaned_lines.append(line)
            
        text = '\n'.join(cleaned_lines)
        
        # 5. Blank line normalization (max 2 consecutive newlines, meaning 1 blank line)
        text = self.re_multiple_blank_lines.sub('\n\n', text)
        
        # Strip leading/trailing newlines from the entire page
        return text.strip()
