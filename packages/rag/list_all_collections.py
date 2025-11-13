"""
List all Firestore collections and count documents in each
"""

from google.cloud import firestore
from config import settings

def list_all_collections():
    """List all collections and their document counts"""
    db = firestore.Client(
        project=settings.google_cloud_project,
        database=settings.firestore_database
    )
    
    print("=" * 80)
    print("All Firestore Collections")
    print("=" * 80)
    
    collections = db.collections()
    
    for collection in collections:
        collection_name = collection.id
        
        # Count documents
        docs = list(collection.limit(1000).stream())
        count = len(docs)
        
        print(f"\n📁 {collection_name}")
        print(f"   Documents: {count:,}")
        
        # Show sample document structure
        if count > 0:
            sample = docs[0].to_dict()
            print(f"   Sample fields: {list(sample.keys())[:10]}")
            
            # Check if it's a chunk collection
            if 'embedding' in sample or 'content' in sample:
                print(f"   ✓ Contains chunks/embeddings")

if __name__ == "__main__":
    list_all_collections()


