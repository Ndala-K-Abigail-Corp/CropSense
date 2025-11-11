"""
Text chunking utilities for intelligent document segmentation
"""

import re
from typing import List, Dict, Any


def estimate_tokens(text: str) -> int:
    """
    Rough estimation of tokens (1 token ≈ 4 characters).
    More accurate would use tiktoken or similar, but this is simpler.
    """
    return len(text) // 4


def chunk_text_intelligent(
    text_items: List[Dict[str, Any]],
    max_tokens: int = 500,
    overlap_tokens: int = 50,
    preserve_headers: bool = True,
) -> List[Dict[str, Any]]:
    """
    Chunk text into semantically coherent sections.

    Args:
        text_items: List of dicts with 'text' and 'page' keys
        max_tokens: Maximum tokens per chunk
        overlap_tokens: Number of tokens to overlap between chunks
        preserve_headers: Whether to preserve section headers

    Returns:
        List of chunk dictionaries with text, page, tokens, and metadata
    """
    chunks = []

    for item in text_items:
        page_num = item.get("page", 1)
        text = item.get("text", "")

        if not text.strip():
            continue

        # Split into paragraphs first
        paragraphs = re.split(r"\n\s*\n", text)

        current_chunk = []
        current_tokens = 0

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            para_tokens = estimate_tokens(para)

            # Check if paragraph is a header (all caps, short, ends with colon)
            is_header = (
                preserve_headers
                and len(para) < 100
                and (para.isupper() or para.endswith(":"))
            )

            # If adding this paragraph would exceed max_tokens
            if current_tokens + para_tokens > max_tokens and current_chunk:
                # Save current chunk
                chunk_text = "\n\n".join(current_chunk)
                chunks.append(
                    {
                        "text": chunk_text,
                        "page": page_num,
                        "tokens": current_tokens,
                        "chunkIndex": len(chunks),
                        "isHeader": False,
                    }
                )

                # Start new chunk with overlap
                if overlap_tokens > 0:
                    overlap_text = "\n\n".join(
                        current_chunk[-1:]
                    )  # Last paragraph as overlap
                    current_chunk = [overlap_text] if overlap_text else []
                    current_tokens = estimate_tokens(overlap_text)
                else:
                    current_chunk = []
                    current_tokens = 0

            # Add paragraph to current chunk
            current_chunk.append(para)
            current_tokens += para_tokens

            # If header, optionally start new chunk after header
            if is_header and current_chunk and len(current_chunk) > 1:
                # Keep header with first paragraph
                pass

        # Add remaining chunk
        if current_chunk:
            chunk_text = "\n\n".join(current_chunk)
            chunks.append(
                {
                    "text": chunk_text,
                    "page": page_num,
                    "tokens": current_tokens,
                    "chunkIndex": len(chunks),
                    "isHeader": False,
                }
            )

    return chunks


def chunk_text_simple(
    text: str, max_tokens: int = 500, overlap_tokens: int = 50
) -> List[Dict[str, Any]]:
    """
    Simple sentence-based chunking with overlap.

    Args:
        text: Input text
        max_tokens: Maximum tokens per chunk
        overlap_tokens: Tokens to overlap

    Returns:
        List of chunk dictionaries
    """
    # Split into sentences
    sentences = re.split(r"(?<=[.!?])\s+", text)

    chunks = []
    current_chunk = []
    current_tokens = 0

    for sentence in sentences:
        sentence_tokens = estimate_tokens(sentence)

        if current_tokens + sentence_tokens > max_tokens and current_chunk:
            # Save chunk
            chunk_text = " ".join(current_chunk)
            chunks.append(
                {
                    "text": chunk_text,
                    "tokens": current_tokens,
                    "chunkIndex": len(chunks),
                }
            )

            # Overlap: keep last few sentences
            overlap_sentences = []
            overlap_count = 0
            for s in reversed(current_chunk):
                s_tokens = estimate_tokens(s)
                if overlap_count + s_tokens <= overlap_tokens:
                    overlap_sentences.insert(0, s)
                    overlap_count += s_tokens
                else:
                    break

            current_chunk = overlap_sentences + [sentence]
            current_tokens = overlap_count + sentence_tokens
        else:
            current_chunk.append(sentence)
            current_tokens += sentence_tokens

    # Add remaining chunk
    if current_chunk:
        chunk_text = " ".join(current_chunk)
        chunks.append(
            {"text": chunk_text, "tokens": current_tokens, "chunkIndex": len(chunks)}
        )

    return chunks
