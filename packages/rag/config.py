"""
Configuration settings for the RAG backend
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Google Cloud
    google_cloud_project: str = os.getenv("GOOGLE_CLOUD_PROJECT", "")
    google_application_credentials: Optional[str] = os.getenv(
        "GOOGLE_APPLICATION_CREDENTIALS"
    )

    # Vertex AI
    vertex_ai_location: str = os.getenv("VERTEX_AI_LOCATION", "us-central1")
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "text-embedding-005")
    embedding_dimension: int = int(os.getenv("EMBEDDING_DIMENSION", "768"))
    generation_model: str = os.getenv("GENERATION_MODEL", "gemini-2.5-pro")

    # Firestore
    firestore_database: str = os.getenv("FIRESTORE_DATABASE", "(default)")
    # Firestore Collection for Vector Storage
    vector_collection: str = os.getenv("VECTOR_COLLECTION", "vectorChunks")


    # RAG Configuration
    chunk_size: int = int(os.getenv("CHUNK_SIZE", "512"))
    chunk_overlap: int = int(os.getenv("CHUNK_OVERLAP", "50"))
    top_k_results: int = int(os.getenv("TOP_K_RESULTS", "5"))
    max_context_length: int = int(os.getenv("MAX_CONTEXT_LENGTH", "8000"))

    # API Configuration
    api_host: str = os.getenv("API_HOST", "0.0.0.0")
    api_port: int = int(os.getenv("API_PORT", "8000"))
    api_reload: bool = os.getenv("API_RELOAD", "True").lower() == "true"

    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
