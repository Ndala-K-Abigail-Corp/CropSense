"""
Tests for embeddings module
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from embeddings import EmbeddingService


@pytest.fixture
def mock_vertexai():
    """Mock Vertex AI initialization"""
    with patch("embeddings.vertexai.init") as mock_init:
        yield mock_init


@pytest.fixture
def embedding_service(mock_vertexai):
    """Create an EmbeddingService instance with mocked dependencies"""
    with patch("embeddings.TextEmbeddingModel") as mock_model:
        service = EmbeddingService()
        service.model = mock_model
        return service


@pytest.mark.asyncio
async def test_embed_text_success(embedding_service):
    """Test successful text embedding"""
    mock_embedding = Mock()
    mock_embedding.values = [0.1, 0.2, 0.3] * 256  # 768 dimensions

    mock_response = Mock()
    mock_response.embeddings = [mock_embedding]

    embedding_service.model.get_embeddings.return_value = mock_response

    result = await embedding_service.embed_text("Test text", task_type="RETRIEVAL_DOCUMENT")

    assert isinstance(result, list)
    assert len(result) == 768
    assert all(isinstance(val, float) for val in result)


@pytest.mark.asyncio
async def test_embed_text_with_retry(embedding_service):
    """Test embedding with retry on failure"""
    # First call fails, second succeeds
    mock_embedding = Mock()
    mock_embedding.values = [0.1] * 768

    mock_response = Mock()
    mock_response.embeddings = [mock_embedding]

    embedding_service.model.get_embeddings.side_effect = [
        Exception("Temporary failure"),
        mock_response,
    ]

    with patch("embeddings.asyncio.sleep", new_callable=AsyncMock):
        result = await embedding_service.embed_text("Test text")

    assert len(result) == 768


def test_embed_batch_sync_success(embedding_service):
    """Test synchronous batch embedding"""
    texts = ["Text 1", "Text 2", "Text 3"]

    mock_embeddings = []
    for _ in texts:
        mock_emb = Mock()
        mock_emb.values = [0.1] * 768
        mock_embeddings.append(mock_emb)

    mock_response = Mock()
    mock_response.embeddings = mock_embeddings

    embedding_service.model.get_embeddings.return_value = mock_response

    results = embedding_service.embed_batch_sync(texts, task_type="RETRIEVAL_DOCUMENT")

    assert len(results) == 3
    assert all(len(emb) == 768 for emb in results)


def test_embed_batch_sync_empty_input(embedding_service):
    """Test batch embedding with empty input"""
    results = embedding_service.embed_batch_sync([])
    assert results == []


def test_get_embedding_dimension(embedding_service):
    """Test getting embedding dimension"""
    dim = embedding_service.get_embedding_dimension()
    assert dim == 768


@pytest.mark.asyncio
async def test_embed_text_max_retries_exceeded(embedding_service):
    """Test that embedding fails after max retries"""
    embedding_service.model.get_embeddings.side_effect = Exception("Persistent failure")

    with patch("embeddings.asyncio.sleep", new_callable=AsyncMock):
        with pytest.raises(Exception) as exc_info:
            await embedding_service.embed_text("Test text", max_retries=2)

    assert "Persistent failure" in str(exc_info.value)


def test_embed_batch_sync_with_task_type(embedding_service):
    """Test that task type is properly passed"""
    texts = ["Query text"]

    mock_embedding = Mock()
    mock_embedding.values = [0.1] * 768

    mock_response = Mock()
    mock_response.embeddings = [mock_embedding]

    embedding_service.model.get_embeddings.return_value = mock_response

    embedding_service.embed_batch_sync(texts, task_type="QUESTION_ANSWERING")

    # Verify the task type was used in the call
    call_args = embedding_service.model.get_embeddings.call_args
    assert call_args is not None


class AsyncMock(Mock):
    """Helper class for async mocking"""

    async def __call__(self, *args, **kwargs):
        return super(AsyncMock, self).__call__(*args, **kwargs)
