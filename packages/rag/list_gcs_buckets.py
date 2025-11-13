"""List all GCS buckets and their contents"""

from google.cloud import storage
from config import settings

def list_buckets_and_contents():
    """List all GCS buckets and show sample contents"""
    storage_client = storage.Client(project=settings.google_cloud_project)
    
    print("=" * 80)
    print("GCS Buckets in Project:", settings.google_cloud_project)
    print("=" * 80)
    
    buckets = list(storage_client.list_buckets())
    
    if not buckets:
        print("⚠ No buckets found in this project")
        return
    
    for bucket in buckets:
        print(f"\n📦 Bucket: gs://{bucket.name}")
        print(f"   Location: {bucket.location}")
        print(f"   Storage class: {bucket.storage_class}")
        
        # List first 20 files
        blobs = list(storage_client.list_blobs(bucket.name, max_results=20))
        
        if not blobs:
            print("   (empty)")
        else:
            print(f"   Files ({len(blobs)} shown):")
            
            # Group by file type
            file_types = {}
            for blob in blobs:
                ext = blob.name.split('.')[-1].lower() if '.' in blob.name else 'no_ext'
                if ext not in file_types:
                    file_types[ext] = []
                file_types[ext].append(blob)
            
            for ext, files in file_types.items():
                print(f"\n   {ext.upper()} files ({len(files)}):")
                for blob in files[:10]:
                    size_mb = blob.size / (1024 * 1024)
                    print(f"      - {blob.name} ({size_mb:.2f} MB)")
                if len(files) > 10:
                    print(f"      ... and {len(files) - 10} more {ext} files")
    
    print("\n" + "=" * 80)
    print("Recommendations:")
    print("=" * 80)
    
    # Check for common document bucket names
    common_names = ['farming-knowledge', 'agricultural-docs', 'documents', 'farming_knowledge', 'cropsense-documents']
    found_buckets = [b.name for b in buckets]
    
    for name in common_names:
        matching = [b for b in found_buckets if name.lower() in b.lower()]
        if matching:
            print(f"\n✓ Found potential document bucket: gs://{matching[0]}")
            print(f"  → To process all PDFs: python batch_ingest.py --bucket {matching[0]}")
            break
    else:
        if buckets:
            print(f"\n💡 To process documents from a bucket, run:")
            print(f"   python batch_ingest.py --bucket {buckets[0].name} --prefix path/to/docs/")
    
    print("=" * 80)

if __name__ == "__main__":
    list_buckets_and_contents()

