"""
Simple script to process remaining documents with progress tracking
Processes documents in small batches with automatic resume capability
"""

import asyncio
from datetime import datetime
from batch_ingest import ingest_single_document
from document_processor import document_processor
from config import settings
from logger import logger


async def ingest_remaining_documents(
    bucket_name: str = "farming-knowledge-base",
    max_per_run: int = 5,
    skip_errors: bool = True
):
    """
    Process remaining unprocessed documents
    
    Args:
        bucket_name: GCS bucket name
        max_per_run: Maximum number of documents to process in this run
        skip_errors: Continue processing even if some documents fail
    """
    logger.info("=" * 80)
    logger.info("Processing Remaining Documents")
    logger.info("=" * 80)
    logger.info(f"Bucket: gs://{bucket_name}/")
    logger.info(f"Max per run: {max_per_run}")
    logger.info(f"Skip errors: {skip_errors}")
    logger.info("=" * 80)
    
    start_time = datetime.now()
    
    # Get unprocessed documents
    logger.info("\nScanning for unprocessed documents...")
    try:
        unprocessed = await document_processor.get_unprocessed_documents(
            bucket_name, "", ["pdf", "docx", "txt"]
        )
    except Exception as e:
        logger.error(f"Error scanning documents: {e}")
        return
    
    if not unprocessed:
        logger.info("\n✓ All documents have been processed!")
        return
    
    logger.info(f"\nFound {len(unprocessed)} unprocessed documents")
    
    # Limit to max_per_run
    documents_to_process = unprocessed[:max_per_run]
    
    logger.info(f"\nProcessing {len(documents_to_process)} documents in this run:")
    for i, doc in enumerate(documents_to_process, 1):
        size_mb = doc['size_bytes'] / (1024 * 1024)
        logger.info(f"  [{i}] {doc['document_id']} ({doc['file_type'].upper()}, {size_mb:.2f} MB)")
    
    # Process each document
    results = []
    successful = 0
    failed = 0
    
    for i, doc_info in enumerate(documents_to_process, 1):
        logger.info(f"\n{'='*80}")
        logger.info(f"[{i}/{len(documents_to_process)}] Processing: {doc_info['document_id']}")
        logger.info(f"{'='*80}")
        
        try:
            result = await ingest_single_document(doc_info, document_type="guide")
            results.append(result)
            
            if result.get("status") == "failed":
                failed += 1
                logger.error(f"✗ FAILED: {doc_info['document_id']}")
                if not skip_errors:
                    logger.info("Stopping due to error (skip_errors=False)")
                    break
            else:
                successful += 1
                chunks = result.get("successful_chunks", 0)
                duration = result.get("duration_seconds", 0)
                logger.info(f"✓ SUCCESS: {doc_info['document_id']} - {chunks} chunks in {duration:.1f}s")
                
        except KeyboardInterrupt:
            logger.info("\n\n⚠ Interrupted by user")
            break
        except Exception as e:
            logger.error(f"✗ UNEXPECTED ERROR: {doc_info['document_id']} - {e}")
            failed += 1
            if not skip_errors:
                logger.info("Stopping due to error (skip_errors=False)")
                break
    
    # Summary
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    total_chunks = sum(r.get("successful_chunks", 0) for r in results)
    
    logger.info("\n" + "=" * 80)
    logger.info("RUN SUMMARY")
    logger.info("=" * 80)
    logger.info(f"Documents processed: {successful + failed}/{len(documents_to_process)}")
    logger.info(f"  Successful: {successful}")
    logger.info(f"  Failed: {failed}")
    logger.info(f"Total chunks created: {total_chunks}")
    logger.info(f"Duration: {duration:.1f}s ({duration/60:.1f} minutes)")
    logger.info(f"Remaining unprocessed: {len(unprocessed) - len(documents_to_process)}")
    logger.info("=" * 80)
    
    if len(unprocessed) > len(documents_to_process):
        logger.info(f"\n💡 Run this script again to process the next {min(max_per_run, len(unprocessed) - len(documents_to_process))} documents")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Process remaining unprocessed documents")
    parser.add_argument("--bucket", default="farming-knowledge-base", help="GCS bucket name")
    parser.add_argument("--max", type=int, default=5, help="Maximum documents to process in this run")
    parser.add_argument("--no-skip-errors", action="store_true", help="Stop on first error")
    
    args = parser.parse_args()
    
    asyncio.run(ingest_remaining_documents(
        bucket_name=args.bucket,
        max_per_run=args.max,
        skip_errors=not args.no_skip_errors
    ))

