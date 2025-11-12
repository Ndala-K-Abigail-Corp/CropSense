# CropSense RAG Setup & Verification Guide

This guide walks you through configuring and verifying the CropSense RAG (Retrieval-Augmented Generation) system for end-to-end retrieval functionality.

## 📋 Prerequisites

- Python 3.8+
- Google Cloud SDK installed and configured
- Active GCP project with Firestore and Vertex AI enabled
- Service account credentials with appropriate permissions

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd packages/rag
pip install -r requirements.txt
```

### 2. Configure Environment

Copy the environment template and fill in your values:

```bash
cp env.template .env
```

Edit `.env` with your actual configuration:

```bash
# Required: Update these values
GOOGLE_CLOUD_PROJECT=your-actual-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json

# Optional: Adjust these as needed
EMBEDDING_MODEL=text-embedding-005
EMBEDDING_DIMENSION=768
VECTOR_COLLECTION=vectorChunks
SIMILARITY_THRESHOLD=0.6
```

### 3. Authenticate with Google Cloud

```bash
# Option 1: Application default credentials (recommended for development)
gcloud auth application-default login

# Option 2: Service account key (for production)
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

### 4. Verify Configuration

Run the verification scripts in order:

#### Step A: Check Firestore Data

```bash
python check_data.py
```

**Expected output:**
- Shows which collections have data (vectorChunks vs framework_chunks)
- Displays sample documents with metadata
- Provides next steps based on findings

#### Step B: Test Embedding Generation

```bash
python test_embeddings.py
```

**Expected output:**
- ✓ Successfully generates 768-dimensional embeddings
- ✓ Tests both RETRIEVAL_DOCUMENT and QUESTION_ANSWERING task types
- ✓ Validates batch embedding generation

#### Step C: Test Vector Retrieval

```bash
python test_retrieval.py
```

**Expected output:**
- ✓ Lists available documents in vectorChunks
- ✓ Retrieves relevant chunks for test queries
- ✓ Displays similarity scores and context building

### 5. Start the API Server

```bash
python main.py
```

The server will start at `http://localhost:8000`

### 6. Test the Query Endpoint

Using curl:

```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "information security best practices",
    "top_k": 5,
    "min_score": 0.6
  }'
```

Using Python:

```python
import requests

response = requests.post(
    "http://localhost:8000/query",
    json={
        "query": "information security best practices",
        "top_k": 5,
        "min_score": 0.6
    }
)

print(response.json())
```

## 📊 System Architecture

### Components

1. **Embedding Service** (`embeddings.py`)
   - Uses Vertex AI `text-embedding-005` model
   - Generates 768-dimensional embeddings
   - Supports both document and query task types

2. **Vector Store** (`vector_store.py`)
   - Firestore-based storage for MVP
   - Cosine similarity search
   - Batch operations for efficiency

3. **Retriever Service** (`retriever.py`)
   - Orchestrates embedding generation and search
   - Builds formatted context with metadata
   - Applies similarity threshold filtering

4. **Ingestion Pipeline** (`ingestion.py`)
   - PDF text extraction
   - Intelligent chunking (512 chars, 50 overlap)
   - Batch embedding generation
   - Firestore storage

### Data Flow

```
Query → Embed (QUESTION_ANSWERING) → Vector Search → Filter by Score → Build Context → Return Results
```

### Firestore Schema

**Collection: `vectorChunks`**

```javascript
{
  id: "doc-id_chunk_0001",
  content: "Chunk text content...",
  embedding: [0.123, -0.456, ...], // 768-dimensional vector
  embeddingDim: 768,
  metadata: {
    documentId: "doc-id",
    source: "Document Name",
    pageNumber: 1,
    chunkIndex: 0,
    documentType: "manual",
    crop: "tomato", // optional
    region: "zambia" // optional
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 🔧 Configuration Reference

### Core Settings (config.py)

| Variable | Default | Description |
|----------|---------|-------------|
| `EMBEDDING_MODEL` | text-embedding-005 | Vertex AI embedding model |
| `EMBEDDING_DIMENSION` | 768 | Output dimension (cost-optimized) |
| `VECTOR_COLLECTION` | vectorChunks | Firestore collection name |
| `CHUNK_SIZE` | 512 | Maximum characters per chunk |
| `CHUNK_OVERLAP` | 50 | Character overlap between chunks |
| `TOP_K_RESULTS` | 5 | Number of results to retrieve |
| `SIMILARITY_THRESHOLD` | 0.6 | Minimum cosine similarity score |
| `FIRESTORE_BATCH_SIZE` | 500 | Documents per Firestore batch |
| `EMBEDDING_BATCH_SIZE` | 20 | Texts per embedding API call |

### Adjusting Performance

**More Results:**
```bash
TOP_K_RESULTS=10  # Retrieve more chunks
```

**Lower Threshold (more permissive):**
```bash
SIMILARITY_THRESHOLD=0.5  # Accept lower similarity scores
```

**Larger Chunks (more context per chunk):**
```bash
CHUNK_SIZE=1024
CHUNK_OVERLAP=100
```

## 📝 Document Ingestion

### Ingest a Single Document

```bash
python ingestion.py \
  --pdf /path/to/document.pdf \
  --id unique-doc-id \
  --name "Document Name" \
  --type manual \
  --crop tomato \
  --region zambia
```

### Ingest from Google Cloud Storage

```bash
python ingestion.py \
  --pdf gs://your-bucket/path/to/document.pdf \
  --id doc-id \
  --name "Document Name" \
  --type guide
```

### Batch Ingestion Script

Create `batch_ingest.py`:

```python
import asyncio
from ingestion import ingest_document

async def main():
    documents = [
        {
            "pdf_path": "gs://bucket/doc1.pdf",
            "document_id": "doc1",
            "document_name": "Document 1",
            "document_type": "manual",
            "metadata": {"crop": "tomato"}
        },
        # Add more documents...
    ]
    
    for doc in documents:
        try:
            await ingest_document(**doc)
        except Exception as e:
            print(f"Failed to ingest {doc['document_id']}: {e}")

asyncio.run(main())
```

## 🧪 Testing & Validation

### Health Check

```bash
curl http://localhost:8000/health
```

### List Available Documents

```bash
curl http://localhost:8000/documents
```

### Get Document Statistics

```bash
curl http://localhost:8000/documents/doc-id/stats
```

### Generate Embedding

```bash
curl -X POST http://localhost:8000/embed \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Test text",
    "task_type": "RETRIEVAL_DOCUMENT"
  }'
```

## 🐛 Troubleshooting

### Issue: "DefaultCredentialsError"

**Problem:** Google Cloud authentication not configured

**Solutions:**
```bash
# Option 1: Application default credentials
gcloud auth application-default login

# Option 2: Service account
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"

# Option 3: Add to .env file
echo 'GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json' >> .env
```

### Issue: No Results from Vector Search

**Problem:** Empty results or low similarity scores

**Solutions:**
1. Check if data exists:
   ```bash
   python check_data.py
   ```

2. Lower similarity threshold in `.env`:
   ```bash
   SIMILARITY_THRESHOLD=0.5  # or lower
   ```

3. Verify embeddings are generated correctly:
   ```bash
   python test_embeddings.py
   ```

### Issue: "Collection not found" or Empty vectorChunks

**Problem:** Data is in wrong collection or not ingested

**Solutions:**
1. Check existing data:
   ```bash
   python check_data.py
   ```

2. If data is in `framework_chunks`:
   - Option A: Temporarily use that collection:
     ```bash
     VECTOR_COLLECTION=framework_chunks
     ```
   - Option B: Re-ingest data to `vectorChunks` (recommended)

3. Ingest documents if none exist:
   ```bash
   python ingestion.py --pdf path/to/doc.pdf --id doc-id --name "Doc Name"
   ```

### Issue: Embedding Model Not Found

**Problem:** `text-embedding-005` not available in your region

**Solutions:**
1. Check available models in your region
2. Use `text-embedding-004` instead:
   ```bash
   EMBEDDING_MODEL=text-embedding-004
   ```
3. Verify Vertex AI API is enabled:
   ```bash
   gcloud services enable aiplatform.googleapis.com
   ```

### Issue: Rate Limiting or Quota Exceeded

**Problem:** Too many API requests

**Solutions:**
1. Reduce batch size in `.env`:
   ```bash
   EMBEDDING_BATCH_SIZE=10  # Lower from 20
   ```

2. Add delays between batches (modify `ingestion.py`)

3. Request quota increase in GCP Console

### Issue: Permission Denied on Firestore

**Problem:** Service account lacks permissions

**Solutions:**
```bash
# Grant datastore.user role
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/datastore.user"

# Grant aiplatform.user role
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/aiplatform.user"
```

## ✅ Validation Checklist

After setup, verify:

- [ ] `config.py` has all required settings (no AttributeErrors)
- [ ] `.env` file exists with correct project ID
- [ ] Authentication works (gcloud auth or service account)
- [ ] `check_data.py` shows data in vectorChunks
- [ ] `test_embeddings.py` generates 768-dim embeddings
- [ ] `test_retrieval.py` returns results with scores > 0.6
- [ ] API server starts without errors
- [ ] `/health` endpoint returns healthy status
- [ ] `/query` endpoint returns formatted context
- [ ] No errors in console logs

## 🎯 Success Criteria

The system is properly configured when:

1. ✅ Configuration has no missing variables
2. ✅ Embeddings generate successfully with text-embedding-005
3. ✅ Vector search returns relevant chunks with similarity scores
4. ✅ API `/query` endpoint returns formatted context with citations
5. ✅ All test scripts pass without errors

## 📚 Next Steps

Once setup is complete:

1. **Integrate with Frontend:** Connect the `/query` endpoint to your React app
2. **Add More Documents:** Use `ingestion.py` to add agricultural documents
3. **Optimize Performance:** Adjust chunk sizes and similarity thresholds
4. **Monitor Costs:** Track Vertex AI API usage in GCP Console
5. **Deploy:** Move to production with Cloud Run or Cloud Functions

## 🔗 Related Documentation

- [Main RAG Documentation](../../docs/rag.md)
- [Technical Design Document](../../docs/Technical%20Design%20Doc.md)
- [Vertex AI Embeddings API](https://cloud.google.com/vertex-ai/docs/generative-ai/embeddings/get-text-embeddings)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)

---

**Last Updated:** 2025-11-12  
**Status:** ✅ Production Ready

