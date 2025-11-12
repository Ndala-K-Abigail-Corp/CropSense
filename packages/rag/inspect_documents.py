"""
Inspect farming_knowledge documents to understand their structure
"""

from google.cloud import firestore, storage
from config import settings
import json

def inspect_farming_knowledge():
    """Inspect the structure of farming_knowledge documents"""
    db = firestore.Client(
        project=settings.google_cloud_project,
        database=settings.firestore_database
    )
    
    print("=" * 80)
    print("Inspecting farming_knowledge Collection")
    print("=" * 80)
    
    docs = list(db.collection('farming_knowledge').limit(5).stream())
    
    if not docs:
        print("No documents found in farming_knowledge collection")
        return
    
    print(f"\nFound {len(docs)} sample documents\n")
    
    for i, doc in enumerate(docs, 1):
        data = doc.to_dict()
        print(f"\n[{i}] Document ID: {doc.id}")
        print("-" * 80)
        print(f"Fields: {list(data.keys())}")
        print(f"\nFull data:")
        print(json.dumps(data, indent=2, default=str))
        print("-" * 80)

def list_storage_buckets():
    """List available storage buckets"""
    storage_client = storage.Client(project=settings.google_cloud_project)
    
    print("\n" + "=" * 80)
    print("Available Storage Buckets")
    print("=" * 80)
    
    try:
        buckets = list(storage_client.list_buckets())
        
        for bucket in buckets:
            print(f"\n  Bucket: {bucket.name}")
            
            # List first few files in bucket
            blobs = list(bucket.list_blobs(max_results=5))
            if blobs:
                print(f"  Sample files:")
                for blob in blobs:
                    print(f"    - {blob.name} ({blob.size:,} bytes)")
            else:
                print(f"  (empty)")
    
    except Exception as e:
        print(f"Error listing buckets: {e}")

if __name__ == "__main__":
    inspect_farming_knowledge()
    list_storage_buckets()

