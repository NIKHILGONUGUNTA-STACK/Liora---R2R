import os
import io
from pypdf import PdfReader
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union, BinaryIO
from app.core.logging import logger

try:
    import docx
except ImportError:
    docx = None

try:
    import pptx
except ImportError:
    pptx = None

class ParsedPage(BaseModel):
    page_number: int
    text: str

class ParsedDocument(BaseModel):
    metadata: Dict[str, Any]
    pages: List[ParsedPage]

class PDFParserService:
    """
    Universal Document Parser Service supporting:
    - PDF (.pdf) with scanned/OCR validation
    - Word (.docx)
    - PowerPoint (.pptx)
    - Plain & structured text (.txt, .md, .csv, .tsv, .json, .rtf, .html)
    """

    def parse(
        self,
        file_source: Union[str, BinaryIO],
        filename: Optional[str] = None
    ) -> ParsedDocument:
        # Determine filename and extension
        detected_name = filename or ""
        if not detected_name and isinstance(file_source, str):
            detected_name = os.path.basename(file_source)

        ext = os.path.splitext(detected_name.lower())[1] if detected_name else ".pdf"

        logger.info(f"Parsing document '{detected_name}' (ext: {ext}) from source: {type(file_source)}")

        # Dispatch based on extension
        if ext == ".docx":
            parsed = self._parse_docx(file_source, detected_name)
        elif ext == ".pptx":
            parsed = self._parse_pptx(file_source, detected_name)
        elif ext in {".txt", ".md", ".markdown", ".csv", ".tsv", ".json", ".rtf", ".log", ".html", ".htm"}:
            parsed = self._parse_text(file_source, detected_name, ext)
        else:
            # Default to PDF parser for .pdf or unknown binary document streams
            parsed = self._parse_pdf(file_source, detected_name)

        # Scanned document & zero extractable text check
        total_alnum = sum(sum(1 for c in page.text if c.isalnum()) for page in parsed.pages)
        if total_alnum < 15:
            if ext == ".pdf":
                raise ValueError(
                    "No extractable text found in this PDF. Scanned documents or image-only files without an OCR text layer are not supported."
                )
            elif ext in {".docx", ".doc"}:
                raise ValueError("No extractable text found in this Word document.")
            elif ext in {".pptx", ".ppt"}:
                raise ValueError("No extractable text found in this presentation. Image-only slides without text are not supported.")
            else:
                raise ValueError("The uploaded document is empty or contains no extractable text.")

        return parsed

    def _parse_pdf(self, file_source: Union[str, BinaryIO], filename: str) -> ParsedDocument:
        try:
            reader = PdfReader(file_source)
            pdf_metadata = {}
            if reader.metadata:
                for key, value in reader.metadata.items():
                    clean_key = key.lstrip('/')
                    if isinstance(value, str):
                        pdf_metadata[clean_key] = value

            pages = []
            for i, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                pages.append(ParsedPage(page_number=i + 1, text=text))

            return ParsedDocument(metadata=pdf_metadata, pages=pages)
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Failed to parse PDF document {filename}: {str(e)}")
            raise ValueError(f"Failed to parse PDF document: {str(e)}")

    def _parse_docx(self, file_source: Union[str, BinaryIO], filename: str) -> ParsedDocument:
        if docx is None:
            raise ValueError("python-docx is not installed on server.")

        try:
            doc = docx.Document(file_source)
            doc_metadata = {}
            try:
                core_props = doc.core_properties
                if core_props.title:
                    doc_metadata["title"] = core_props.title
                if core_props.author:
                    doc_metadata["author"] = core_props.author
                if core_props.subject:
                    doc_metadata["subject"] = core_props.subject
            except Exception:
                pass

            # Extract paragraphs and table content
            extracted_blocks: List[str] = []
            for p in doc.paragraphs:
                cleaned = p.text.strip()
                if cleaned:
                    extracted_blocks.append(cleaned)

            for table in doc.tables:
                for row in table.rows:
                    row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                    if row_cells:
                        extracted_blocks.append(" | ".join(row_cells))

            # Group into logical pages of ~2500 characters
            pages = self._chunk_blocks_into_pages(extracted_blocks)
            return ParsedDocument(metadata=doc_metadata, pages=pages)
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Failed to parse Word document {filename}: {str(e)}")
            raise ValueError(f"Failed to parse Word document (.docx): {str(e)}")

    def _parse_pptx(self, file_source: Union[str, BinaryIO], filename: str) -> ParsedDocument:
        if pptx is None:
            raise ValueError("python-pptx is not installed on server.")

        try:
            prs = pptx.Presentation(file_source)
            ppt_metadata = {}
            try:
                core_props = prs.core_properties
                if core_props.title:
                    ppt_metadata["title"] = core_props.title
                if core_props.author:
                    ppt_metadata["author"] = core_props.author
            except Exception:
                pass

            pages: List[ParsedPage] = []
            for i, slide in enumerate(prs.slides):
                slide_lines: List[str] = []
                for shape in slide.shapes:
                    if shape.has_text_frame:
                        for p in shape.text_frame.paragraphs:
                            cleaned = p.text.strip()
                            if cleaned:
                                slide_lines.append(cleaned)
                    elif shape.has_table:
                        for row in shape.table.rows:
                            row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                            if row_cells:
                                slide_lines.append(" | ".join(row_cells))

                slide_text = "\n".join(slide_lines)
                pages.append(ParsedPage(page_number=i + 1, text=slide_text))

            if not pages:
                pages.append(ParsedPage(page_number=1, text=""))

            return ParsedDocument(metadata=ppt_metadata, pages=pages)
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Failed to parse PowerPoint presentation {filename}: {str(e)}")
            raise ValueError(f"Failed to parse PowerPoint presentation (.pptx): {str(e)}")

    def _parse_text(self, file_source: Union[str, BinaryIO], filename: str, ext: str) -> ParsedDocument:
        try:
            if isinstance(file_source, str):
                with open(file_source, "rb") as f:
                    raw_bytes = f.read()
            else:
                if hasattr(file_source, "seek"):
                    file_source.seek(0)
                raw_bytes = file_source.read()

            try:
                content = raw_bytes.decode("utf-8")
            except UnicodeDecodeError:
                content = raw_bytes.decode("latin-1", errors="replace")

            lines = content.splitlines()
            pages = self._chunk_blocks_into_pages(lines)
            return ParsedDocument(metadata={"format": ext.lstrip(".")}, pages=pages)
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Failed to parse text document {filename}: {str(e)}")
            raise ValueError(f"Failed to parse text document: {str(e)}")

    def _chunk_blocks_into_pages(self, blocks: List[str], max_chars_per_page: int = 2500) -> List[ParsedPage]:
        pages: List[ParsedPage] = []
        current_lines: List[str] = []
        current_chars = 0
        page_num = 1

        for block in blocks:
            current_lines.append(block)
            current_chars += len(block) + 1
            if current_chars >= max_chars_per_page:
                pages.append(ParsedPage(page_number=page_num, text="\n".join(current_lines)))
                page_num += 1
                current_lines = []
                current_chars = 0

        if current_lines or not pages:
            pages.append(ParsedPage(page_number=page_num, text="\n".join(current_lines)))

        return pages

# Backward-compatible alias
DocumentParserService = PDFParserService
