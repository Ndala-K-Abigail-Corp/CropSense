"""
Verification script to check Firestore data status
Checks both vectorChunks and framework_chunks collections
"""

from google.cloud import firestore
from config import settings

def main():
    """Check which collections have data"""
    print("=" * 60)
    print("Firestore Data Verification")
    print("=" * 60)
    print(f"Project: {settings.google_cloud_project}")
    print(f"Database: {settings.firestore_database}")
    print()
    
    try:
        db = firestore.Client(
            project=settings.google_cloud_project, 
            database=settings.firestore_database
        )
        
        # Check vectorChunks collection
        print("Checking 'vectorChunks' collection...")
        vector_docs = list(db.collection('vectorChunks').limit(10).stream())
        vector_count = len(vector_docs)
        print(f"  Found {vector_count} documents (showing first 10)")
        
        if vector_count > 0:
            print("\n  Sample documents:")
            for i, doc in enumerate(vector_docs[:3], 1):
                data = doc.to_dict()
                metadata = data.get('metadata', {})
                print(f"    [{i}] ID: {doc.id}")
                print(f"        Document: {metadata.get('documentId', 'N/A')}")
                print(f"        Source: {metadata.get('source', 'N/A')}")
                print(f"        Embedding dim: {data.get('embeddingDim', 0)}")
                print(f"        Content preview: {data.get('content', '')[:80]}...")
        
        print()
        
        # Check framework_chunks collection
        print("Checking 'framework_chunks' collection...")
        framework_docs = list(db.collection('framework_chunks').limit(10).stream())
        framework_count = len(framework_docs)
        print(f"  Found {framework_count} documents (showing first 10)")
        
        if framework_count > 0:
            print("\n  Sample documents:")
            for i, doc in enumerate(framework_docs[:3], 1):
                data = doc.to_dict()
                print(f"    [{i}] ID: {doc.id}")
                print(f"        Framework: {data.get('framework', 'N/A')}")
                print(f"        Page: {data.get('page', 'N/A')}")
                print(f"        Embedding dim: {len(data.get('embedding', []))}")
                print(f"        Text preview: {data.get('text', '')[:80]}...")
        
        print()
        print("=" * 60)
        print("Summary:")
        print("=" * 60)
        
        if vector_count > 0:
            print(f"✓ vectorChunks has data ({vector_count}+ docs)")
            print("  → Ready for CropSense RAG queries!")
        else:
            print("✗ vectorChunks is empty")
            
        if framework_count > 0:
            print(f"✓ framework_chunks has data ({framework_count}+ docs)")
            if vector_count == 0:
                print("  → Consider re-ingesting to vectorChunks for CropSense")
        else:
            print("✗ framework_chunks is empty")
        
        if vector_count == 0 and framework_count == 0:
            print("\n⚠ No data found in either collection!")
            print("  → Run ingestion script to populate data")
        
        print("=" * 60)
        
    except Exception as e:
        print(f"✗ Error: {e}")
        print("\nTroubleshooting:")
        print("  1. Check GOOGLE_CLOUD_PROJECT in .env file")
        print("  2. Verify authentication: gcloud auth application-default login")
        print("  3. Ensure Firestore is enabled in your GCP project")

if __name__ == "__main__":
    main()

