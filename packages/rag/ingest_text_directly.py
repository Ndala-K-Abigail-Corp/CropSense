"""Ingest text directly into vectorChunks (for testing without PDFs)"""

import asyncio
from config import settings
from ingestion import chunk_text_intelligent, generate_chunk_id
from embeddings import embedding_service
from vector_store import vector_store
from datetime import datetime

async def ingest_text(
    text_content: str,
    document_id: str,
    document_name: str,
    document_type: str = "manual",
    metadata: dict = None
):
    """Ingest plain text directly"""
    print(f"\n{'='*60}")
    print(f"Ingesting Text: {document_name}")
    print(f"Document ID: {document_id}")
    print(f"{'='*60}")
    
    # Create text_items format
    text_items = [{
        "text": text_content,
        "page": 1,
        "total_pages": 1
    }]
    
    # 1. Chunk
    print("\n[1/3] Chunking text...")
    chunks = chunk_text_intelligent(
        text_items,
        max_chars=settings.chunk_size,
        overlap_chars=settings.chunk_overlap
    )
    print(f"  Created {len(chunks)} chunks")
    
    # 2. Generate embeddings
    print("\n[2/3] Generating embeddings...")
    batch_texts = [chunk["text"] for chunk in chunks]
    embeddings = embedding_service.embed_batch_sync(
        batch_texts,
        task_type="RETRIEVAL_DOCUMENT"
    )
    print(f"  Generated {len(embeddings)} embeddings")
    
    # 3. Store
    print("\n[3/3] Storing in vectorChunks...")
    
    base_metadata = metadata or {}
    chunks_data = []
    
    for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        chunk_id = generate_chunk_id(document_id, idx)
        
        chunk_metadata = {
            "documentId": document_id,
            "source": document_name,
            "pageNumber": 1,
            "chunkIndex": idx,
            "documentType": document_type,
            **base_metadata
        }
        
        chunks_data.append({
            "chunk_id": chunk_id,
            "content": chunk["text"],
            "embedding": embedding,
            "metadata": chunk_metadata
        })
    
    successful, failed = await vector_store.upsert_chunks_batch(chunks_data)
    
    print(f"\n{'='*60}")
    print(f"✅ SUCCESS")
    print(f"{'='*60}")
    print(f"Chunks created: {len(chunks)}")
    print(f"Successfully stored: {successful}")
    print(f"Failed: {failed}")
    print(f"{'='*60}\n")
    
    return {
        "document_id": document_id,
        "chunks": len(chunks),
        "successful": successful,
        "failed": failed
    }

async def main():
    # Test samples
    samples = [
        {
            "text": """Maize leaf blight can be prevented by crop rotation, proper spacing, and using resistant varieties. 
            Early detection is key. Look for brown spots on leaves, especially during humid conditions. 
            Remove infected plants immediately to prevent spread. Use fungicides only when necessary, following manufacturer guidelines.
            Ensure good drainage in fields to reduce moisture that promotes fungal growth.""",
            "id": "maize-blight-guide",
            "name": "Maize Blight Prevention Guide",
            "type": "guide",
            "metadata": {"crop": "maize", "category": "disease_management"}
        },
        {
            "text": """Tomato farming in Zambia requires careful attention to soil preparation and irrigation. 
            Plant tomatoes after the last frost, spacing them 60cm apart. Water regularly but avoid overwatering. 
            Common pests include aphids and hornworms. Use integrated pest management strategies combining biological and chemical controls.
            Harvest when fruits are firm and fully colored. Post-harvest handling is critical to reduce losses.""",
            "id": "tomato-farming-zambia",
            "name": "Tomato Farming Best Practices - Zambia",
            "type": "manual",
            "metadata": {"crop": "tomato", "region": "zambia", "category": "cultivation"}
        }
    ]
    
    print("=" * 60)
    print("Direct Text Ingestion - Test Mode")
    print("=" * 60)
    print(f"\nThis will ingest {len(samples)} test documents into vectorChunks")
    
    response = input("\nProceed? (y/n): ").lower()
    if response != 'y':
        print("Cancelled")
        return
    
    results = []
    for sample in samples:
        result = await ingest_text(
            text_content=sample["text"],
            document_id=sample["id"],
            document_name=sample["name"],
            document_type=sample["type"],
            metadata=sample["metadata"]
        )
        results.append(result)
    
    print("\n" + "=" * 60)
    print("INGESTION COMPLETE")
    print("=" * 60)
    print(f"Documents processed: {len(results)}")
    print(f"Total chunks: {sum(r['successful'] for r in results)}")
    print("\nNext steps:")
    print("  1. Run: python check_data.py")
    print("  2. Run: python test_retrieval.py")
    print("  3. Test queries about maize blight or tomato farming!")

if __name__ == "__main__":
    asyncio.run(main())

