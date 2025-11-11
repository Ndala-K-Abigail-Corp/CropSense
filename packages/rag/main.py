"""
Main FastAPI application for CropSense RAG backend (Retrieval-Only)
"""

from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from retriever import retriever_service
from embeddings import embedding_service
from vector_store import vector_store
from config import settings

# Initialize FastAPI app
app = FastAPI(
    title="CropSense RAG API",
    description="Retrieval-only RAG backend for CropSense agricultural guidance platform",
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
    min_score: Optional[float] = None


class RetrievedChunk(BaseModel):
    chunkId: str
    content: str
    score: float
    metadata: Dict[str, Any]


class QueryResponse(BaseModel):
    query: str
    chunks: List[RetrievedChunk]
    totalRetrieved: int
    context: str


class EmbedRequest(BaseModel):
    text: str
    task_type: Optional[str] = "RETRIEVAL_DOCUMENT"


class EmbedResponse(BaseModel):
    embedding: List[float]
    dimension: int


class DocumentInfo(BaseModel):
    documentId: str
    source: str
    documentType: str
    chunkCount: int
    createdAt: Optional[Any] = None


class DocumentListResponse(BaseModel):
    documents: List[DocumentInfo]
    totalDocuments: int


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "cropsense-rag", "version": "1.0.0"}


# Query endpoint (Retrieval-only)
@app.post("/query", response_model=QueryResponse)
async def query(request: QueryRequest):
    """
    Retrieve relevant chunks for a query (retrieval-only, no generation)

    Args:
        request: Query request with query text, optional top_k, filters, and min_score

    Returns:
        Retrieved chunks with similarity scores and formatted context

    Example request:
        {
            "query": "How to prevent tomato blight?",
            "top_k": 5,
            "filters": {"crop": "tomato"},
            "min_score": 0.6
        }
    """
    try:
        # Retrieve relevant chunks
        results = await retriever_service.retrieve(
            query=request.query,
            top_k=request.top_k,
            filters=request.filters,
            min_score=request.min_score
        )

        # Build formatted context
        context = retriever_service.build_context(results)

        # Format chunks for response
        chunks = []
        for result in results:
            chunks.append(
                RetrievedChunk(
                    chunkId=result.get("chunkId", "unknown"),
                    content=result.get("content", ""),
                    score=result.get("score", 0.0),
                    metadata=result.get("metadata", {})
                )
            )

        return QueryResponse(
            query=request.query,
            chunks=chunks,
            totalRetrieved=len(results),
            context=context
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Query processing failed: {str(e)}"
        )


# Embedding endpoint
@app.post("/embed", response_model=EmbedResponse)
async def embed(request: EmbedRequest):
    """
    Generate embedding for text
    
    Args:
        request: Text to embed and task type
        
    Returns:
        Embedding vector and dimension
    """
    try:
        embedding = await embedding_service.embed_text(
            request.text,
            task_type=request.task_type
        )
        dimension = embedding_service.get_embedding_dimension()

        return EmbedResponse(embedding=embedding, dimension=dimension)

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Embedding generation failed: {str(e)}"
        )


# Documents list endpoint
@app.get("/documents", response_model=DocumentListResponse)
async def list_documents():
    """
    List all ingested documents in the vector store
    
    Returns:
        List of documents with metadata and chunk counts
    """
    try:
        documents = await vector_store.list_documents()
        
        return DocumentListResponse(
            documents=[
                DocumentInfo(**doc) for doc in documents
            ],
            totalDocuments=len(documents)
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to list documents: {str(e)}"
        )


# Document statistics endpoint
@app.get("/documents/{document_id}/stats")
async def get_document_stats(document_id: str):
    """
    Get statistics for a specific document
    
    Args:
        document_id: Document identifier
        
    Returns:
        Document statistics
    """
    try:
        chunk_count = await vector_store.count_chunks(document_id=document_id)
        
        if chunk_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Document '{document_id}' not found"
            )
        
        return {
            "documentId": document_id,
            "chunkCount": chunk_count
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get document stats: {str(e)}"
        )


# Run the app
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.api_reload,
    )
