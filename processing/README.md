# Framework Processing Pipeline

This folder contains the Python scripts for processing governance framework PDFs and generating embeddings for the RAG system.

## Overview

The processing pipeline:
1. Downloads PDFs from Google Cloud Storage
2. Extracts text using pdfplumber
3. Chunks text intelligently (500 tokens, 50 token overlap)
4. Generates embeddings using Vertex AI (text-embedding-004)
5. Stores in Firestore (frameworks and framework_chunks collections)

## Files

| File | Purpose |
|------|---------|
| `process_frameworks.py` | Main ingestion script |
| `embeddings.py` | Vertex AI embedding utilities |
| `chunking.py` | Intelligent text chunking |
| `requirements.txt` | Python dependencies |
| `run_ingestion.sh` | Bash runner script |
| `run_ingestion.ps1` | PowerShell runner script |

## Quick Start

### Prerequisites
- Python 3.8+
- Google Cloud SDK installed and configured
- Service account with appropriate permissions
- PDFs uploaded to GCS bucket

### Setup

1. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # Mac/Linux
# or
venv\Scripts\activate  # Windows
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Configure authentication:**
```bash
# Option 1: Use application default credentials
gcloud auth application-default login

# Option 2: Use service account key
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"
```

4. **Set project ID:**
```bash
export PROJECT_ID="governnce-gap-analyzer"
```

### Run Ingestion

**Manual run:**
```bash
python process_frameworks.py
```

**Using helper scripts:**
```bash
# Mac/Linux
chmod +x run_ingestion.sh
./run_ingestion.sh

# Windows PowerShell
.\run_ingestion.ps1
```

## Configuration

### Project Settings
**File:** `process_frameworks.py` (lines 18-23)

```python
PROJECT_ID = "governnce-gap-analyzer"
GCS_BUCKET_NAME = f"{PROJECT_ID}.firebasestorage.app"
REGION = "us-central1"
LOCATION = "us-central1"
```

### Frameworks to Process
**File:** `process_frameworks.py` (lines 185-210)

```python
frameworks = [
    {
        "name": "COBIT-2019",
        "gcs_path": "frameworks/COBIT-2019-Framework-Introduction-and-Methodology_res_eng_1118.pdf"
    },
    {
        "name": "ISO27001",
        "gcs_path": "frameworks/ISO27001_ExOv.pdf"
    },
    # ... more frameworks
]
```

Add or modify frameworks in this list.

### Chunking Parameters
**File:** `process_frameworks.py` (line 151)

```python
chunks = chunk_text_intelligent(
    text_items, 
    max_tokens=500,      # Maximum tokens per chunk
    overlap_tokens=50    # Overlap between chunks
)
```

### Embedding Settings
**File:** `embeddings.py` (lines 15-20)

```python
def generate_text_embeddings(
    texts: List[str],
    task_type: str = "RETRIEVAL_DOCUMENT",
    model_name: str = "text-embedding-004",
    output_dimensionality: int = 768  # Cost-optimized
)
```

## Output

### Firestore Collections

**frameworks/**
```javascript
{
  id: "iso27001",
  name: "ISO27001",
  version: "1.0",
  uploadDate: Timestamp,
  totalChunks: 150
}
```

**framework_chunks/**
```javascript
{
  framework: "iso27001",
  text: "Information security management...",
  embedding: [0.123, -0.456, ...], // 768-dimensional vector
  page: 1,
  section: "Introduction",
  chunkIndex: 0,
  tokens: 487,
  createdAt: Timestamp
}
```

## Processing Details

### Text Extraction
- Uses `pdfplumber` for high-quality text extraction
- Preserves page numbers and structure
- Handles multi-page documents

### Intelligent Chunking
- **Paragraph-based**: Splits on double newlines
- **Overlap**: 50 tokens overlap between chunks for context
- **Header preservation**: Detects and preserves section headers
- **Token estimation**: ~4 characters per token

### Embedding Generation
- **Model**: `text-embedding-004` (Google's latest)
- **Dimensions**: 768 (optimal cost/performance)
- **Task Type**: `RETRIEVAL_DOCUMENT` for storage
- **Batch Size**: 20 chunks per request (respects API limits)

### Storage Strategy
- **Batch writes**: 500 documents per Firestore batch
- **Flat collection**: `framework_chunks` (not subcollection) for better querying
- **Metadata included**: page numbers, tokens, timestamps

## Monitoring & Logs

The script outputs detailed logs:

```
Processing ISO27001 from frameworks/ISO27001_ExOv.pdf...
Downloading PDF from GCS...
Extracting text from PDF...
Chunking text...
Created 150 chunks
Generating embeddings...
Processing batch 1/8 (20 chunks)...
Processing batch 2/8 (20 chunks)...
...
Storing embeddings in Firestore...
  Committed batch of 500 chunks...
  Committed final batch of 150 chunks...
SUCCESS: Successfully processed ISO27001
```

## Troubleshooting

### Error: "ModuleNotFoundError: No module named 'google.cloud'"
**Solution:**
```bash
pip install -r requirements.txt
```

### Error: "google.auth.exceptions.DefaultCredentialsError"
**Solution:**
```bash
gcloud auth application-default login
# or
export GOOGLE_APPLICATION_CREDENTIALS="path/to/key.json"
```

### Error: "Bucket not found"
**Solution:**
- Verify bucket exists: `gsutil ls gs://governnce-gap-analyzer.firebasestorage.app`
- Check project ID in `process_frameworks.py`
- Ensure you have storage.admin permissions

### Error: "Permission denied" on Firestore
**Solution:**
- Verify service account has `datastore.user` role
- Check Firestore is enabled in GCP console

### Warning: "Error generating embeddings: quota exceeded"
**Solution:**
- Wait and retry (quota resets)
- Request quota increase in GCP console
- Reduce batch size in `process_frameworks.py`

## Cost Estimation

### Embedding Generation
- **Model**: text-embedding-004
- **Cost**: $0.00025 per 1K tokens
- **Example**: 100K tokens = $0.025

### Firestore Storage
- **Documents**: $0.18 per 100K reads
- **Storage**: $0.18 per GB/month
- **Example**: 1000 chunks = ~$0.01/month

### Cloud Storage
- **Storage**: $0.020 per GB/month
- **Download**: $0.12 per GB

**Total for 6 frameworks (~1MB PDFs):** ~$0.50 one-time + $0.05/month

## Performance

- **Processing speed**: ~50 pages/minute
- **Embedding generation**: ~20 chunks/second
- **Firestore writes**: 500 documents/batch

**Estimated time for 6 frameworks:**
- Small PDFs (20-50 pages): ~5-10 minutes
- Large PDFs (100+ pages): ~20-30 minutes

## Advanced Usage

### Process Single Framework
```python
# Modify process_frameworks.py main()
if __name__ == "__main__":
    process_framework_pdf(
        "frameworks/ISO27001_ExOv.pdf",
        "ISO27001"
    )
```

### Custom Chunking Strategy
```python
# In process_frameworks.py
from chunking import chunk_text_simple

# Use simple sentence-based chunking
chunks = chunk_text_simple(
    full_text,
    max_tokens=300,
    overlap_tokens=25
)
```

### Test Without Firestore
```python
# Comment out Firestore storage in process_frameworks.py
# store_embeddings_in_firestore(...)

# Just print results
print(f"Generated {len(chunks)} chunks")
print(f"Sample: {chunks[0]['text'][:200]}")
```

## Next Steps

After processing frameworks:
1. Verify data in Firestore console
2. Check chunk count matches expected
3. Test retrieval in Firebase Functions
4. Run sample analysis to verify embeddings work

## Support

- Main documentation: `../docs/rag.md`
- Implementation guide: `../docs/RAG_IMPLEMENTATION_SUMMARY.md`
- Quick start: `../docs/RAG_QUICK_START.md`

---

**Last Updated:** November 7, 2025  
**Status:** Production Ready ✅


