"""
Tests for document ingestion module
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock, MagicMock
from ingestion import (
    chunk_text_intelligent,
    generate_chunk_id,
    estimate_tokens,
    extract_text_from_pdf,
    ingest_document,
)


def test_estimate_tokens():
    """Test token estimation"""
    text = "This is a test sentence with multiple words."
    tokens = estimate_tokens(text)
    expected = len(text) // 4
    assert tokens == expected


def test_estimate_tokens_empty():
    """Test token estimation with empty string"""
    assert estimate_tokens("") == 0


def test_generate_chunk_id():
    """Test chunk ID generation"""
    chunk_id = generate_chunk_id("doc-123", 5)
    assert chunk_id == "doc-123_chunk_0005"


def test_generate_chunk_id_padding():
    """Test chunk ID generation with large index"""
    chunk_id = generate_chunk_id("test-doc", 1234)
    assert chunk_id == "test-doc_chunk_1234"


def test_chunk_text_intelligent_simple():
    """Test intelligent text chunking with simple text"""
    text_items = [
        {"text": "Paragraph one.\n\nParagraph two.\n\nParagraph three.", "page": 1}
    ]

    chunks = chunk_text_intelligent(text_items, max_chars=50, overlap_chars=10)

    assert len(chunks) > 0
    assert all("text" in chunk for chunk in chunks)
    assert all("page" in chunk for chunk in chunks)
    assert all("char_count" in chunk for chunk in chunks)


def test_chunk_text_intelligent_respects_max_chars():
    """Test that chunks respect max_chars limit"""
    long_text = "word " * 200  # Create a long paragraph
    text_items = [{"text": long_text, "page": 1}]

    max_chars = 100
    chunks = chunk_text_intelligent(text_items, max_chars=max_chars, overlap_chars=20)

    # Allow some buffer for overlap
    for chunk in chunks:
        assert chunk["char_count"] <= max_chars + 50, f"Chunk too large: {chunk['char_count']}"


def test_chunk_text_intelligent_preserves_pages():
    """Test that page numbers are preserved"""
    text_items = [
        {"text": "Page one content", "page": 1},
        {"text": "Page two content", "page": 2},
    ]

    chunks = chunk_text_intelligent(text_items, max_chars=50, overlap_chars=10)

    assert any(chunk["page"] == 1 for chunk in chunks)
    assert any(chunk["page"] == 2 for chunk in chunks)


def test_chunk_text_intelligent_empty_input():
    """Test chunking with empty input"""
    chunks = chunk_text_intelligent([], max_chars=100, overlap_chars=10)
    assert chunks == []


def test_chunk_text_intelligent_whitespace_only():
    """Test chunking with whitespace-only text"""
    text_items = [{"text": "   \n\n   ", "page": 1}]
    chunks = chunk_text_intelligent(text_items, max_chars=100, overlap_chars=10)
    assert chunks == []


@patch("ingestion.pdfplumber")
def test_extract_text_from_pdf_local_file(mock_pdfplumber):
    """Test PDF extraction from local file"""
    # Mock PDF structure
    mock_page = Mock()
    mock_page.extract_text.return_value = "Test content from page"

    mock_pdf = Mock()
    mock_pdf.pages = [mock_page]
    mock_pdf.__enter__ = Mock(return_value=mock_pdf)
    mock_pdf.__exit__ = Mock(return_value=False)

    mock_pdfplumber.open.return_value = mock_pdf

    result = extract_text_from_pdf("/path/to/test.pdf")

    assert len(result) == 1
    assert result[0]["text"] == "Test content from page"
    assert result[0]["page"] == 1
    assert result[0]["total_pages"] == 1


@patch("ingestion.pdfplumber")
def test_extract_text_from_pdf_multiple_pages(mock_pdfplumber):
    """Test PDF extraction with multiple pages"""
    mock_pages = [Mock(), Mock(), Mock()]
    for i, page in enumerate(mock_pages, 1):
        page.extract_text.return_value = f"Content from page {i}"

    mock_pdf = Mock()
    mock_pdf.pages = mock_pages
    mock_pdf.__enter__ = Mock(return_value=mock_pdf)
    mock_pdf.__exit__ = Mock(return_value=False)

    mock_pdfplumber.open.return_value = mock_pdf

    result = extract_text_from_pdf("/path/to/test.pdf")

    assert len(result) == 3
    assert result[0]["page"] == 1
    assert result[1]["page"] == 2
    assert result[2]["page"] == 3
    assert all(item["total_pages"] == 3 for item in result)


@patch("ingestion.pdfplumber")
def test_extract_text_from_pdf_skips_empty_pages(mock_pdfplumber):
    """Test that empty pages are skipped"""
    mock_pages = [Mock(), Mock(), Mock()]
    mock_pages[0].extract_text.return_value = "Content"
    mock_pages[1].extract_text.return_value = ""  # Empty page
    mock_pages[2].extract_text.return_value = "More content"

    mock_pdf = Mock()
    mock_pdf.pages = mock_pages
    mock_pdf.__enter__ = Mock(return_value=mock_pdf)
    mock_pdf.__exit__ = Mock(return_value=False)

    mock_pdfplumber.open.return_value = mock_pdf

    result = extract_text_from_pdf("/path/to/test.pdf")

    assert len(result) == 2  # Empty page skipped


@pytest.mark.asyncio
@patch("ingestion.extract_text_from_pdf")
@patch("ingestion.embedding_service")
@patch("ingestion.vector_store")
async def test_ingest_document_success(mock_vector_store, mock_embedding_service, mock_extract):
    """Test successful document ingestion"""
    # Mock PDF extraction
    mock_extract.return_value = [
        {"text": "Test content for ingestion", "page": 1, "total_pages": 1}
    ]

    # Mock embedding generation
    mock_embedding_service.embed_batch_sync.return_value = [[0.1] * 768]

    # Mock vector store upsert
    mock_vector_store.upsert_chunks_batch = AsyncMock(return_value=(1, 0))

    stats = await ingest_document(
        pdf_path="/path/to/test.pdf",
        document_id="test-doc",
        document_name="Test Document",
        document_type="manual",
        metadata={"crop": "tomato"},
    )

    assert stats["document_id"] == "test-doc"
    assert stats["document_name"] == "Test Document"
    assert stats["successful_chunks"] == 1
    assert stats["failed_chunks"] == 0
    assert "duration_seconds" in stats


@pytest.mark.asyncio
@patch("ingestion.extract_text_from_pdf")
@patch("ingestion.embedding_service")
@patch("ingestion.vector_store")
async def test_ingest_document_with_batching(
    mock_vector_store, mock_embedding_service, mock_extract
):
    """Test document ingestion with multiple batches"""
    # Create enough text to generate multiple chunks
    long_text = "This is a paragraph. " * 100
    mock_extract.return_value = [{"text": long_text, "page": 1, "total_pages": 1}]

    # Mock embedding generation (will be called in batches)
    mock_embedding_service.embed_batch_sync.return_value = [[0.1] * 768] * 20

    # Mock vector store
    mock_vector_store.upsert_chunks_batch = AsyncMock(return_value=(20, 0))

    stats = await ingest_document(
        pdf_path="/path/to/test.pdf",
        document_id="test-doc",
        document_name="Test Document",
    )

    assert stats["successful_chunks"] > 0
    # Embedding service should be called (possibly multiple times for batching)
    assert mock_embedding_service.embed_batch_sync.called


@pytest.mark.asyncio
@patch("ingestion.extract_text_from_pdf")
async def test_ingest_document_handles_pdf_error(mock_extract):
    """Test that ingestion handles PDF extraction errors"""
    mock_extract.side_effect = Exception("PDF extraction failed")

    with pytest.raises(Exception) as exc_info:
        await ingest_document(
            pdf_path="/path/to/bad.pdf",
            document_id="bad-doc",
            document_name="Bad Document",
        )

    assert "PDF extraction failed" in str(exc_info.value)


def test_chunk_text_intelligent_with_overlap():
    """Test that overlap between chunks works correctly"""
    text_items = [
        {
            "text": "First paragraph with content.\n\nSecond paragraph with more content.\n\nThird paragraph here.",
            "page": 1,
        }
    ]

    chunks = chunk_text_intelligent(text_items, max_chars=60, overlap_chars=20)

    # Check that there are multiple chunks
    assert len(chunks) >= 2

    # Verify chunks have reasonable sizes
    for chunk in chunks:
        assert len(chunk["text"]) > 0
        assert chunk["char_count"] > 0


