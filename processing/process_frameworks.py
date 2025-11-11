"""
Framework PDF Processing Script
Processes governance framework PDFs and generates embeddings for RAG system.
"""

import os
import sys
from typing import List, Dict, Any
from google.cloud import storage
from google.cloud import firestore
from google.cloud import aiplatform
from datetime import datetime

# Import utilities
from embeddings import initialize_vertex_ai, generate_text_embeddings
from chunking import chunk_text_intelligent

# Configuration
PROJECT_ID = "governnce-gap-analyzer"
# Use Firebase Storage bucket (firebasestorage.app)
GCS_BUCKET_NAME = f"{PROJECT_ID}.firebasestorage.app"
REGION = "us-central1"
LOCATION = "us-central1"

# Initialize clients
storage_client = storage.Client(project=PROJECT_ID)
firestore_client = firestore.Client(project=PROJECT_ID)
initialize_vertex_ai(PROJECT_ID, LOCATION)


def download_pdf_from_gcs(bucket_name: str, blob_name: str) -> bytes:
    """Download PDF from GCS bucket."""
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(blob_name)
    return blob.download_as_bytes()


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract text from PDF using pdfplumber."""
    import io
    pdf_file = io.BytesIO(pdf_bytes)
    
    text_content = []
    with pdfplumber.open(pdf_file) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            text = page.extract_text()
            if text:
                text_content.append({
                    "page": page_num,
                    "text": text
                })
    
    return text_content


def extract_text_from_pdf(pdf_bytes: bytes) -> List[Dict[str, Any]]:
    """Extract text from PDF using pdfplumber."""
    import io
    import pdfplumber
    
    pdf_file = io.BytesIO(pdf_bytes)
    text_content = []
    
    with pdfplumber.open(pdf_file) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            text = page.extract_text()
            if text:
                text_content.append({
                    "page": page_num,
                    "text": text
                })
    
    return text_content


def store_embeddings_in_firestore(
    framework_id: str,
    document_name: str,
    chunks: List[Dict[str, Any]],
    embeddings: List[List[float]]
) -> None:
    """Store chunks and embeddings in Firestore."""
    
    # Store framework metadata
    framework_ref = firestore_client.collection("frameworks").document(framework_id)
    framework_ref.set({
        "id": framework_id,
        "name": document_name,
        "version": "1.0",
        "uploadDate": datetime.now(),
        "totalChunks": len(chunks)
    }, merge=True)
    
    # Store chunks in framework_chunks collection (not subcollection)
    chunks_collection = firestore_client.collection("framework_chunks")
    
    batch = firestore_client.batch()
    batch_size = 500  # Firestore batch limit
    
    for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        chunk_doc = chunks_collection.document()
        page_num = chunk.get("page", 1) if isinstance(chunk.get("page"), int) else (chunk.get("pages", [1])[0] if chunk.get("pages") else 1)
        
        batch.set(chunk_doc, {
            "framework": framework_id,
            "text": chunk["text"],
            "embedding": embedding,
            "page": page_num,
            "section": chunk.get("section", ""),
            "chunkIndex": idx,
            "tokens": chunk.get("tokens", 0),
            "createdAt": datetime.now()
        })
        
        # Commit batch every 500 documents (Firestore limit)
        if (idx + 1) % batch_size == 0:
            batch.commit()
            batch = firestore_client.batch()
            print(f"  Committed batch of {idx + 1} chunks...")
    
    # Commit remaining documents
    if len(chunks) % batch_size != 0:
        batch.commit()
        print(f"  Committed final batch of {len(chunks) % batch_size} chunks...")


def process_framework_pdf(gcs_path: str, framework_name: str) -> None:
    """Main processing function for a framework PDF."""
    
    print(f"Processing {framework_name} from {gcs_path}...")
    
    # Extract bucket and blob name from GCS path
    if gcs_path.startswith("gs://"):
        path_parts = gcs_path.replace("gs://", "").split("/", 1)
        bucket_name = path_parts[0]
        blob_name = path_parts[1]
    else:
        bucket_name = GCS_BUCKET_NAME
        blob_name = gcs_path
    
    # Download PDF
    print("Downloading PDF from GCS...")
    pdf_bytes = download_pdf_from_gcs(bucket_name, blob_name)
    
    # Extract text
    print("Extracting text from PDF...")
    text_items = extract_text_from_pdf(pdf_bytes)
    
    # Chunk text intelligently
    print("Chunking text...")
    chunks = chunk_text_intelligent(text_items, max_tokens=500, overlap_tokens=50)
    print(f"Created {len(chunks)} chunks")
    
    # Generate embeddings in batches
    # Note: text-embedding-004 has a 20000 token limit per request
    # Using smaller batch size to avoid token limit (chunks are ~500 tokens each)
    print("Generating embeddings...")
    batch_size = 20  # Reduced to avoid token limit (20 * 500 = ~10000 tokens, well under 20000)
    all_embeddings = []
    
    for i in range(0, len(chunks), batch_size):
        batch_chunks = chunks[i:i + batch_size]
        batch_texts = [chunk["text"] for chunk in batch_chunks]
        
        print(f"Processing batch {i // batch_size + 1}/{(len(chunks) + batch_size - 1) // batch_size} ({len(batch_texts)} chunks)...")
        batch_embeddings = generate_text_embeddings(
            batch_texts,
            task_type="RETRIEVAL_DOCUMENT",
            output_dimensionality=768
        )
        all_embeddings.extend(batch_embeddings)
    
    # Store in Firestore
    print("Storing embeddings in Firestore...")
    framework_id = framework_name.lower().replace(" ", "-").replace("_", "-")
    store_embeddings_in_firestore(framework_id, framework_name, chunks, all_embeddings)
    
    print(f"SUCCESS: Successfully processed {framework_name}")


def main():
    """Main entry point."""
    
    # Framework PDFs to process
    frameworks = [
        {
            "name": "COBIT-2019",
            "gcs_path": "frameworks/COBIT-2019-Framework-Introduction-and-Methodology_res_eng_1118.pdf"
        },
        {
            "name": "ISO27001",
            "gcs_path": "frameworks/ISO27001_ExOv.pdf"
        },
        {
            "name": "ISO42001",
            "gcs_path": "frameworks/ISO-IEC-42001-2023.pdf"
        },
        {
            "name": "NIST",
            "gcs_path": "frameworks/NIST.CSWP.29.pdf"
        },
        {
            "name": "Zambia Cyber Security Act",
            "gcs_path": "frameworks/Zambia cyber security cyber crimes Act.pdf"
        },
        {
            "name": "Zambia Data Protection Act",
            "gcs_path": "frameworks/Zambian Data Protection Act 2021_0.pdf"
        },
    ]
    
    for framework in frameworks:
        try:
            process_framework_pdf(framework["gcs_path"], framework["name"])
        except Exception as e:
            print(f"ERROR: Error processing {framework['name']}: {e}")
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    main()

