"""
Embeddings service using Vertex AI text-multilingual-embedding-002
"""

from typing import List, Optional
import time
from google.cloud import aiplatform
from vertexai.language_models import TextEmbeddingModel, TextEmbeddingInput
from config import settings


class EmbeddingService:
    """Service for generating text embeddings using Vertex AI"""

    def __init__(self):
        """Initialize the Vertex AI client"""
        aiplatform.init(
            project=settings.google_cloud_project, 
            location=settings.vertex_ai_location
        )
        self.model_name = settings.embedding_model
        self.dimension = settings.embedding_dimension
        self._model = None

    def _get_model(self) -> TextEmbeddingModel:
        """Lazy load the embedding model"""
        if self._model is None:
            self._model = TextEmbeddingModel.from_pretrained(self.model_name)
        return self._model

    async def embed_text(
        self, 
        text: str, 
        task_type: str = "RETRIEVAL_DOCUMENT"
    ) -> List[float]:
        """
        Generate embedding for a single text string

        Args:
            text: Input text to embed
            task_type: Type of task - "RETRIEVAL_DOCUMENT" for ingestion,
                      "QUESTION_ANSWERING" for queries

        Returns:
            List of floats representing the embedding vector (768-dim)
        """
        try:
            embeddings = await self.embed_batch([text], task_type=task_type)
            return embeddings[0] if embeddings else []
        except Exception as e:
            print(f"Error generating single embedding: {e}")
            raise

    async def embed_batch(
        self, 
        texts: List[str],
        task_type: str = "RETRIEVAL_DOCUMENT",
        retry_count: int = 3
    ) -> List[List[float]]:
        """
        Generate embeddings for multiple texts with automatic retries

        Args:
            texts: List of input texts to embed
            task_type: Type of task - "RETRIEVAL_DOCUMENT" for ingestion,
                      "QUESTION_ANSWERING" for queries
            retry_count: Number of retries on failure

        Returns:
            List of embedding vectors
        """
        if not texts:
            return []

        for attempt in range(retry_count):
            try:
                model = self._get_model()
                
                # Create TextEmbeddingInput objects with task type
                embedding_inputs = [
                    TextEmbeddingInput(text=text, task_type=task_type)
                    for text in texts
                ]
                
                # Generate embeddings
                embeddings = model.get_embeddings(
                    embedding_inputs,
                    output_dimensionality=self.dimension
                )
                
                # Extract embedding values from response objects
                # TextEmbedding objects have .values attribute
                return [
                    list(emb.values) if hasattr(emb, 'values') else list(emb)
                    for emb in embeddings
                ]
                
            except Exception as e:
                if attempt < retry_count - 1:
                    # Exponential backoff for rate limiting
                    wait_time = 2 ** attempt
                    print(f"Embedding generation failed (attempt {attempt + 1}/{retry_count}), "
                          f"retrying in {wait_time}s: {e}")
                    time.sleep(wait_time)
                else:
                    print(f"Error generating batch embeddings after {retry_count} attempts: {e}")
                    raise

    def embed_text_sync(
        self, 
        text: str, 
        task_type: str = "RETRIEVAL_DOCUMENT"
    ) -> List[float]:
        """
        Synchronous version of embed_text for CLI/scripts
        
        Args:
            text: Input text to embed
            task_type: Type of task

        Returns:
            Embedding vector
        """
        try:
            model = self._get_model()
            embedding_input = TextEmbeddingInput(text=text, task_type=task_type)
            
            embeddings = model.get_embeddings(
                [embedding_input],
                output_dimensionality=self.dimension
            )
            
            return list(embeddings[0].values) if embeddings else []
        except Exception as e:
            print(f"Error in sync embedding generation: {e}")
            raise

    def embed_batch_sync(
        self, 
        texts: List[str],
        task_type: str = "RETRIEVAL_DOCUMENT",
        retry_count: int = 3
    ) -> List[List[float]]:
        """
        Synchronous version of embed_batch for CLI/scripts
        
        Args:
            texts: List of input texts to embed
            task_type: Type of task
            retry_count: Number of retries on failure

        Returns:
            List of embedding vectors
        """
        if not texts:
            return []

        for attempt in range(retry_count):
            try:
                model = self._get_model()
                
                embedding_inputs = [
                    TextEmbeddingInput(text=text, task_type=task_type)
                    for text in texts
                ]
                
                embeddings = model.get_embeddings(
                    embedding_inputs,
                    output_dimensionality=self.dimension
                )
                
                return [list(emb.values) for emb in embeddings]
                
            except Exception as e:
                if attempt < retry_count - 1:
                    wait_time = 2 ** attempt
                    print(f"Batch embedding failed (attempt {attempt + 1}/{retry_count}), "
                          f"retrying in {wait_time}s: {e}")
                    time.sleep(wait_time)
                else:
                    print(f"Error generating batch embeddings after {retry_count} attempts: {e}")
                    raise

    def get_embedding_dimension(self) -> int:
        """Return the dimension of the embedding model"""
        return self.dimension


# Singleton instance
embedding_service = EmbeddingService()
