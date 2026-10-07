from pypdf import PdfReader
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.core.logging import logger

class ParsedPage(BaseModel):
    page_number: int
    text: str

class ParsedDocument(BaseModel):
    metadata: Dict[str, Any]
    pages: List[ParsedPage]

class PDFParserService:
    def parse(self, file_path: str) -> ParsedDocument:
        logger.info(f"Parsing PDF document: {file_path}")
        try:
            reader = PdfReader(file_path)
            
            # Extract safe metadata
            pdf_metadata = {}
            if reader.metadata:
                for key, value in reader.metadata.items():
                    # clean key, e.g. /Title -> Title
                    clean_key = key.lstrip('/')
                    if isinstance(value, str):
                        pdf_metadata[clean_key] = value
            
            pages = []
            for i, page in enumerate(reader.pages):
                text = page.extract_text()
                # Handle None or empty text
                if not text or not text.strip():
                    text = ""
                
                pages.append(ParsedPage(page_number=i + 1, text=text))
            
            return ParsedDocument(metadata=pdf_metadata, pages=pages)
            
        except Exception as e:
            logger.error(f"Failed to parse PDF {file_path}: {str(e)}")
            raise ValueError(f"Failed to parse PDF document: {str(e)}")
