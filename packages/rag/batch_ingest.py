"""
Batch ingestion script for processing multiple documents from GCS
Automatically discovers and processes unprocessed documents
"""

import asyncio
import argparse
from typing import List, Dict, Any, Optional
from datetime import datetime
from document_processor import document_processor
from ingestion import chunk_text_intelligent, generate_chunk_id
from embeddings import embedding_service
from vector_store import vector_store
from config import settings
from logger import logger


async def ingest_single_document(
    doc_info: Dict[str, Any],
    document_type: str = "guide",
    additional_metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Ingest a single document from GCS
    
    Args:
        doc_info: Document information from list_gcs_documents
        document_type: Type of document (manual, guide, research, etc.)
        additional_metadata: Additional metadata to attach to chunks
        
    Returns:
        Ingestion statistics
    """
    document_id = doc_info["document_id"]
    file_path = doc_info["gcs_path"]
    file_type = doc_info["file_type"]
    
    logger.info(f"\n{'='*60}")
    logger.info(f"Ingesting: {document_id}")
    logger.info(f"File: {file_path}")
    logger.info(f"Type: {file_type}")
    logger.info(f"{'='*60}")
    
    start_time = datetime.now()
    
    try:
        # Update status to processing
        await document_processor.update_document_status(
            document_id,
            "processing",
            metadata={
                "gcsPath": file_path,
                "fileType": file_type,
                "startedAt": start_time.isoformat()
            }
        )
        
        # 1. Extract text from document
        logger.info("[1/4] Extracting text...")
        text_items = document_processor.extract_text(file_path, file_type)
        logger.info(f"  Extracted {len(text_items)} text sections")
        
        if not text_items:
            raise ValueError("No text extracted from document")
        
        # 2. Chunk text
        logger.info("[2/4] Chunking text...")
        chunks = chunk_text_intelligent(
            text_items,
            max_chars=settings.chunk_size,
            overlap_chars=settings.chunk_overlap
        )
        logger.info(f"  Created {len(chunks)} chunks")
        
        if not chunks:
            raise ValueError("No chunks created from text")
        
        # 3. Generate embeddings in batches
        logger.info("[3/4] Generating embeddings...")
        batch_size = settings.embedding_batch_size
        all_embeddings = []
        
        for i in range(0, len(chunks), batch_size):
            batch_chunks = chunks[i:i + batch_size]
            batch_texts = [chunk["text"] for chunk in batch_chunks]
            
            batch_num = i // batch_size + 1
            total_batches = (len(chunks) + batch_size - 1) // batch_size
            logger.info(f"  Processing batch {batch_num}/{total_batches} ({len(batch_texts)} chunks)...")
            
            batch_embeddings = embedding_service.embed_batch_sync(
                batch_texts,
                task_type="RETRIEVAL_DOCUMENT"
            )
            all_embeddings.extend(batch_embeddings)
        
        # 4. Store in Firestore
        logger.info("[4/4] Storing chunks in Firestore...")
        
        # Prepare chunks data for batch upsert
        chunks_data = []
        base_metadata = additional_metadata or {}
        
        for idx, (chunk, embedding) in enumerate(zip(chunks, all_embeddings)):
            chunk_id = generate_chunk_id(document_id, idx)
            
            chunk_metadata = {
                "documentId": document_id,
                "source": doc_info["name"],
                "pageNumber": chunk.get("page", 1),
                "chunkIndex": idx,
                "documentType": document_type,
                "gcsPath": file_path,
                "fileType": file_type,
                **base_metadata
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
        
        # Calculate file hash for deduplication
        file_hash = document_processor.calculate_file_hash(file_path)
        
        stats = {
            "document_id": document_id,
            "file_path": file_path,
            "file_type": file_type,
            "text_sections": len(text_items),
            "chunks": len(chunks),
            "successful_chunks": successful,
            "failed_chunks": failed,
            "duration_seconds": duration,
            "timestamp": end_time.isoformat()
        }
        
        # Update status to completed
        await document_processor.update_document_status(
            document_id,
            "completed",
            metadata={
                "gcsPath": file_path,
                "fileType": file_type,
                "fileHash": file_hash,
                "chunks": len(chunks),
                "successfulChunks": successful,
                "failedChunks": failed,
                "completedAt": end_time.isoformat(),
                "durationSeconds": duration
            }
        )
        
        logger.info(f"\n{'='*60}")
        logger.info(f"✓ SUCCESS: Ingested {document_id}")
        logger.info(f"  Chunks: {successful} successful, {failed} failed")
        logger.info(f"  Duration: {duration:.1f}s")
        logger.info(f"{'='*60}\n")
        
        return stats
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"✗ FAILED: {document_id} - {error_msg}")
        
        # Update status to failed
        await document_processor.update_document_status(
            document_id,
            "failed",
            error_message=error_msg
        )
        
        return {
            "document_id": document_id,
            "file_path": file_path,
            "status": "failed",
            "error": error_msg
        }


async def batch_ingest(
    bucket_name: str,
    prefix: str = "",
    document_type: str = "guide",
    file_extensions: Optional[List[str]] = None,
    max_documents: Optional[int] = None,
    skip_processed: bool = True
) -> Dict[str, Any]:
    """
    Batch ingest documents from GCS bucket
    
    Args:
        bucket_name: GCS bucket name
        prefix: Path prefix to filter files
        document_type: Type of document
        file_extensions: List of file extensions to process
        max_documents: Maximum number of documents to process (None for all)
        skip_processed: Skip already processed documents
        
    Returns:
        Summary statistics
    """
    logger.info("=" * 60)
    logger.info("Batch Document Ingestion")
    logger.info("=" * 60)
    logger.info(f"Bucket: gs://{bucket_name}/{prefix}")
    logger.info(f"Document Type: {document_type}")
    logger.info(f"File Extensions: {file_extensions or ['pdf', 'docx', 'txt']}")
    logger.info("=" * 60)
    
    start_time = datetime.now()
    
    # Get unprocessed documents
    if skip_processed:
        logger.info("\nScanning for unprocessed documents...")
        documents = await document_processor.get_unprocessed_documents(
            bucket_name, prefix, file_extensions
        )
    else:
        logger.info("\nScanning for all documents...")
        documents = await document_processor.list_gcs_documents(
            bucket_name, prefix, file_extensions
        )
    
    if not documents:
        logger.info("No documents to process")
        return {
            "total_documents": 0,
            "processed": 0,
            "failed": 0,
            "skipped": 0
        }
    
    logger.info(f"\nFound {len(documents)} documents to process")
    
    # Apply max_documents limit
    if max_documents and len(documents) > max_documents:
        logger.info(f"Limiting to first {max_documents} documents")
        documents = documents[:max_documents]
    
    # Show documents to be processed
    logger.info("\nDocuments to process:")
    for i, doc in enumerate(documents[:10], 1):
        logger.info(f"  [{i}] {doc['name']} ({doc['file_type'].upper()}, {doc['size_bytes']:,} bytes)")
    
    if len(documents) > 10:
        logger.info(f"  ... and {len(documents) - 10} more")
    
    # Process each document
    results = []
    successful = 0
    failed = 0
    
    for i, doc_info in enumerate(documents, 1):
        logger.info(f"\n[{i}/{len(documents)}] Processing {doc_info['document_id']}...")
        
        try:
            result = await ingest_single_document(
                doc_info,
                document_type=document_type
            )
            results.append(result)
            
            if result.get("status") == "failed":
                failed += 1
            else:
                successful += 1
                
        except Exception as e:
            logger.error(f"Unexpected error processing {doc_info['document_id']}: {e}")
            failed += 1
            results.append({
                "document_id": doc_info["document_id"],
                "status": "failed",
                "error": str(e)
            })
    
    # Summary
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    total_chunks = sum(r.get("successful_chunks", 0) for r in results if r.get("successful_chunks"))
    total_failed_chunks = sum(r.get("failed_chunks", 0) for r in results if r.get("failed_chunks"))
    
    summary = {
        "total_documents": len(documents),
        "processed": successful,
        "failed": failed,
        "total_chunks": total_chunks,
        "failed_chunks": total_failed_chunks,
        "duration_seconds": duration,
        "timestamp": end_time.isoformat()
    }
    
    logger.info("\n" + "=" * 60)
    logger.info("Batch Ingestion Summary")
    logger.info("=" * 60)
    logger.info(f"Documents: {successful} successful, {failed} failed out of {len(documents)}")
    logger.info(f"Chunks: {total_chunks} created, {total_failed_chunks} failed")
    logger.info(f"Duration: {duration:.1f}s ({duration/60:.1f} minutes)")
    logger.info("=" * 60)
    
    return summary


def main():
    """CLI interface for batch ingestion"""
    parser = argparse.ArgumentParser(
        description="Batch ingest documents from GCS bucket",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Process all unprocessed PDFs in a bucket
  python batch_ingest.py --bucket my-bucket --prefix farming-documents/
  
  # Process specific file types
  python batch_ingest.py --bucket my-bucket --extensions pdf docx txt
  
  # Process limited number of documents
  python batch_ingest.py --bucket my-bucket --max 10
  
  # Reprocess all documents (skip deduplication)
  python batch_ingest.py --bucket my-bucket --no-skip-processed
        """
    )
    
    parser.add_argument(
        "--bucket",
        required=True,
        help="GCS bucket name (without gs:// prefix)"
    )
    parser.add_argument(
        "--prefix",
        default="",
        help="Path prefix to filter files (e.g., 'farming-documents/')"
    )
    parser.add_argument(
        "--type",
        default="guide",
        help="Document type (manual, guide, research, etc.)"
    )
    parser.add_argument(
        "--extensions",
        nargs="+",
        default=["pdf", "docx", "txt"],
        help="File extensions to process (default: pdf docx txt)"
    )
    parser.add_argument(
        "--max",
        type=int,
        help="Maximum number of documents to process"
    )
    parser.add_argument(
        "--no-skip-processed",
        action="store_true",
        help="Process all documents, even if already processed"
    )
    
    args = parser.parse_args()
    
    # Run batch ingestion
    summary = asyncio.run(batch_ingest(
        bucket_name=args.bucket,
        prefix=args.prefix,
        document_type=args.type,
        file_extensions=args.extensions,
        max_documents=args.max,
        skip_processed=not args.no_skip_processed
    ))
    
    logger.info("\nBatch ingestion complete!")


if __name__ == "__main__":
    main()


