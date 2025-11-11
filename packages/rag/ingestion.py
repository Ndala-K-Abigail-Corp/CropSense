"""
Document ingestion module for processing and embedding agricultural documents
"""

import io
import re
import argparse
from typing import List, Dict, Any, Optional
from pathlib import Path
from datetime import datetime
from google.cloud import storage
from embeddings import embedding_service
from vector_store import vector_store
from config import settings


def estimate_tokens(text: str) -> int:
    """
    Rough estimation of tokens (1 token ≈ 4 characters)
    
    Args:
        text: Input text
        
    Returns:
        Estimated token count
    """
    return len(text) // 4


def extract_text_from_pdf(pdf_path: str) -> List[Dict[str, Any]]:
    """
    Extract text from PDF file with page information
    
    Args:
        pdf_path: Path to PDF file (local or GCS)
        
    Returns:
        List of dictionaries with 'text' and 'page' keys
    """
    try:
        import pdfplumber
        
        text_items = []
        
        # Handle GCS paths
        if pdf_path.startswith("gs://"):
            # Download from GCS
            parts = pdf_path.replace("gs://", "").split("/", 1)
            bucket_name = parts[0]
            blob_name = parts[1]
            
            storage_client = storage.Client(project=settings.google_cloud_project)
            bucket = storage_client.bucket(bucket_name)
            blob = bucket.blob(blob_name)
            pdf_bytes = blob.download_as_bytes()
            pdf_file = io.BytesIO(pdf_bytes)
        else:
            # Local file
            pdf_file = pdf_path
        
        with pdfplumber.open(pdf_file) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                text = page.extract_text()
                if text and text.strip():
                    text_items.append({
                        "text": text.strip(),
                        "page": page_num,
                        "total_pages": len(pdf.pages)
                    })
        
        return text_items
        
    except ImportError:
        print("Error: pdfplumber not installed. Install with: pip install pdfplumber")
        raise
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        raise


def chunk_text_intelligent(
    text_items: List[Dict[str, Any]],
    max_chars: int = 512,
    overlap_chars: int = 50,
) -> List[Dict[str, Any]]:
    """
    Chunk text into semantically coherent sections with overlap
    
    Based on patterns from processing/chunking.py but adapted for character-based chunking
    
    Args:
        text_items: List of dicts with 'text' and 'page' keys
        max_chars: Maximum characters per chunk
        overlap_chars: Character overlap between chunks
        
    Returns:
        List of chunk dictionaries with text, page, char_count, and metadata
    """
    chunks = []
    
    for item in text_items:
        page_num = item.get("page", 1)
        text = item.get("text", "")
        
        if not text.strip():
            continue
        
        # Split into paragraphs first (better semantic boundaries)
        paragraphs = re.split(r'\n\s*\n', text)
        
        current_chunk = []
        current_chars = 0
        
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            
            para_chars = len(para)
            
            # If adding this paragraph would exceed max_chars
            if current_chars + para_chars > max_chars and current_chunk:
                # Save current chunk
                chunk_text = "\n\n".join(current_chunk)
                chunks.append({
                    "text": chunk_text,
                    "page": page_num,
                    "char_count": current_chars,
                    "tokens": estimate_tokens(chunk_text),
                    "chunkIndex": len(chunks),
                })
                
                # Start new chunk with overlap
                if overlap_chars > 0 and current_chunk:
                    # Use last paragraph for overlap
                    overlap_text = current_chunk[-1]
                    if len(overlap_text) > overlap_chars:
                        # Truncate overlap to max overlap size
                        overlap_text = overlap_text[-overlap_chars:]
                    current_chunk = [overlap_text, para]
                    current_chars = len(overlap_text) + para_chars
                else:
                    current_chunk = [para]
                    current_chars = para_chars
            else:
                current_chunk.append(para)
                current_chars += para_chars
        
        # Add remaining chunk
        if current_chunk:
            chunk_text = "\n\n".join(current_chunk)
            chunks.append({
                "text": chunk_text,
                "page": page_num,
                "char_count": current_chars,
                "tokens": estimate_tokens(chunk_text),
                "chunkIndex": len(chunks),
            })
    
    return chunks


def generate_chunk_id(document_id: str, chunk_index: int) -> str:
    """
    Generate a unique chunk ID
    
    Args:
        document_id: Document identifier
        chunk_index: Index of chunk within document
        
    Returns:
        Unique chunk ID
    """
    return f"{document_id}_chunk_{chunk_index:04d}"


async def ingest_document(
    pdf_path: str,
    document_id: str,
    document_name: str,
    document_type: str = "manual",
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Complete ingestion pipeline for a single document
    
    Args:
        pdf_path: Path to PDF (local or gs://)
        document_id: Unique document identifier
        document_name: Human-readable document name
        document_type: Type of document (manual, guide, research, etc.)
        metadata: Additional metadata (crop, region, etc.)
        
    Returns:
        Dictionary with ingestion statistics
    """
    print(f"\n{'='*60}")
    print(f"Ingesting: {document_name}")
    print(f"Document ID: {document_id}")
    print(f"{'='*60}")
    
    start_time = datetime.now()
    
    # 1. Extract text from PDF
    print("\n[1/4] Extracting text from PDF...")
    text_items = extract_text_from_pdf(pdf_path)
    print(f"  Extracted {len(text_items)} pages")
    
    # 2. Chunk text
    print("\n[2/4] Chunking text...")
    chunks = chunk_text_intelligent(
        text_items,
        max_chars=settings.chunk_size,
        overlap_chars=settings.chunk_overlap
    )
    print(f"  Created {len(chunks)} chunks")
    
    # 3. Generate embeddings in batches
    print("\n[3/4] Generating embeddings...")
    batch_size = settings.embedding_batch_size
    all_embeddings = []
    
    for i in range(0, len(chunks), batch_size):
        batch_chunks = chunks[i:i + batch_size]
        batch_texts = [chunk["text"] for chunk in batch_chunks]
        
        batch_num = i // batch_size + 1
        total_batches = (len(chunks) + batch_size - 1) // batch_size
        print(f"  Processing batch {batch_num}/{total_batches} ({len(batch_texts)} chunks)...")
        
        # Use sync method for ingestion scripts
        batch_embeddings = embedding_service.embed_batch_sync(
            batch_texts,
            task_type="RETRIEVAL_DOCUMENT"
        )
        all_embeddings.extend(batch_embeddings)
    
    # 4. Store in Firestore
    print("\n[4/4] Storing chunks in Firestore...")
    
    # Prepare chunks data for batch upsert
    chunks_data = []
    base_metadata = metadata or {}
    
    for idx, (chunk, embedding) in enumerate(zip(chunks, all_embeddings)):
        chunk_id = generate_chunk_id(document_id, idx)
        
        chunk_metadata = {
            "documentId": document_id,
            "source": document_name,
            "pageNumber": chunk.get("page", 1),
            "chunkIndex": idx,
            "documentType": document_type,
            **base_metadata  # Add any additional metadata (crop, region, etc.)
        }
        
        chunks_data.append({
            "chunk_id": chunk_id,
            "content": chunk["text"],
            "embedding": embedding,
            "metadata": chunk_metadata
        })
    
    # Batch upsert
    successful, failed = await vector_store.upsert_chunks_batch(chunks_data)
    
    # Calculate stats
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    stats = {
        "document_id": document_id,
        "document_name": document_name,
        "pages": len(text_items),
        "chunks": len(chunks),
        "successful_chunks": successful,
        "failed_chunks": failed,
        "duration_seconds": duration,
        "timestamp": end_time.isoformat()
    }
    
    print(f"\n{'='*60}")
    print(f"✓ SUCCESS: Ingested {document_name}")
    print(f"  Pages: {stats['pages']}")
    print(f"  Chunks: {stats['chunks']}")
    print(f"  Stored: {successful} successful, {failed} failed")
    print(f"  Duration: {duration:.1f}s")
    print(f"{'='*60}\n")
    
    return stats


async def ingest_document_sync(
    pdf_path: str,
    document_id: str,
    document_name: str,
    document_type: str = "manual",
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Synchronous wrapper for ingest_document (for CLI use)
    """
    return await ingest_document(pdf_path, document_id, document_name, document_type, metadata)


def main():
    """
    CLI interface for document ingestion
    
    Usage:
        python ingestion.py --pdf path/to/doc.pdf --id tomato-guide --name "Tomato Growing Guide"
        python ingestion.py --pdf gs://bucket/doc.pdf --id corn-manual --name "Corn Manual" --type manual --crop corn
    """
    parser = argparse.ArgumentParser(description="Ingest agricultural documents into RAG system")
    parser.add_argument("--pdf", required=True, help="Path to PDF file (local or gs://)")
    parser.add_argument("--id", required=True, help="Unique document ID (e.g., tomato-guide-2024)")
    parser.add_argument("--name", required=True, help="Human-readable document name")
    parser.add_argument("--type", default="manual", help="Document type (manual, guide, research)")
    parser.add_argument("--crop", help="Crop type (optional)")
    parser.add_argument("--region", help="Region (optional)")
    
    args = parser.parse_args()
    
    # Prepare metadata
    metadata = {}
    if args.crop:
        metadata["crop"] = args.crop
    if args.region:
        metadata["region"] = args.region
    
    # Run ingestion
    import asyncio
    
    stats = asyncio.run(ingest_document(
        pdf_path=args.pdf,
        document_id=args.id,
        document_name=args.name,
        document_type=args.type,
        metadata=metadata if metadata else None
    ))
    
    print("\nIngestion complete!")
    print(f"Stats: {stats}")


if __name__ == "__main__":
    main()

