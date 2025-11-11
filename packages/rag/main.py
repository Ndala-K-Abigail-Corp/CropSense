"""
Main FastAPI application for RAG backend
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from retriever import retriever_service
from embeddings import embedding_service
from config import settings

# Initialize FastAPI app
app = FastAPI(
    title="CropSense RAG API",
    description="RAG backend for CropSense agricultural guidance platform",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response models
class QueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = None
    filters: Optional[Dict[str, Any]] = None


class Source(BaseModel):
    documentId: str
    title: str
    pageNumber: Optional[int] = None
    excerpt: str


class QueryResponse(BaseModel):
    answer: str
    sources: List[Source]
    retrievedChunks: int


class EmbedRequest(BaseModel):
    text: str


class EmbedResponse(BaseModel):
    embedding: List[float]
    dimension: int


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "cropsense-rag", "version": "1.0.0"}


# Query endpoint
@app.post("/query", response_model=QueryResponse)
async def query(request: QueryRequest):
    """
    Process a query and return RAG response

    This is a stub implementation for development.
    In production, this should:
    1. Retrieve relevant chunks
    2. Build context
    3. Call Vertex AI Gemini for generation
    4. Return answer with citations
    """
    try:
        # Retrieve relevant chunks
        results = await retriever_service.retrieve(
            query=request.query, top_k=request.top_k, filters=request.filters
        )

        # Build context
        context = retriever_service.build_context(results)

        # Generate answer (stub for development)
        # In production, call Vertex AI Gemini here
        answer = generate_mock_answer(request.query, context)

        # Format sources
        sources = []
        for result in results[:3]:  # Top 3 sources
            metadata = result.get("metadata", {})
            sources.append(
                Source(
                    documentId=metadata.get("documentId", "unknown"),
                    title=metadata.get("source", "Unknown Document"),
                    pageNumber=metadata.get("pageNumber"),
                    excerpt=result.get("content", "")[:200] + "...",
                )
            )

        return QueryResponse(
            answer=answer, sources=sources, retrievedChunks=len(results)
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Query processing failed: {str(e)}"
        )


# Embedding endpoint
@app.post("/embed", response_model=EmbedResponse)
async def embed(request: EmbedRequest):
    """Generate embedding for text"""
    try:
        embedding = await embedding_service.embed_text(request.text)
        dimension = embedding_service.get_embedding_dimension()

        return EmbedResponse(embedding=embedding, dimension=dimension)

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Embedding generation failed: {str(e)}"
        )


def generate_mock_answer(query: str, context: str) -> str:
    """
    Generate a mock answer for development
    In production, replace with Vertex AI Gemini call
    """
    return f"""Based on the available agricultural resources, here's guidance for your question about "{query}":

This is a mock response for development purposes. In production, this will be replaced with actual generative AI responses from Vertex AI Gemini, using the retrieved context from trusted agricultural documents.

The system has retrieved relevant information from the knowledge base and would synthesize a comprehensive answer citing specific sources and page numbers.

Key points to consider:
1. Follow local agricultural best practices
2. Consider your specific soil and climate conditions
3. Consult with agricultural extension services for region-specific guidance

Note: This is advisory information only. Please consult with local agricultural experts for specific recommendations."""


# Run the app
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.api_reload,
    )
