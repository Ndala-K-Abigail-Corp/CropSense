"""Test ingestion with ONE document from farming_knowledge"""

import asyncio
from google.cloud import firestore
from config import settings
from ingest_from_firestore import ingest_firestore_document

async def main():
    print("=" * 60)
    print("Testing with ONE document from farming_knowledge")
    print("=" * 60)
    
    db = firestore.Client(
        project=settings.google_cloud_project,
        database=settings.firestore_database
    )
    
    # Get FIRST document only
    print("\nFetching first document...")
    docs = list(db.collection('farming_knowledge').limit(1).stream())
    
    if not docs:
        print("⚠ No documents found in farming_knowledge collection")
        return
    
    doc = docs[0]
    doc_data = doc.to_dict()
    
    print(f"\nDocument ID: {doc.id}")
    print(f"Title: {doc_data.get('title', 'N/A')}")
    
    # Check for content in various field names
    content = doc_data.get('content') or doc_data.get('text') or doc_data.get('body') or ""
    print(f"Has content: {'✓' if content else '✗'}")
    
    if content:
        print(f"Content preview: {content[:100]}...")
    else:
        print("\n⚠ Available fields in document:")
        for key in doc_data.keys():
            print(f"  - {key}: {type(doc_data[key]).__name__}")
    
    response = input("\nProceed with ingestion? (y/n): ").lower()
    if response != 'y':
        print("Test cancelled")
        return
    
    # Ingest
    result = await ingest_firestore_document(doc.id, doc_data)
    
    if result:
        print("\n" + "=" * 60)
        print("✅ TEST SUCCESSFUL")
        print("=" * 60)
        print(f"Document: {result['doc_id']}")
        print(f"Chunks created: {result['chunks']}")
        print(f"Successfully stored: {result['successful']}")
        print(f"Failed: {result['failed']}")
        print("\nNext steps:")
        print("  1. Run: python check_data.py")
        print("  2. Run: python test_retrieval.py")
        print("  3. If working, run: python ingest_from_firestore.py")
    else:
        print("\n⚠ No content found in document")
        print("Check the 'Available fields' above and update ingest_from_firestore.py")
        print("to use the correct field name for your content.")

if __name__ == "__main__":
    asyncio.run(main())

