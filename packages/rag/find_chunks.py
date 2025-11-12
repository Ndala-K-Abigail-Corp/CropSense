"""Find where chunks are actually stored"""

from google.cloud import firestore
from config import settings

def find_chunks():
    db = firestore.Client(
        project=settings.google_cloud_project,
        database=settings.firestore_database
    )
    
    print("=" * 60)
    print("Searching for Chunk Collections")
    print("=" * 60)
    
    # Common collection names to check
    potential_collections = [
        'vectorChunks',
        'framework_chunks',
        'farming_chunks',
        'knowledge_chunks',
        'chunks',
        'documents',
        'document_chunks'
    ]
    
    print("\nChecking potential chunk collections...")
    found_collections = []
    
    for coll_name in potential_collections:
        try:
            sample_docs = list(db.collection(coll_name).limit(1).stream())
            if sample_docs:
                count_sample = list(db.collection(coll_name).limit(10).stream())
                found_collections.append((coll_name, len(count_sample)))
                print(f"  ✓ {coll_name}: Found {len(count_sample)}+ documents")
                
                # Show sample structure
                sample_data = sample_docs[0].to_dict()
                print(f"    Sample fields: {', '.join(list(sample_data.keys())[:6])}")
        except Exception as e:
            pass
    
    if not found_collections:
        print("\n  ✗ No chunk collections found with standard names")
        print("\n  Checking all root-level collections...")
        
        # List all collections
        try:
            all_collections = list(db.collections())
            print(f"\n  Found {len(all_collections)} root-level collections:")
            for coll in all_collections:
                sample = list(coll.limit(1).stream())
                count = "0" if not sample else "1+"
                print(f"    - {coll.id} ({count} docs)")
                
                if sample:
                    sample_data = sample[0].to_dict()
                    # Check if it looks like a chunk (has embedding or content)
                    if 'embedding' in sample_data or 'text' in sample_data or 'content' in sample_data:
                        print(f"      ⚠ This looks like it might contain chunks!")
                        print(f"      Fields: {', '.join(list(sample_data.keys())[:8])}")
        except Exception as e:
            print(f"  Error listing collections: {e}")
    
    print("\n" + "=" * 60)
    
    if found_collections:
        print(f"Found {len(found_collections)} collection(s) with data:")
        for coll_name, count in found_collections:
            print(f"  → {coll_name}: {count}+ documents")
    else:
        print("No existing chunk data found")
        print("\n💡 Recommendation:")
        print("  Your farming_knowledge metadata exists but chunks are missing.")
        print("  You likely need to re-process the PDFs to create chunks.")

if __name__ == "__main__":
    find_chunks()

