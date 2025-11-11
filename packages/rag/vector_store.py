"""
Vector store implementation using Firestore
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import numpy as np
from google.cloud import firestore
from config import settings


class VectorStore:
    """Vector store using Firestore for MVP"""

    def __init__(self):
        """Initialize Firestore client"""
        self.db = firestore.Client(
            project=settings.google_cloud_project, database=settings.firestore_database
        )
        self.collection_name = "vectorChunks"

    async def upsert_chunk(
        self,
        chunk_id: str,
        content: str,
        embedding: List[float],
        metadata: Dict[str, Any],
    ) -> None:
        """
        Insert or update a vector chunk in Firestore

        Args:
            chunk_id: Unique identifier for the chunk
            content: The text content
            embedding: The embedding vector
            metadata: Additional metadata (documentId, source, pageNumber, etc.)
        """
        doc_ref = self.db.collection(self.collection_name).document(chunk_id)

        doc_data = {
            "id": chunk_id,
            "content": content,
            "embedding": embedding,
            "embeddingDim": len(embedding),
            "metadata": metadata,
            "createdAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }

        doc_ref.set(doc_data)

    async def search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Search for similar vectors using cosine similarity

        Args:
            query_embedding: The query vector
            top_k: Number of results to return
            filters: Optional filters for metadata

        Returns:
            List of matching chunks with scores
        """
        # For MVP, we do client-side similarity search
        # In production, use Vertex AI Vector Search

        query_ref = self.db.collection(self.collection_name)

        # Apply filters if provided
        if filters:
            for key, value in filters.items():
                query_ref = query_ref.where(f"metadata.{key}", "==", value)

        # Fetch all documents (limit for performance in dev)
        docs = query_ref.limit(1000).stream()

        results = []
        query_vector = np.array(query_embedding)

        for doc in docs:
            data = doc.to_dict()
            chunk_embedding = np.array(data.get("embedding", []))

            if len(chunk_embedding) == 0:
                continue

            # Compute cosine similarity
            similarity = self._cosine_similarity(query_vector, chunk_embedding)

            results.append(
                {
                    "chunkId": data.get("id"),
                    "content": data.get("content"),
                    "score": float(similarity),
                    "metadata": data.get("metadata", {}),
                }
            )

        # Sort by score and return top_k
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

    @staticmethod
    def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
        """Compute cosine similarity between two vectors"""
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

    async def delete_by_document_id(self, document_id: str) -> int:
        """
        Delete all chunks for a specific document

        Args:
            document_id: The document ID to delete

        Returns:
            Number of chunks deleted
        """
        query = self.db.collection(self.collection_name).where(
            "metadata.documentId", "==", document_id
        )

        docs = query.stream()
        count = 0

        for doc in docs:
            doc.reference.delete()
            count += 1

        return count


# Singleton instance
vector_store = VectorStore()
