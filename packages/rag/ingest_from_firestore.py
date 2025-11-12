"""
Ingest documents from Firestore farming_knowledge collection into vectorChunks
"""

import asyncio
import argparse
from google.cloud import firestore
from config import settings
from ingestion import chunk_text_intelligent, generate_chunk_id
from embeddings import embedding_service
from vector_store import vector_store
from datetime import datetime

def fetch_farming_knowledge():
    """Fetch all documents from farming_knowledge collection"""
    db = firestore.Client(
        project=settings.google_cloud_project,
        database=settings.firestore_database
    )
    
    docs = db.collection('farming_knowledge').stream()
    return [(doc.id, doc.to_dict()) for doc in docs]

async def ingest_firestore_document(doc_id, doc_data):
    """
    Ingest a single document from Firestore
    
    Args:
        doc_id: Firestore document ID
        doc_data: Document data (should have 'content' or 'text' field)
    """
    print(f"\n{'='*60}")
    print(f"Ingesting: {doc_id}")
    print(f"{'='*60}")
    
    # Extract text content (adjust field names based on your schema)
    content = doc_data.get('content') or doc_data.get('text') or doc_data.get('body') or ""
    
    if not content or not content.strip():
        print(f"⚠ Skipping {doc_id}: No content found")
        return None
    
    # Create text_items format (like PDF extraction)
    text_items = [{
        "text": content,
        "page": 1,
        "total_pages": 1
    }]
    
    # 1. Chunk the text
    print("[1/3] Chunking text...")
    chunks = chunk_text_intelligent(
        text_items,
        max_chars=settings.chunk_size,
        overlap_chars=settings.chunk_overlap
    )
    print(f"  Created {len(chunks)} chunks")
    
    # 2. Generate embeddings
    print("[2/3] Generating embeddings...")
    batch_texts = [chunk["text"] for chunk in chunks]
    embeddings = embedding_service.embed_batch_sync(
        batch_texts,
        task_type="RETRIEVAL_DOCUMENT"
    )
    
    # 3. Store in Firestore
    print("[3/3] Storing in vectorChunks...")
    
    # Prepare metadata (extract from doc_data)
    base_metadata = {
        "crop": doc_data.get("crop", ""),
        "region": doc_data.get("region", ""),
        "category": doc_data.get("category", ""),
        "originalCollection": "farming_knowledge"
    }
    
    # Prepare chunks for batch upsert
    chunks_data = []
    for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
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
    
    print(f"✓ Ingested {doc_id}: {successful} chunks, {failed} failed")
    
    return {
        "doc_id": doc_id,
        "chunks": len(chunks),
        "successful": successful,
        "failed": failed
    }

async def main(force: bool = False):
    """Main ingestion flow"""
    print("=" * 60)
    print("Firestore farming_knowledge → vectorChunks Ingestion")
    print("=" * 60)
    
    # Fetch documents
    print("\nFetching documents from farming_knowledge...")
    docs = fetch_farming_knowledge()
    print(f"Found {len(docs)} documents")
    
    if len(docs) == 0:
        print("⚠ No documents found in farming_knowledge collection")
        return
    
    # Show what we found
    print("\nDocuments to ingest:")
    for i, (doc_id, doc_data) in enumerate(docs[:10], 1):
        title = doc_data.get('title', doc_id)
        print(f"  [{i}] {doc_id} - {title}")
    
    if len(docs) > 10:
        print(f"  ... and {len(docs) - 10} more")
    
    # Ask for confirmation (unless --force flag is used)
    if not force:
        response = input("\n⚠ Continue with ingestion? (y/n): ").lower()
        if response != 'y':
            print("Ingestion cancelled")
            return
    
    # Ingest all documents
    results = []
    for doc_id, doc_data in docs:
        try:
            result = await ingest_firestore_document(doc_id, doc_data)
            if result:
                results.append(result)
        except Exception as e:
            print(f"✗ Error ingesting {doc_id}: {e}")
    
    # Summary
    print("\n" + "=" * 60)
    print("Ingestion Summary")
    print("=" * 60)
    total_chunks = sum(r["successful"] for r in results)
    total_failed = sum(r["failed"] for r in results)
    print(f"Documents processed: {len(results)}")
    print(f"Total chunks created: {total_chunks}")
    print(f"Failed chunks: {total_failed}")
    print("=" * 60)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest Firestore documents into vectorChunks")
    parser.add_argument('--force', action='store_true', help='Skip confirmation prompt')
    args = parser.parse_args()
    
    asyncio.run(main(force=args.force))
