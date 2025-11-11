"""
Vector store implementation using Firestore
"""

from typing import List, Dict, Any, Optional, Tuple
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
        self.collection_name = settings.vector_collection  # "vectorChunks"

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

    async def upsert_chunks_batch(
        self,
        chunks_data: List[Dict[str, Any]]
    ) -> Tuple[int, int]:
        """
        Batch insert/update multiple chunks efficiently
        
        Args:
            chunks_data: List of chunk dictionaries with keys:
                - chunk_id: str
                - content: str
                - embedding: List[float]
                - metadata: Dict[str, Any]
                
        Returns:
            Tuple of (successful_count, failed_count)
        """
        if not chunks_data:
            return (0, 0)
        
        batch = self.db.batch()
        batch_count = 0
        successful = 0
        failed = 0
        
        try:
            for chunk_data in chunks_data:
                chunk_id = chunk_data.get("chunk_id")
                if not chunk_id:
                    print(f"Warning: Skipping chunk without chunk_id")
                    failed += 1
                    continue
                    
                doc_ref = self.db.collection(self.collection_name).document(chunk_id)
                
                doc_data = {
                    "id": chunk_id,
                    "content": chunk_data.get("content", ""),
                    "embedding": chunk_data.get("embedding", []),
                    "embeddingDim": len(chunk_data.get("embedding", [])),
                    "metadata": chunk_data.get("metadata", {}),
                    "createdAt": firestore.SERVER_TIMESTAMP,
                    "updatedAt": firestore.SERVER_TIMESTAMP,
                }
                
                batch.set(doc_ref, doc_data)
                batch_count += 1
                
                # Commit every FIRESTORE_BATCH_SIZE documents (Firestore limit is 500)
                if batch_count >= settings.firestore_batch_size:
                    batch.commit()
                    successful += batch_count
                    print(f"  Committed batch of {batch_count} chunks...")
                    batch = self.db.batch()
                    batch_count = 0
            
            # Commit remaining documents
            if batch_count > 0:
                batch.commit()
                successful += batch_count
                print(f"  Committed final batch of {batch_count} chunks...")
                
        except Exception as e:
            print(f"Error in batch upsert: {e}")
            failed += batch_count
            raise
            
        return (successful, failed)

    async def delete_by_document_id(self, document_id: str) -> int:
        """
        Delete all chunks for a specific document

        Args:
            document_id: The document ID to delete

        Returns:
            Number of chunks deleted
        """
        try:
            query = self.db.collection(self.collection_name).where(
                "metadata.documentId", "==", document_id
            )

            docs = query.stream()
            count = 0

            batch = self.db.batch()
            batch_count = 0

            for doc in docs:
                batch.delete(doc.reference)
                batch_count += 1
                count += 1
                
                # Commit every 500 deletes
                if batch_count >= 500:
                    batch.commit()
                    batch = self.db.batch()
                    batch_count = 0
            
            # Commit remaining deletes
            if batch_count > 0:
                batch.commit()

            return count
            
        except Exception as e:
            print(f"Error deleting document chunks: {e}")
            raise

    async def count_chunks(self, document_id: Optional[str] = None) -> int:
        """
        Count total chunks or chunks for a specific document
        
        Args:
            document_id: Optional document ID to filter by
            
        Returns:
            Number of chunks
        """
        try:
            query = self.db.collection(self.collection_name)
            
            if document_id:
                query = query.where("metadata.documentId", "==", document_id)
            
            # Note: This loads all docs into memory. For large collections,
            # consider using aggregation queries when available
            docs = query.stream()
            return sum(1 for _ in docs)
            
        except Exception as e:
            print(f"Error counting chunks: {e}")
            return 0

    async def list_documents(self) -> List[Dict[str, Any]]:
        """
        List all unique documents in the vector store
        
        Returns:
            List of document info dictionaries
        """
        try:
            docs = self.db.collection(self.collection_name).stream()
            
            # Group by document ID
            documents_map = {}
            
            for doc in docs:
                data = doc.to_dict()
                metadata = data.get("metadata", {})
                doc_id = metadata.get("documentId", "unknown")
                
                if doc_id not in documents_map:
                    documents_map[doc_id] = {
                        "documentId": doc_id,
                        "source": metadata.get("source", "Unknown"),
                        "documentType": metadata.get("documentType", ""),
                        "chunkCount": 0,
                        "createdAt": data.get("createdAt"),
                    }
                
                documents_map[doc_id]["chunkCount"] += 1
            
            return list(documents_map.values())
            
        except Exception as e:
            print(f"Error listing documents: {e}")
            return []


# Singleton instance
vector_store = VectorStore()
