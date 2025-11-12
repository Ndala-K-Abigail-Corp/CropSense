"""Auto-ingest test farming data (no prompts)"""

import asyncio
import sys
from config import settings
from ingestion import chunk_text_intelligent, generate_chunk_id
from embeddings import embedding_service
from vector_store import vector_store

async def ingest_text(text_content, document_id, document_name, document_type, metadata):
    """Ingest plain text"""
    print(f"\n{'='*60}")
    print(f"Ingesting: {document_name}")
    print(f"{'='*60}")
    
    text_items = [{"text": text_content, "page": 1, "total_pages": 1}]
    
    print("[1/3] Chunking...")
    chunks = chunk_text_intelligent(text_items, max_chars=settings.chunk_size, overlap_chars=settings.chunk_overlap)
    print(f"  Created {len(chunks)} chunks")
    
    print("[2/3] Generating embeddings...")
    batch_texts = [chunk["text"] for chunk in chunks]
    embeddings = embedding_service.embed_batch_sync(batch_texts, task_type="RETRIEVAL_DOCUMENT")
    
    print("[3/3] Storing...")
    chunks_data = []
    for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        chunks_data.append({
            "chunk_id": generate_chunk_id(document_id, idx),
            "content": chunk["text"],
            "embedding": embedding,
            "metadata": {
                "documentId": document_id,
                "source": document_name,
                "pageNumber": 1,
                "chunkIndex": idx,
                "documentType": document_type,
                **metadata
            }
        })
    
    successful, failed = await vector_store.upsert_chunks_batch(chunks_data)
    print(f"✓ Stored: {successful} successful, {failed} failed")
    
    return {"document_id": document_id, "chunks": len(chunks), "successful": successful, "failed": failed}

async def main():
    samples = [
        {
            "text_content": "Maize leaf blight prevention: Use crop rotation, proper spacing, resistant varieties. Early detection is key - look for brown spots on leaves during humid conditions. Remove infected plants immediately. Use fungicides sparingly following guidelines. Ensure good field drainage to reduce moisture.",
            "document_id": "maize-blight-guide",
            "document_name": "Maize Blight Prevention",
            "document_type": "guide",
            "metadata": {"crop": "maize", "category": "disease_management", "region": "zambia"}
        },
        {
            "text_content": "Tomato farming in Zambia: Prepare soil well, plant after last frost with 60cm spacing. Water regularly but avoid overwatering. Common pests include aphids and hornworms - use integrated pest management. Harvest when fruits are firm and fully colored. Proper post-harvest handling reduces losses.",
            "document_id": "tomato-farming-zambia",
            "document_name": "Tomato Farming - Zambia",
            "document_type": "manual",
            "metadata": {"crop": "tomato", "region": "zambia", "category": "cultivation"}
        }
    ]
    
    print("="*60)
    print("INGESTING TEST FARMING KNOWLEDGE")
    print("="*60)
    print(f"Documents to ingest: {len(samples)}\n")
    
    results = []
    for sample in samples:
        try:
            result = await ingest_text(**sample)
            results.append(result)
        except Exception as e:
            print(f"✗ Error: {e}")
            import traceback
            traceback.print_exc()
    
    print("\n"+"="*60)
    print("COMPLETE")
    print("="*60)
    print(f"Processed: {len(results)}/{len(samples)}")
    print(f"Total chunks: {sum(r['successful'] for r in results)}")
    print("\n✅ Next: Run check_data.py and test_retrieval.py")

if __name__ == "__main__":
    asyncio.run(main())

