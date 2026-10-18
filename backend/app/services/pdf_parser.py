import os
import io
import csv
import json
from html.parser import HTMLParser
import xml.etree.ElementTree as ET
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

try:
    import openpyxl
except ImportError:
    openpyxl = None

try:
    import yaml
except ImportError:
    yaml = None

class ParsedPage(BaseModel):
    page_number: int
    text: str

class ParsedDocument(BaseModel):
    metadata: Dict[str, Any]
    pages: List[ParsedPage]

class _HTMLTextExtractor(HTMLParser):
    """Cleanly extracts visible text from HTML, stripping scripts, styles, and head metadata."""
    def __init__(self):
        super().__init__()
        self.texts: List[str] = []
        self.page_title: str = ""
        self._in_title = False
        self._skip_tag = False

    def handle_starttag(self, tag: str, attrs: Any):
        lower_tag = tag.lower()
        if lower_tag == "title":
            self._in_title = True
        elif lower_tag in ("script", "style", "noscript", "svg"):
            self._skip_tag = True

    def handle_endtag(self, tag: str):
        lower_tag = tag.lower()
        if lower_tag == "title":
            self._in_title = False
        elif lower_tag in ("script", "style", "noscript", "svg"):
            self._skip_tag = False

    def handle_data(self, data: str):
        if self._in_title:
            self.page_title += data.strip()
        elif not self._skip_tag:
            clean = data.strip()
            if clean:
                self.texts.append(clean)

class PDFParserService:
    """
    Universal Multi-Format Document Parser Service supporting:
    - Plain text: .txt, .md
    - Documents: .pdf, .docx, .doc, .pptx, .ppt
    - Spreadsheets: .csv, .xlsx, .tsv
    - Web content: .html, .xml
    - Knowledge exports: .json, .yaml, .yml
    With scanned document validation and encrypted document rejection.
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
        logger.info(f"Parsing document '{detected_name}' (format: {ext}) from source: {type(file_source)}")

        # 1. Dispatch parser based on format category
        if ext in {".xlsx", ".xls"}:
            parsed = self._parse_xlsx(file_source, detected_name)
        elif ext in {".csv", ".tsv"}:
            parsed = self._parse_csv(file_source, detected_name, ext)
        elif ext in {".html", ".htm"}:
            parsed = self._parse_html(file_source, detected_name)
        elif ext == ".xml":
            parsed = self._parse_xml(file_source, detected_name)
        elif ext in {".json", ".yaml", ".yml"}:
            parsed = self._parse_knowledge_export(file_source, detected_name, ext)
        elif ext in {".docx", ".doc"}:
            parsed = self._parse_docx(file_source, detected_name)
        elif ext in {".pptx", ".ppt"}:
            parsed = self._parse_pptx(file_source, detected_name)
        elif ext in {".txt", ".md", ".markdown", ".rtf", ".log"}:
            parsed = self._parse_text(file_source, detected_name, ext)
        else:
            # Default to PDF parser for .pdf or unknown binary document streams
            parsed = self._parse_pdf(file_source, detected_name)

        # 2. Scanned document & Zero-text validation check
        total_alnum = sum(sum(1 for c in page.text if c.isalnum()) for page in parsed.pages)
        if total_alnum < 15:
            if ext == ".pdf":
                raise ValueError(
                    "No extractable text found in this PDF. Scanned documents or image-only files without an OCR text layer are not supported (OCR is planned for a future update)."
                )
            elif ext in {".docx", ".doc"}:
                raise ValueError("No extractable text found in this Word document.")
            elif ext in {".pptx", ".ppt"}:
                raise ValueError("No extractable text found in this presentation. Image-only slides without text are not supported.")
            elif ext in {".xlsx", ".xls", ".csv"}:
                raise ValueError("The uploaded spreadsheet is empty or contains no extractable data cells.")
            else:
                raise ValueError("The uploaded document is empty or contains no extractable text.")

        return parsed

    def _parse_pdf(self, file_source: Union[str, BinaryIO], filename: str) -> ParsedDocument:
        try:
            reader = PdfReader(file_source)
            if reader.is_encrypted:
                try:
                    # Attempt empty password decryption
                    decrypt_res = reader.decrypt("")
                    if decrypt_res == 0:
                        raise ValueError("Encrypted or password-protected PDF cannot be parsed. Please decrypt the file before uploading.")
                except Exception:
                    raise ValueError("Encrypted or password-protected PDF cannot be parsed. Please decrypt the file before uploading.")

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

    def _parse_xlsx(self, file_source: Union[str, BinaryIO], filename: str) -> ParsedDocument:
        if openpyxl is None:
            raise ValueError("openpyxl is not installed on server.")

        try:
            wb = openpyxl.load_workbook(file_source, data_only=True, read_only=True)
            extracted_blocks: List[str] = []

            for sheet_name in wb.sheetnames:
                sheet = wb[sheet_name]
                extracted_blocks.append(f"### Sheet: {sheet_name}")

                for row in sheet.iter_rows(values_only=True):
                    # Filter out empty rows
                    cells = [str(c).strip() for c in row if c is not None and str(c).strip()]
                    if cells:
                        extracted_blocks.append(" | ".join(cells))

            wb.close()
            pages = self._chunk_blocks_into_pages(extracted_blocks, max_chars_per_page=2000)
            return ParsedDocument(metadata={"format": "xlsx", "sheets": wb.sheetnames}, pages=pages)
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Failed to parse spreadsheet {filename}: {str(e)}")
            raise ValueError(f"Failed to parse Excel spreadsheet (.xlsx): {str(e)}")

    def _parse_csv(self, file_source: Union[str, BinaryIO], filename: str, ext: str) -> ParsedDocument:
        try:
            raw_bytes = self._read_source_bytes(file_source)
            text_content = self._decode_bytes(raw_bytes)

            delimiter = "\t" if ext == ".tsv" else ","
            reader = csv.reader(io.StringIO(text_content), delimiter=delimiter)

            extracted_blocks: List[str] = []
            for row in reader:
                cells = [c.strip() for c in row if c.strip()]
                if cells:
                    extracted_blocks.append(" | ".join(cells))

            pages = self._chunk_blocks_into_pages(extracted_blocks, max_chars_per_page=2000)
            return ParsedDocument(metadata={"format": ext.lstrip(".")}, pages=pages)
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Failed to parse CSV document {filename}: {str(e)}")
            raise ValueError(f"Failed to parse spreadsheet data: {str(e)}")

    def _parse_html(self, file_source: Union[str, BinaryIO], filename: str) -> ParsedDocument:
        try:
            raw_bytes = self._read_source_bytes(file_source)
            html_content = self._decode_bytes(raw_bytes)

            extractor = _HTMLTextExtractor()
            extractor.feed(html_content)

            metadata: Dict[str, Any] = {"format": "html"}
            if extractor.page_title:
                metadata["title"] = extractor.page_title

            pages = self._chunk_blocks_into_pages(extractor.texts)
            return ParsedDocument(metadata=metadata, pages=pages)
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Failed to parse HTML document {filename}: {str(e)}")
            raise ValueError(f"Failed to parse HTML web content: {str(e)}")

    def _parse_xml(self, file_source: Union[str, BinaryIO], filename: str) -> ParsedDocument:
        try:
            raw_bytes = self._read_source_bytes(file_source)
            root = ET.fromstring(raw_bytes)

            extracted_blocks: List[str] = []
            for elem in root.iter():
                text = (elem.text or "").strip()
                if text:
                    tag_name = elem.tag.split("}")[-1] if "}" in elem.tag else elem.tag
                    extracted_blocks.append(f"{tag_name}: {text}")

            pages = self._chunk_blocks_into_pages(extracted_blocks)
            return ParsedDocument(metadata={"format": "xml", "root": root.tag}, pages=pages)
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Failed to parse XML document {filename}: {str(e)}")
            raise ValueError(f"Failed to parse XML content: {str(e)}")

    def _parse_knowledge_export(self, file_source: Union[str, BinaryIO], filename: str, ext: str) -> ParsedDocument:
        try:
            raw_bytes = self._read_source_bytes(file_source)
            text_content = self._decode_bytes(raw_bytes)

            extracted_blocks: List[str] = []
            if ext == ".json":
                parsed_json = json.loads(text_content)
                formatted = json.dumps(parsed_json, indent=2, ensure_ascii=False)
                extracted_blocks = formatted.splitlines()
            else:
                if yaml is not None:
                    parsed_yaml = yaml.safe_load(text_content)
                    formatted = yaml.dump(parsed_yaml, default_flow_style=False, allow_unicode=True)
                    extracted_blocks = formatted.splitlines()
                else:
                    extracted_blocks = text_content.splitlines()

            pages = self._chunk_blocks_into_pages(extracted_blocks)
            return ParsedDocument(metadata={"format": ext.lstrip(".")}, pages=pages)
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Failed to parse knowledge export {filename}: {str(e)}")
            raise ValueError(f"Failed to parse knowledge export ({ext}): {str(e)}")

    def _parse_text(self, file_source: Union[str, BinaryIO], filename: str, ext: str) -> ParsedDocument:
        try:
            raw_bytes = self._read_source_bytes(file_source)
            content = self._decode_bytes(raw_bytes)
            lines = content.splitlines()
            pages = self._chunk_blocks_into_pages(lines)
            return ParsedDocument(metadata={"format": ext.lstrip(".")}, pages=pages)
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Failed to parse text document {filename}: {str(e)}")
            raise ValueError(f"Failed to parse text document: {str(e)}")

    def _read_source_bytes(self, file_source: Union[str, BinaryIO]) -> bytes:
        if isinstance(file_source, str):
            with open(file_source, "rb") as f:
                return f.read()
        else:
            if hasattr(file_source, "seek"):
                file_source.seek(0)
            data = file_source.read()
            if hasattr(file_source, "seek"):
                file_source.seek(0)
            return data

    def _decode_bytes(self, raw_bytes: bytes) -> str:
        try:
            return raw_bytes.decode("utf-8")
        except UnicodeDecodeError:
            return raw_bytes.decode("latin-1", errors="replace")

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
