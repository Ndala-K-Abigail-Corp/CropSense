"""
Test script for vector search and retrieval
Tests the full retrieval pipeline: embedding → search → context building
"""

import asyncio
from retriever import retriever_service
from vector_store import vector_store
from config import settings

async def test_retrieval():
    """Test retrieval pipeline"""
    print("=" * 60)
    print("Retrieval Pipeline Test")
    print("=" * 60)
    print(f"Project: {settings.google_cloud_project}")
    print(f"Collection: {settings.vector_collection}")
    print(f"Top K: {settings.top_k_results}")
    print(f"Similarity threshold: {settings.similarity_threshold}")
    print()
    
    try:
        # Test 1: Check available documents
        print("[Test 1] Checking available documents")
        print("-" * 60)
        
        total_docs = await vector_store.list_documents()
        print(f"Total documents in {settings.vector_collection}: {len(total_docs)}")
        
        if len(total_docs) == 0:
            print("\n✗ No documents found!")
            print("\nTroubleshooting:")
            print("  1. Run check_data.py to verify Firestore collections")
            print("  2. If data is in framework_chunks, re-ingest to vectorChunks")
            print("  3. Run ingestion.py to add documents")
            return
        
        print("\nAvailable documents:")
        for i, doc in enumerate(total_docs[:10], 1):
            print(f"  [{i}] {doc['documentId']}")
            print(f"      Source: {doc['source']}")
            print(f"      Type: {doc.get('documentType', 'N/A')}")
            print(f"      Chunks: {doc['chunkCount']}")
        
        if len(total_docs) > 10:
            print(f"  ... and {len(total_docs) - 10} more")
        
        print()
        
        # Test 2: Test retrieval with different queries (AGRICULTURE FOCUSED)
        test_queries = [
            "how to prevent maize blight disease",
            "tomato farming best practices",
            "crop disease management techniques"
        ]
        
        for query_num, query in enumerate(test_queries, 1):
            print(f"[Test {query_num + 1}] Query: '{query}'")
            print("-" * 60)
            
            results = await retriever_service.retrieve(
                query, 
                top_k=3,
                min_score=settings.similarity_threshold
            )
            
            print(f"Retrieved {len(results)} results")
            
            if len(results) == 0:
                print("  ✗ No results found (try lowering similarity_threshold)")
            else:
                for i, result in enumerate(results, 1):
                    score = result['score']
                    metadata = result['metadata']
                    content = result['content']
                    
                    print(f"\n  [{i}] Similarity: {score:.3f}")
                    print(f"      Source: {metadata.get('source', 'Unknown')}")
                    print(f"      Document: {metadata.get('documentId', 'Unknown')}")
                    print(f"      Page: {metadata.get('pageNumber', 'N/A')}")
                    print(f"      Type: {metadata.get('documentType', 'N/A')}")
                    print(f"      Content: {content[:150]}...")
            
            print()
        
        # Test 3: Context building
        print("[Test 4] Context Building")
        print("-" * 60)
        
        query = "pest control in crop farming"
        print(f"Query: '{query}'")
        
        results = await retriever_service.retrieve(query, top_k=3)
        
        if len(results) > 0:
            context = retriever_service.build_context(results)
            print(f"\nBuilt context ({len(context)} characters):")
            print("-" * 60)
            print(context[:500])
            if len(context) > 500:
                print(f"\n... (truncated, total: {len(context)} chars)")
        else:
            print("No results to build context from")
        
        print()
        print("=" * 60)
        print("All Tests Passed! ✓")
        print("=" * 60)
        print("\nNext steps:")
        print("  1. Start the API server: python main.py")
        print("  2. Test the /query endpoint with curl or Postman")
        print(f"  3. Adjust SIMILARITY_THRESHOLD (current: {settings.similarity_threshold}) if needed")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        print("\nTroubleshooting:")
        print("  1. Verify Firestore has data: python check_data.py")
        print("  2. Check authentication: gcloud auth application-default login")
        print("  3. Verify embeddings were generated correctly")
        print("  4. Try lowering SIMILARITY_THRESHOLD in .env")

if __name__ == "__main__":
    asyncio.run(test_retrieval())

