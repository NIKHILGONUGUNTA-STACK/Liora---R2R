import pytest
from app.services.text_cleaner import DocumentTextCleaner, ParsedDocument, ParsedPage

@pytest.fixture
def cleaner():
    return DocumentTextCleaner()

def test_unicode_normalization(cleaner):
    # NBSP (\u00a0) and weird quotes
    raw_text = "Hello\u00a0world"
    clean_text = cleaner._clean_text(raw_text)
    assert clean_text == "Hello world"

def test_line_endings(cleaner):
    raw_text = "Line 1\r\nLine 2\rLine 3"
    clean_text = cleaner._clean_text(raw_text)
    assert clean_text == "Line 1\nLine 2\nLine 3"

def test_whitespace_normalization(cleaner):
    raw_text = "This   has    way \t too   much   space.   "
    clean_text = cleaner._clean_text(raw_text)
    assert clean_text == "This has way too much space."

def test_blank_lines(cleaner):
    raw_text = "Paragraph 1\n\n\n\nParagraph 2\n\n\nParagraph 3"
    clean_text = cleaner._clean_text(raw_text)
    assert clean_text == "Paragraph 1\n\nParagraph 2\n\nParagraph 3"

def test_hyphenated_line_breaks(cleaner):
    raw_text = "This is a state-of-the-art retriev-\nal system."
    clean_text = cleaner._clean_text(raw_text)
    assert clean_text == "This is a state-of-the-art retrieval system."
    
    # Should not aggressively break capitalized or obvious non-wrap hyphens
    raw_text2 = "Check the API-\nReference."
    clean_text2 = cleaner._clean_text(raw_text2)
    assert clean_text2 == "Check the API-\nReference." # Preserved

def test_metadata_normalization(cleaner):
    raw_metadata = {"Title": "Test Doc", "Author": "Test Author", "Custom": "Ignore me"}
    normalized = cleaner._normalize_metadata(raw_metadata, "doc123", "test.pdf", page_count=5)
    
    assert normalized["document_id"] == "doc123"
    assert normalized["source_type"] == "pdf"
    assert normalized["source_name"] == "test.pdf"
    assert normalized["title"] == "Test Doc"
    assert normalized["author"] == "Test Author"
    assert normalized["page_count"] == 5
    assert "Custom" not in normalized

def test_page_preservation_and_empty_page(cleaner):
    parsed = ParsedDocument(
        metadata={"/Title": "Test"},
        pages=[
            ParsedPage(page_number=1, text="Page 1 text  "),
            ParsedPage(page_number=2, text="   \n   \n   "), # Effectively empty
            ParsedPage(page_number=3, text="Page 3 text")
        ]
    )
    
    clean_doc = cleaner.clean(parsed, "doc123", "test.pdf")
    
    assert len(clean_doc.pages) == 3
    assert clean_doc.pages[0].page_number == 1
    assert clean_doc.pages[0].clean_text == "Page 1 text"
    
    assert clean_doc.pages[1].page_number == 2
    assert clean_doc.pages[1].clean_text == ""
    
    assert clean_doc.pages[2].page_number == 3
    assert clean_doc.pages[2].clean_text == "Page 3 text"
    
    assert clean_doc.metadata["page_count"] == 3

def test_determinism(cleaner):
    raw_text = "This is a state-of-the-art retriev-\nal system.   \n\n\n\nNew paragraph."
    clean_text_1 = cleaner._clean_text(raw_text)
    clean_text_2 = cleaner._clean_text(clean_text_1) # Re-cleaning the cleaned text
    
    assert clean_text_1 == "This is a state-of-the-art retrieval system.\n\nNew paragraph."
    assert clean_text_1 == clean_text_2
