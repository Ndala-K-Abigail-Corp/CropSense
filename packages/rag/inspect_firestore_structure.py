"""Inspect the structure of farming_knowledge collection"""

from google.cloud import firestore
from config import settings

def inspect_collection():
    db = firestore.Client(
        project=settings.google_cloud_project,
        database=settings.firestore_database
    )
    
    print("=" * 60)
    print("Inspecting farming_knowledge Collection Structure")
    print("=" * 60)
    
    # Get first few documents
    docs = list(db.collection('farming_knowledge').limit(3).stream())
    
    if not docs:
        print("⚠ No documents found in farming_knowledge")
        return
    
    for i, doc in enumerate(docs, 1):
        doc_data = doc.to_dict()
        print(f"\n[Document {i}] ID: {doc.id}")
        print(f"Fields:")
        for key, value in doc_data.items():
            value_preview = str(value)[:80] if len(str(value)) > 80 else str(value)
            print(f"  - {key}: {type(value).__name__} = {value_preview}")
        
        # Check for subcollections
        print(f"\nChecking for subcollections...")
        collections = doc.reference.collections()
        subcollections = [coll.id for coll in collections]
        
        if subcollections:
            print(f"  Found subcollections: {subcollections}")
            
            # Inspect first subcollection
            for subcoll_name in subcollections:
                subcoll_docs = list(doc.reference.collection(subcoll_name).limit(2).stream())
                print(f"\n  Subcollection '{subcoll_name}' ({len(subcoll_docs)} sample docs):")
                
                for subdoc in subcoll_docs:
                    subdoc_data = subdoc.to_dict()
                    print(f"    - {subdoc.id}:")
                    for key, value in list(subdoc_data.items())[:5]:  # Show first 5 fields
                        if key == 'embedding':
                            print(f"        {key}: [array with {len(value)} dimensions]")
                        else:
                            value_preview = str(value)[:60]
                            print(f"        {key}: {value_preview}")
        else:
            print("  No subcollections found")
    
    print("\n" + "=" * 60)
    print("Analysis Complete")
    print("=" * 60)

if __name__ == "__main__":
    inspect_collection()

