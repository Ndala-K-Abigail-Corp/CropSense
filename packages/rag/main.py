"""
Main FastAPI application for CropSense RAG backend (Retrieval-Only)
"""

import os
import time
from fastapi import FastAPI, HTTPException, Security, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from retriever import retriever_service
from embeddings import embedding_service
from vector_store import vector_store
from gemini_service import gemini_service
from config import settings
from logger import logger
from cache import query_cache

# Initialize FastAPI app
app = FastAPI(
    title="CropSense RAG API",
    description="Retrieval-only RAG backend for CropSense agricultural guidance platform",
    version="1.0.0",
)

# CORS middleware
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # Configure via environment variable
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Key Security
API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)
RAG_API_KEY = os.getenv("RAG_API_KEY")


async def verify_api_key(api_key: str = Security(API_KEY_HEADER)) -> str:
    """
    Verify API key from request header
    
    If RAG_API_KEY is not set in environment, authentication is disabled (dev mode)
    """
    if not RAG_API_KEY:
        logger.warning("API key authentication is disabled (RAG_API_KEY not set)")
        return "dev-mode"
    
    if not api_key or api_key != RAG_API_KEY:
        logger.warning("Invalid API key attempt", provided_key=api_key[:10] if api_key else None)
        raise HTTPException(
            status_code=403,
            detail="Invalid or missing API key"
        )
    
    return api_key


# Request timing middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests with timing information"""
    start_time = time.time()
    
    logger.info(
        "Request started",
        method=request.method,
        path=request.url.path,
        client=request.client.host if request.client else None
    )
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    logger.info(
        "Request completed",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        duration_ms=round(duration * 1000, 2)
    )
    
    return response


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


class AnswerRequest(BaseModel):
    query: str
    use_rag: Optional[bool] = True
    top_k: Optional[int] = None
    filters: Optional[Dict[str, Any]] = None
    min_score: Optional[float] = None
    user_id: Optional[str] = None


class AnswerResponse(BaseModel):
    query: str
    answer: str
    source: str  # "gemini_with_rag", "gemini_direct", "cache", "error"
    chunks: Optional[List[RetrievedChunk]] = None
    cached: bool = False
    generation_time_ms: Optional[float] = None


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint with cache stats"""
    cache_stats = query_cache.get_stats()
    return {
        "status": "healthy",
        "service": "cropsense-rag",
        "version": "1.0.0",
        "cache": cache_stats
    }


# Query endpoint (Retrieval-only)
@app.post("/query", response_model=QueryResponse)
async def query(request: QueryRequest, api_key: str = Security(verify_api_key)):
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
    logger.info(
        "Query received",
        query=request.query[:100],  # Truncate for logging
        top_k=request.top_k,
        has_filters=bool(request.filters)
    )
    
    # Check cache first
    cache_key_data = {
        "query": request.query,
        "top_k": request.top_k,
        "filters": request.filters,
        "min_score": request.min_score
    }
    cached_result = query_cache.get(request.query, cache_key_data)
    
    if cached_result:
        logger.info("Cache hit", query=request.query[:100])
        return cached_result
    
    try:
        start_time = time.time()
        
        # Retrieve relevant chunks
        results = await retriever_service.retrieve(
            query=request.query,
            top_k=request.top_k,
            filters=request.filters,
            min_score=request.min_score
        )
        
        retrieval_time = time.time() - start_time

        # Build formatted context
        context = retriever_service.build_context(results)
        
        logger.info(
            "Query completed",
            query=request.query[:100],
            results_count=len(results),
            retrieval_time_ms=round(retrieval_time * 1000, 2)
        )

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

        response = QueryResponse(
            query=request.query,
            chunks=chunks,
            totalRetrieved=len(results),
            context=context
        )
        
        # Cache the response
        query_cache.set(request.query, response, cache_key_data)
        
        return response

    except Exception as e:
        logger.error(
            "Query failed",
            query=request.query[:100],
            error=e
        )
        raise HTTPException(
            status_code=500, detail=f"Query processing failed: {str(e)}"
        )


# Embedding endpoint
@app.post("/embed", response_model=EmbedResponse)
async def embed(request: EmbedRequest, api_key: str = Security(verify_api_key)):
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
async def list_documents(api_key: str = Security(verify_api_key)):
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
async def get_document_stats(document_id: str, api_key: str = Security(verify_api_key)):
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


# Gemini-powered answer endpoint with RAG fallback
@app.post("/answer", response_model=AnswerResponse)
async def answer_question(request: AnswerRequest, api_key: str = Security(verify_api_key)):
    """
    Answer question using Gemini with optional RAG context
    
    This endpoint implements intelligent fallback:
    1. If use_rag=True, first retrieves relevant context from vector store
    2. If good context found (score >= threshold), uses Gemini with RAG context
    3. If no good context found, falls back to Gemini direct answer
    4. Includes caching and rate limiting
    
    Args:
        request: Answer request with query, optional RAG parameters, and user_id
        
    Returns:
        Generated answer with source information and retrieved chunks
        
    Example request:
        {
            "query": "How to prevent tomato blight?",
            "use_rag": true,
            "top_k": 5,
            "min_score": 0.6,
            "user_id": "user123"
        }
    """
    if not settings.gemini_enabled:
        raise HTTPException(
            status_code=503,
            detail="Gemini service is not enabled"
        )
    
    logger.info(
        "Answer request",
        query=request.query[:100],
        use_rag=request.use_rag,
        user_id=request.user_id
    )
    
    try:
        context = None
        retrieved_chunks = None
        
        # Step 1: Try RAG retrieval if enabled
        if request.use_rag:
            logger.info("Attempting RAG retrieval")
            try:
                # Retrieve relevant chunks
                results = await retriever_service.retrieve(
                    query=request.query,
                    top_k=request.top_k,
                    filters=request.filters,
                    min_score=request.min_score
                )
                
                # Check if we have good results
                if results and len(results) > 0:
                    best_score = results[0].get("score", 0)
                    fallback_threshold = settings.gemini_fallback_threshold
                    
                    if best_score >= fallback_threshold:
                        # Good context found, build context string
                        context = retriever_service.build_context(results)
                        logger.info(f"Using RAG context with {len(results)} chunks")
                        
                        # Format chunks for response
                        retrieved_chunks = [
                            RetrievedChunk(
                                chunkId=result.get("chunkId", "unknown"),
                                content=result.get("content", ""),
                                score=result.get("score", 0.0),
                                metadata=result.get("metadata", {})
                            )
                            for result in results
                        ]
                    else:
                        logger.info(
                            f"Best score {best_score:.2f} below threshold {fallback_threshold:.2f}, "
                            "falling back to direct Gemini"
                        )
                else:
                    logger.info("No relevant chunks found, falling back to direct Gemini")
                    
            except Exception as e:
                logger.error(f"RAG retrieval failed: {e}, falling back to direct Gemini")
        
        # Step 2: Generate answer with Gemini
        result = await gemini_service.generate_answer(
            query=request.query,
            context=context,
            user_id=request.user_id
        )
        
        # Step 3: Build response
        response = AnswerResponse(
            query=request.query,
            answer=result.get("answer", ""),
            source=result.get("source", "unknown"),
            chunks=retrieved_chunks,
            cached=result.get("cached", False),
            generation_time_ms=result.get("generation_time_ms")
        )
        
        logger.info(
            "Answer generated",
            source=response.source,
            cached=response.cached,
            chunks_used=len(retrieved_chunks) if retrieved_chunks else 0
        )
        
        return response
        
    except Exception as e:
        logger.error(
            "Answer generation failed",
            query=request.query[:100],
            error=e
        )
        raise HTTPException(
            status_code=500,
            detail=f"Answer generation failed: {str(e)}"
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
