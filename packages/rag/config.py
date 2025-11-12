"""
Configuration settings for the RAG backend
"""

import os
from typing import Optional
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Google Cloud
    google_cloud_project: str = os.getenv("GOOGLE_CLOUD_PROJECT", "")
    google_application_credentials: Optional[str] = os.getenv(
        "GOOGLE_APPLICATION_CREDENTIALS"
    )

    # Vertex AI
    vertex_ai_location: str = os.getenv("VERTEX_AI_LOCATION", "us-east1")
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "text-embedding-005")
    embedding_dimension: int = int(os.getenv("EMBEDDING_DIMENSION", "768"))
    generation_model: str = os.getenv("GENERATION_MODEL", "gemini-2.0-flash-exp")
    
    # Gemini Configuration
    gemini_enabled: bool = os.getenv("GEMINI_ENABLED", "True").lower() == "true"
    gemini_max_requests_per_hour: int = int(os.getenv("GEMINI_MAX_REQUESTS_PER_HOUR", "60"))
    gemini_cache_ttl_hours: int = int(os.getenv("GEMINI_CACHE_TTL_HOURS", "24"))
    gemini_fallback_threshold: float = float(os.getenv("GEMINI_FALLBACK_THRESHOLD", "0.5"))

    # Firestore
    firestore_database: str = os.getenv("FIRESTORE_DATABASE", "(default)")
    # Firestore Collection for Vector Storage
    vector_collection: str = os.getenv("VECTOR_COLLECTION", "vectorChunks")


    # RAG Configuration
    chunk_size: int = int(os.getenv("CHUNK_SIZE", "512"))
    chunk_overlap: int = int(os.getenv("CHUNK_OVERLAP", "50"))
    top_k_results: int = int(os.getenv("TOP_K_RESULTS", "5"))
    max_context_length: int = int(os.getenv("MAX_CONTEXT_LENGTH", "8000"))
    similarity_threshold: float = float(os.getenv("SIMILARITY_THRESHOLD", "0.6"))
    firestore_batch_size: int = int(os.getenv("FIRESTORE_BATCH_SIZE", "50"))
    embedding_batch_size: int = int(os.getenv("EMBEDDING_BATCH_SIZE", "20"))

    # API Configuration
    api_host: str = os.getenv("API_HOST", "0.0.0.0")
    api_port: int = int(os.getenv("API_PORT", "8000"))
    api_reload: bool = os.getenv("API_RELOAD", "True").lower() == "true"

    class Config:
        env_file = ".env"
        case_sensitive = False
    
    # Field validators
    @field_validator('chunk_size')
    @classmethod
    def validate_chunk_size(cls, v: int) -> int:
        """Validate chunk size is within reasonable bounds"""
        if v < 100:
            raise ValueError('chunk_size must be at least 100 characters')
        if v > 2000:
            raise ValueError('chunk_size must not exceed 2000 characters')
        return v
    
    @field_validator('chunk_overlap')
    @classmethod
    def validate_chunk_overlap(cls, v: int) -> int:
        """Validate chunk overlap is non-negative"""
        if v < 0:
            raise ValueError('chunk_overlap must be non-negative')
        return v
    
    @field_validator('top_k_results')
    @classmethod
    def validate_top_k(cls, v: int) -> int:
        """Validate top_k is reasonable"""
        if v < 1:
            raise ValueError('top_k_results must be at least 1')
        if v > 50:
            raise ValueError('top_k_results should not exceed 50 for performance')
        return v
    
    @field_validator('similarity_threshold')
    @classmethod
    def validate_similarity_threshold(cls, v: float) -> float:
        """Validate similarity threshold is between 0 and 1"""
        if v < 0.0 or v > 1.0:
            raise ValueError('similarity_threshold must be between 0.0 and 1.0')
        return v
    
    @field_validator('embedding_dimension')
    @classmethod
    def validate_embedding_dimension(cls, v: int) -> int:
        """Validate embedding dimension is supported"""
        valid_dims = [256, 512, 768, 1024]
        if v not in valid_dims:
            raise ValueError(f'embedding_dimension must be one of {valid_dims}')
        return v
    
    @model_validator(mode='after')
    def validate_chunk_overlap_vs_size(self) -> 'Settings':
        """Validate that chunk_overlap is less than chunk_size"""
        if self.chunk_overlap >= self.chunk_size:
            raise ValueError('chunk_overlap must be less than chunk_size')
        return self
    
    @model_validator(mode='after')
    def validate_google_cloud_project(self) -> 'Settings':
        """Validate that Google Cloud project is set"""
        if not self.google_cloud_project:
            raise ValueError('GOOGLE_CLOUD_PROJECT environment variable must be set')
        return self


# Global settings instance
try:
    settings = Settings()
except Exception as e:
    print(f"❌ Configuration error: {e}")
    print("\n💡 Please check your .env file and ensure all required variables are set.")
    print("   See env.example for required configuration.\n")
    raise
