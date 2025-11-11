"""
Test script to verify RAG pipeline functionality

This script tests:
1. Embedding generation
2. Firestore connectivity
3. End-to-end retrieval pipeline
"""

import asyncio
from typing import List
from embeddings import embedding_service
from vector_store import vector_store
from retriever import retriever_service
from config import settings


async def test_embeddings():
    """Test 1: Verify embedding generation works"""
    print("\n" + "="*60)
    print("TEST 1: Embedding Generation")
    print("="*60)
    
    try:
        # Test single embedding
        print("\n[1.1] Testing single text embedding...")
        text = "How to grow tomatoes in warm climates?"
        embedding = await embedding_service.embed_text(text, task_type="QUESTION_ANSWERING")
        
        print(f"  Text: '{text}'")
        print(f"  Embedding dimension: {len(embedding)}")
        print(f"  First 5 values: {embedding[:5]}")
        print(f"  ✓ Single embedding successful")
        
        # Test batch embedding
        print("\n[1.2] Testing batch embedding...")
        texts = [
            "Best practices for corn cultivation",
            "Preventing tomato blight in humid regions",
            "Soil preparation for wheat farming"
        ]
        embeddings = await embedding_service.embed_batch(texts, task_type="RETRIEVAL_DOCUMENT")
        
        print(f"  Texts: {len(texts)}")
        print(f"  Embeddings generated: {len(embeddings)}")
        print(f"  Each embedding dimension: {len(embeddings[0])}")
        print(f"  ✓ Batch embedding successful")
        
        return True
        
    except Exception as e:
        print(f"  ✗ Embedding test failed: {e}")
        return False


async def test_firestore():
    """Test 2: Verify Firestore connectivity and operations"""
    print("\n" + "="*60)
    print("TEST 2: Firestore Connectivity")
    print("="*60)
    
    try:
        # Test chunk upsert
        print("\n[2.1] Testing chunk upsert...")
        test_chunk = {
            "chunk_id": "test_doc_chunk_0001",
            "content": "This is a test chunk for verification purposes. It contains sample agricultural guidance content.",
            "embedding": [0.1] * settings.embedding_dimension,  # Mock embedding
            "metadata": {
                "documentId": "test_document",
                "source": "Test Agricultural Guide",
                "pageNumber": 1,
                "chunkIndex": 0,
                "documentType": "manual",
                "crop": "tomato"
            }
        }
        
        await vector_store.upsert_chunk(
            chunk_id=test_chunk["chunk_id"],
            content=test_chunk["content"],
            embedding=test_chunk["embedding"],
            metadata=test_chunk["metadata"]
        )
        print(f"  ✓ Test chunk uploaded successfully")
        
        # Test chunk count
        print("\n[2.2] Testing chunk count...")
        count = await vector_store.count_chunks(document_id="test_document")
        print(f"  Chunks for 'test_document': {count}")
        print(f"  ✓ Chunk counting successful")
        
        # Test document listing
        print("\n[2.3] Testing document listing...")
        documents = await vector_store.list_documents()
        print(f"  Total documents in store: {len(documents)}")
        if documents:
            print(f"  Sample document: {documents[0]['documentId']}")
        print(f"  ✓ Document listing successful")
        
        # Clean up test data
        print("\n[2.4] Cleaning up test data...")
        deleted = await vector_store.delete_by_document_id("test_document")
        print(f"  Deleted {deleted} test chunks")
        print(f"  ✓ Cleanup successful")
        
        return True
        
    except Exception as e:
        print(f"  ✗ Firestore test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_retrieval():
    """Test 3: End-to-end retrieval pipeline"""
    print("\n" + "="*60)
    print("TEST 3: End-to-End Retrieval")
    print("="*60)
    
    try:
        # Check if there's any data in the vector store
        print("\n[3.1] Checking for existing data...")
        total_chunks = await vector_store.count_chunks()
        print(f"  Total chunks in vector store: {total_chunks}")
        
        if total_chunks == 0:
            print("  ⚠ Warning: No chunks in vector store. Retrieval test will be limited.")
            print("  → Ingest documents first using: python ingestion.py")
            return True  # Not a failure, just no data
        
        # Test retrieval
        print("\n[3.2] Testing retrieval...")
        query = "How to prevent crop diseases?"
        results = await retriever_service.retrieve(
            query=query,
            top_k=3
        )
        
        print(f"  Query: '{query}'")
        print(f"  Results retrieved: {len(results)}")
        
        if results:
            print(f"\n  Top result:")
            print(f"    Score: {results[0].get('score', 0):.4f}")
            print(f"    Source: {results[0].get('metadata', {}).get('source', 'Unknown')}")
            print(f"    Content preview: {results[0].get('content', '')[:100]}...")
        
        print(f"  ✓ Retrieval successful")
        
        # Test context building
        print("\n[3.3] Testing context building...")
        context = retriever_service.build_context(results, max_length=500)
        print(f"  Context length: {len(context)} characters")
        print(f"  Context preview:\n  {context[:200]}...")
        print(f"  ✓ Context building successful")
        
        return True
        
    except Exception as e:
        print(f"  ✗ Retrieval test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_filtered_retrieval():
    """Test 4: Retrieval with metadata filters"""
    print("\n" + "="*60)
    print("TEST 4: Filtered Retrieval")
    print("="*60)
    
    try:
        # Check for data with specific metadata
        print("\n[4.1] Testing filtered retrieval...")
        
        query = "cultivation best practices"
        
        # Test with crop filter (if available)
        results = await retriever_service.retrieve(
            query=query,
            top_k=3,
            filters={"crop": "tomato"}  # Example filter
        )
        
        print(f"  Query: '{query}'")
        print(f"  Filter: crop='tomato'")
        print(f"  Results retrieved: {len(results)}")
        
        if len(results) == 0:
            print("  ℹ No results for this filter (expected if no tomato docs ingested)")
        else:
            print(f"  ✓ Filtered retrieval successful")
            for i, result in enumerate(results, 1):
                metadata = result.get("metadata", {})
                print(f"    {i}. {metadata.get('source', 'Unknown')} (crop: {metadata.get('crop', 'N/A')})")
        
        return True
        
    except Exception as e:
        print(f"  ✗ Filtered retrieval test failed: {e}")
        return False


async def run_all_tests():
    """Run all tests"""
    print("\n" + "#"*60)
    print("# CropSense RAG Pipeline Test Suite")
    print("#"*60)
    print(f"\nProject: {settings.google_cloud_project}")
    print(f"Region: {settings.vertex_ai_location}")
    print(f"Embedding Model: {settings.embedding_model}")
    print(f"Vector Collection: {settings.vector_collection}")
    
    results = []
    
    # Run tests
    results.append(("Embedding Generation", await test_embeddings()))
    results.append(("Firestore Operations", await test_firestore()))
    results.append(("End-to-End Retrieval", await test_retrieval()))
    results.append(("Filtered Retrieval", await test_filtered_retrieval()))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"  {status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! RAG pipeline is ready.")
    else:
        print(f"\n⚠ {total - passed} test(s) failed. Check configuration and connectivity.")
    
    return passed == total


def main():
    """Main entry point"""
    try:
        success = asyncio.run(run_all_tests())
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nTests interrupted by user.")
        exit(130)
    except Exception as e:
        print(f"\n\n✗ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)


if __name__ == "__main__":
    main()

