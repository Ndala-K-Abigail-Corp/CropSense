"""Test retrieval with farming-specific queries"""

import asyncio
from retriever import retriever_service

async def main():
    print("=" * 60)
    print("Testing Farming Knowledge Retrieval")
    print("=" * 60)
    
    queries = [
        "How to prevent maize blight?",
        "Tomato farming best practices",
        "Crop rotation techniques",
        "Disease management in crops"
    ]
    
    for query in queries:
        print(f"\n🌱 Query: '{query}'")
        print("-" * 60)
        
        results = await retriever_service.retrieve(query, top_k=3, min_score=0.5)
        
        if results:
            print(f"✅ Found {len(results)} relevant chunks:\n")
            for i, result in enumerate(results, 1):
                print(f"[{i}] Score: {result['score']:.3f}")
                print(f"    Source: {result['metadata'].get('source')}")
                print(f"    Crop: {result['metadata'].get('crop', 'N/A')}")
                print(f"    Content: {result['content'][:120]}...\n")
        else:
            print("❌ No results found\n")
    
    print("=" * 60)
    print("Test Complete!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())

