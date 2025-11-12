"""
Complete Ingestion Execution Script for CropSense RAG System

This script:
1. Detects all documents in farming_knowledge (Firestore collection or GCS bucket)
2. Identifies which documents have NOT yet been chunked into vectorChunks
3. Processes remaining documents through the full pipeline
4. Logs detailed progress and results
5. Skips already processed documents to avoid duplicates

Usage:
    # Process documents from GCS bucket
    python execute_full_ingestion.py --bucket YOUR_BUCKET --prefix farming_knowledge/
    
    # Process documents from Firestore collection
    python execute_full_ingestion.py --from-firestore
    
    # Process both
    python execute_full_ingestion.py --bucket YOUR_BUCKET --from-firestore
    
    # Dry run to see what would be processed
    python execute_full_ingestion.py --bucket YOUR_BUCKET --dry-run
"""

import asyncio
import argparse
from typing import List, Dict, Any, Set
from datetime import datetime
from google.cloud import firestore, storage
from config import settings
from document_processor import document_processor
from batch_ingest import ingest_single_document
from logger import logger
from vector_store import vector_store


class IngestionExecutor:
    """Manages the complete ingestion process"""
    
    def __init__(self):
        self.db = firestore.Client(
            project=settings.google_cloud_project,
            database=settings.firestore_database
        )
        self.storage_client = storage.Client(project=settings.google_cloud_project)
    
    async def get_processed_document_ids(self) -> Set[str]:
        """
        Get set of document IDs that have already been processed into vectorChunks
        
        Returns:
            Set of processed document IDs
        """
        logger.info("Scanning vectorChunks to identify already-processed documents...")
        
        try:
            # Query all chunks and extract unique document IDs
            chunks = self.db.collection(settings.vector_collection).stream()
            
            processed_ids = set()
            for chunk in chunks:
                data = chunk.to_dict()
                metadata = data.get("metadata", {})
                doc_id = metadata.get("documentId")
                if doc_id:
                    processed_ids.add(doc_id)
            
            logger.info(f"Found {len(processed_ids)} unique documents already in vectorChunks")
            return processed_ids
            
        except Exception as e:
            logger.error(f"Error getting processed documents: {e}")
            return set()
    
    async def get_firestore_documents(self) -> List[Dict[str, Any]]:
        """
        Get all documents from farming_knowledge Firestore collection
        
        Returns:
            List of document info dictionaries
        """
        logger.info("Fetching documents from farming_knowledge collection...")
        
        try:
            docs = self.db.collection('farming_knowledge').stream()
            
            documents = []
            for doc in docs:
                data = doc.to_dict()
                
                # Check if document has content
                content = data.get('content') or data.get('text') or data.get('body') or ""
                if not content.strip():
                    logger.warning(f"Skipping {doc.id}: No content")
                    continue
                
                documents.append({
                    "document_id": doc.id,
                    "name": data.get("title", doc.id),
                    "source": "firestore",
                    "collection": "farming_knowledge",
                    "file_type": "text",
                    "size_bytes": len(content),
                    "data": data
                })
            
            logger.info(f"Found {len(documents)} documents in farming_knowledge")
            return documents
            
        except Exception as e:
            logger.error(f"Error fetching Firestore documents: {e}")
            return []
    
    async def get_gcs_documents(
        self, 
        bucket_name: str, 
        prefix: str = "",
        file_extensions: List[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get all documents from GCS bucket
        
        Args:
            bucket_name: GCS bucket name
            prefix: Path prefix to filter files
            file_extensions: List of file extensions to include
            
        Returns:
            List of document info dictionaries
        """
        if file_extensions is None:
            file_extensions = ['pdf', 'docx', 'txt']
        
        logger.info(f"Scanning GCS bucket: gs://{bucket_name}/{prefix}")
        
        try:
            documents = await document_processor.list_gcs_documents(
                bucket_name, prefix, file_extensions
            )
            
            logger.info(f"Found {len(documents)} documents in GCS")
            return documents
            
        except Exception as e:
            logger.error(f"Error scanning GCS: {e}")
            return []
    
    async def filter_unprocessed(
        self, 
        all_documents: List[Dict[str, Any]], 
        processed_ids: Set[str]
    ) -> List[Dict[str, Any]]:
        """
        Filter out documents that have already been processed
        
        Args:
            all_documents: All available documents
            processed_ids: Set of already-processed document IDs
            
        Returns:
            List of unprocessed documents
        """
        unprocessed = []
        
        for doc in all_documents:
            doc_id = doc["document_id"]
            
            if doc_id in processed_ids:
                logger.info(f"✓ Already processed: {doc_id}")
            else:
                logger.info(f"✗ Not processed: {doc_id}")
                unprocessed.append(doc)
        
        return unprocessed
    
    async def ingest_firestore_document(self, doc_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ingest a document from Firestore farming_knowledge
        
        Args:
            doc_info: Document information dictionary
            
        Returns:
            Ingestion statistics
        """
        from ingestion import chunk_text_intelligent, generate_chunk_id
        from embeddings import embedding_service
        
        doc_id = doc_info["document_id"]
        doc_data = doc_info["data"]
        
        logger.info(f"\n{'='*60}")
        logger.info(f"Ingesting Firestore document: {doc_id}")
        logger.info(f"{'='*60}")
        
        start_time = datetime.now()
        
        try:
            # Extract content
            content = doc_data.get('content') or doc_data.get('text') or doc_data.get('body') or ""
            
            if not content.strip():
                raise ValueError("No content in document")
            
            # Create text_items format
            text_items = [{
                "text": content,
                "page": 1,
                "total_pages": 1
            }]
            
            # 1. Chunk text
            logger.info("[1/4] Chunking text...")
            chunks = chunk_text_intelligent(
                text_items,
                max_chars=settings.chunk_size,
                overlap_chars=settings.chunk_overlap
            )
            logger.info(f"  Created {len(chunks)} chunks")
            
            # 2. Generate embeddings
            logger.info("[2/4] Generating embeddings...")
            batch_size = settings.embedding_batch_size
            all_embeddings = []
            
            for i in range(0, len(chunks), batch_size):
                batch_chunks = chunks[i:i + batch_size]
                batch_texts = [chunk["text"] for chunk in batch_chunks]
                
                batch_num = i // batch_size + 1
                total_batches = (len(chunks) + batch_size - 1) // batch_size
                logger.info(f"  Batch {batch_num}/{total_batches}...")
                
                batch_embeddings = embedding_service.embed_batch_sync(
                    batch_texts,
                    task_type="RETRIEVAL_DOCUMENT"
                )
                all_embeddings.extend(batch_embeddings)
            
            # 3. Store in Firestore
            logger.info("[3/4] Storing in vectorChunks...")
            
            base_metadata = {
                "crop": doc_data.get("crop", ""),
                "region": doc_data.get("region", ""),
                "category": doc_data.get("category", ""),
                "originalCollection": "farming_knowledge"
            }
            
            chunks_data = []
            for idx, (chunk, embedding) in enumerate(zip(chunks, all_embeddings)):
                chunk_id = generate_chunk_id(doc_id, idx)
                
                chunk_metadata = {
                    "documentId": doc_id,
                    "source": doc_data.get("title", doc_id),
                    "pageNumber": 1,
                    "chunkIndex": idx,
                    "documentType": "knowledge",
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
            
            # 4. Update status
            logger.info("[4/4] Updating status...")
            await document_processor.update_document_status(
                doc_id,
                "completed",
                metadata={
                    "source": "firestore",
                    "collection": "farming_knowledge",
                    "chunks": len(chunks),
                    "successfulChunks": successful,
                    "failedChunks": failed,
                    "completedAt": datetime.now().isoformat()
                }
            )
            
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            logger.info(f"✓ SUCCESS: {doc_id} - {successful} chunks in {duration:.1f}s")
            
            return {
                "document_id": doc_id,
                "source": "firestore",
                "chunks": len(chunks),
                "successful_chunks": successful,
                "failed_chunks": failed,
                "duration_seconds": duration,
                "status": "success"
            }
            
        except Exception as e:
            logger.error(f"✗ FAILED: {doc_id} - {str(e)}")
            
            await document_processor.update_document_status(
                doc_id,
                "failed",
                error_message=str(e)
            )
            
            return {
                "document_id": doc_id,
                "source": "firestore",
                "status": "failed",
                "error": str(e)
            }
    
    async def execute(
        self,
        bucket_name: str = None,
        prefix: str = "",
        from_firestore: bool = False,
        dry_run: bool = False
    ) -> Dict[str, Any]:
        """
        Execute the full ingestion process
        
        Args:
            bucket_name: GCS bucket name (optional)
            prefix: GCS path prefix (optional)
            from_firestore: Whether to process Firestore documents
            dry_run: If True, only show what would be processed
            
        Returns:
            Summary statistics
        """
        logger.info("=" * 60)
        logger.info("CropSense RAG Full Ingestion Execution")
        logger.info("=" * 60)
        logger.info(f"Project: {settings.google_cloud_project}")
        logger.info(f"Vector Collection: {settings.vector_collection}")
        logger.info(f"Dry Run: {dry_run}")
        logger.info("=" * 60)
        
        start_time = datetime.now()
        
        # Step 1: Get all processed document IDs
        processed_ids = await self.get_processed_document_ids()
        
        # Step 2: Get all available documents
        all_documents = []
        
        if bucket_name:
            gcs_docs = await self.get_gcs_documents(bucket_name, prefix)
            all_documents.extend(gcs_docs)
        
        if from_firestore:
            firestore_docs = await self.get_firestore_documents()
            all_documents.extend(firestore_docs)
        
        if not all_documents:
            logger.info("\n⚠ No documents found to process")
            return {
                "total_documents": 0,
                "processed": 0,
                "failed": 0,
                "skipped": 0
            }
        
        logger.info(f"\nTotal documents found: {len(all_documents)}")
        
        # Step 3: Filter unprocessed documents
        logger.info("\nFiltering unprocessed documents...")
        unprocessed = await self.filter_unprocessed(all_documents, processed_ids)
        
        logger.info(f"\n{'='*60}")
        logger.info(f"Documents to process: {len(unprocessed)}")
        logger.info(f"Already processed: {len(all_documents) - len(unprocessed)}")
        logger.info(f"{'='*60}")
        
        if not unprocessed:
            logger.info("\n✓ All documents have already been processed!")
            return {
                "total_documents": len(all_documents),
                "processed": 0,
                "failed": 0,
                "skipped": len(all_documents)
            }
        
        # Show what will be processed
        logger.info("\nDocuments to be processed:")
        for i, doc in enumerate(unprocessed[:20], 1):
            logger.info(f"  [{i}] {doc['document_id']} ({doc['source']}, {doc['file_type']})")
        
        if len(unprocessed) > 20:
            logger.info(f"  ... and {len(unprocessed) - 20} more")
        
        if dry_run:
            logger.info("\n⚠ DRY RUN MODE - No documents will be processed")
            return {
                "total_documents": len(all_documents),
                "unprocessed": len(unprocessed),
                "dry_run": True
            }
        
        # Step 4: Process each document
        logger.info("\n" + "=" * 60)
        logger.info("Starting document processing...")
        logger.info("=" * 60)
        
        results = []
        successful = 0
        failed = 0
        
        for i, doc_info in enumerate(unprocessed, 1):
            logger.info(f"\n[{i}/{len(unprocessed)}] Processing {doc_info['document_id']}...")
            
            try:
                if doc_info["source"] == "firestore":
                    result = await self.ingest_firestore_document(doc_info)
                else:
                    result = await ingest_single_document(doc_info, document_type="guide")
                
                results.append(result)
                
                if result.get("status") == "failed":
                    failed += 1
                else:
                    successful += 1
                    
            except Exception as e:
                logger.error(f"Unexpected error: {e}")
                failed += 1
                results.append({
                    "document_id": doc_info["document_id"],
                    "status": "failed",
                    "error": str(e)
                })
        
        # Step 5: Summary
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        total_chunks = sum(r.get("successful_chunks", 0) for r in results)
        failed_chunks = sum(r.get("failed_chunks", 0) for r in results)
        
        logger.info("\n" + "=" * 60)
        logger.info("EXECUTION COMPLETE")
        logger.info("=" * 60)
        logger.info(f"Total documents found: {len(all_documents)}")
        logger.info(f"Already processed: {len(all_documents) - len(unprocessed)}")
        logger.info(f"Newly processed: {successful}")
        logger.info(f"Failed: {failed}")
        logger.info(f"Total chunks created: {total_chunks}")
        logger.info(f"Failed chunks: {failed_chunks}")
        logger.info(f"Duration: {duration:.1f}s ({duration/60:.1f} minutes)")
        logger.info("=" * 60)
        
        return {
            "total_documents": len(all_documents),
            "already_processed": len(all_documents) - len(unprocessed),
            "newly_processed": successful,
            "failed": failed,
            "total_chunks": total_chunks,
            "failed_chunks": failed_chunks,
            "duration_seconds": duration
        }


async def main():
    """Main CLI interface"""
    parser = argparse.ArgumentParser(
        description="Execute full ingestion for CropSense RAG system",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Process documents from GCS bucket
  python execute_full_ingestion.py --bucket my-bucket --prefix farming_knowledge/
  
  # Process documents from Firestore
  python execute_full_ingestion.py --from-firestore
  
  # Process both GCS and Firestore
  python execute_full_ingestion.py --bucket my-bucket --from-firestore
  
  # Dry run to see what would be processed
  python execute_full_ingestion.py --bucket my-bucket --dry-run
        """
    )
    
    parser.add_argument(
        "--bucket",
        help="GCS bucket name (without gs:// prefix)"
    )
    parser.add_argument(
        "--prefix",
        default="",
        help="GCS path prefix (e.g., 'farming_knowledge/' or 'agricultural-docs/')"
    )
    parser.add_argument(
        "--from-firestore",
        action="store_true",
        help="Process documents from Firestore farming_knowledge collection"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be processed without actually processing"
    )
    
    args = parser.parse_args()
    
    if not args.bucket and not args.from_firestore:
        parser.error("Must specify either --bucket or --from-firestore (or both)")
    
    # Execute
    executor = IngestionExecutor()
    summary = await executor.execute(
        bucket_name=args.bucket,
        prefix=args.prefix,
        from_firestore=args.from_firestore,
        dry_run=args.dry_run
    )
    
    logger.info("\n✓ Execution complete!")
    logger.info(f"Summary: {summary}")


if __name__ == "__main__":
    asyncio.run(main())

