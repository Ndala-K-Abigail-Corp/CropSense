"""
Embeddings service using Vertex AI
"""

from typing import List, Optional
import numpy as np
from google.cloud import aiplatform
from config import settings


class EmbeddingService:
    """Service for generating text embeddings using Vertex AI"""

    def __init__(self):
        """Initialize the Vertex AI client"""
        aiplatform.init(
            project=settings.google_cloud_project, location=settings.vertex_ai_location
        )
        self.model_name = settings.embedding_model

    async def embed_text(self, text: str) -> List[float]:
        """
        Generate embedding for a single text string

        Args:
            text: Input text to embed

        Returns:
            List of floats representing the embedding vector
        """
        # Stub implementation for development
        # In production, replace with actual Vertex AI call
        return self._mock_embedding(text)

    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts

        Args:
            texts: List of input texts to embed

        Returns:
            List of embedding vectors
        """
        # Stub implementation for development
        return [self._mock_embedding(text) for text in texts]

    def _mock_embedding(self, text: str, dim: int = 768) -> List[float]:
        """
        Generate a mock embedding for development
        In production, this should call Vertex AI
        """
        # Generate a deterministic embedding based on text hash
        seed = hash(text) % (2**32)
        np.random.seed(seed)
        embedding = np.random.randn(dim)
        # Normalize to unit vector
        embedding = embedding / np.linalg.norm(embedding)
        return embedding.tolist()

    def get_embedding_dimension(self) -> int:
        """Return the dimension of the embedding model"""
        # text-embedding-005 has 768 dimensions
        return 768


# Singleton instance
embedding_service = EmbeddingService()
