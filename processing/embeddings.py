"""
Embedding generation utilities for Vertex AI
"""

import os
from typing import List
from google.cloud import aiplatform
from vertexai.language_models import TextEmbeddingModel


def initialize_vertex_ai(project_id: str, location: str = "us-central1"):
    """Initialize Vertex AI."""
    aiplatform.init(project=project_id, location=location)


def generate_text_embeddings(
    texts: List[str],
    task_type: str = "RETRIEVAL_DOCUMENT",
    model_name: str = "text-embedding-004",
    output_dimensionality: int = 768,
) -> List[List[float]]:
    """
    Generate text embeddings using Vertex AI.

    Args:
        texts: List of text strings to embed
        task_type: Task type for embedding (RETRIEVAL_DOCUMENT or QUESTION_ANSWERING)
        model_name: Model name (text-embedding-004 is the latest stable)
        output_dimensionality: Output dimension (768 for cost/performance balance)

    Returns:
        List of embedding vectors
    """
    try:
        model = TextEmbeddingModel.from_pretrained(model_name)

        # text-embedding-004 API - Returns list of TextEmbedding objects
        embeddings = model.get_embeddings(
            texts, output_dimensionality=output_dimensionality
        )

        # Extract embedding values from response objects
        # TextEmbedding objects have .values attribute
        return [
            list(emb.values) if hasattr(emb, "values") else emb for emb in embeddings
        ]
    except Exception as e:
        print(f"Error generating embeddings: {e}")
        raise


def generate_query_embedding(
    query: str, model_name: str = "text-embedding-004", output_dimensionality: int = 768
) -> List[float]:
    """
    Generate embedding for a query using QUESTION_ANSWERING task type.

    Args:
        query: Query text
        model_name: Model name
        output_dimensionality: Output dimension

    Returns:
        Embedding vector
    """
    embeddings = generate_text_embeddings(
        [query],
        task_type="QUESTION_ANSWERING",
        model_name=model_name,
        output_dimensionality=output_dimensionality,
    )

    return embeddings[0] if embeddings else []
