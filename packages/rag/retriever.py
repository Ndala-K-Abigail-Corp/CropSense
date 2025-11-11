"""
Retrieval service for RAG pipeline
"""

from typing import List, Dict, Any
from embeddings import embedding_service
from vector_store import vector_store
from config import settings


class RetrieverService:
    """Service for retrieving relevant context for queries"""

    def __init__(self):
        self.embedding_service = embedding_service
        self.vector_store = vector_store
        self.top_k = settings.top_k_results

    async def retrieve(
        self,
        query: str,
        top_k: int | None = None,
        filters: Dict[str, Any] | None = None,
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant chunks for a query

        Args:
            query: The user's query text
            top_k: Number of results to return (default: from settings)
            filters: Optional metadata filters

        Returns:
            List of relevant chunks with scores
        """
        k = top_k or self.top_k

        # 1. Generate query embedding
        query_embedding = await self.embedding_service.embed_text(query)

        # 2. Search vector store
        results = await self.vector_store.search(
            query_embedding=query_embedding, top_k=k, filters=filters
        )

        return results

    def build_context(
        self, results: List[Dict[str, Any]], max_length: int | None = None
    ) -> str:
        """
        Build a context string from retrieval results

        Args:
            results: List of retrieval results
            max_length: Maximum character length for context

        Returns:
            Formatted context string
        """
        max_len = max_length or settings.max_context_length

        context_parts = []
        current_length = 0

        for i, result in enumerate(results):
            content = result.get("content", "")
            metadata = result.get("metadata", {})

            # Format: [Source: title, Page: X] content
            source = metadata.get("source", "Unknown")
            page = metadata.get("pageNumber", "N/A")

            chunk_text = f"[Source: {source}, Page: {page}]\n{content}\n"

            if current_length + len(chunk_text) > max_len:
                break

            context_parts.append(chunk_text)
            current_length += len(chunk_text)

        return "\n---\n".join(context_parts)


# Singleton instance
retriever_service = RetrieverService()
