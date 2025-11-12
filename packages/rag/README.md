# CropSense RAG Backend

Retrieval-only RAG backend for CropSense agricultural guidance platform using Vertex AI embeddings and Firestore.

> **📖 NEW:** See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for comprehensive setup and validation instructions.

## Overview

This package provides a complete RAG pipeline for processing agricultural documents and retrieving relevant context for user queries. It uses:

- **Vertex AI text-embedding-005**: Latest Google embedding model (768 dimensions)
- **Firestore**: Vector storage with cosine similarity search  
- **FastAPI**: REST API for query and document management

**Note**: This is a retrieval-only implementation. Generation/synthesis is handled separately or left to the frontend.

## Features

- ✅ **Document Ingestion**: PDF processing, intelligent chunking, batch embedding generation
- ✅ **Vector Storage**: Firestore-based storage with metadata filtering
- ✅ **Semantic Retrieval**: Cosine similarity search with configurable thresholds
- ✅ **Metadata Filtering**: Filter by crop type, region, document type, etc.
- ✅ **FastAPI REST API**: Query, embedding, and document management endpoints
- ✅ **CLI Tools**: Command-line document ingestion

## Quick Start

> **📖 For detailed setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)**

### 1. Prerequisites

- Python 3.8+
- Google Cloud Project with:
  - Vertex AI API enabled
  - Firestore database created
  - Service account with appropriate permissions

### 2. Installation

```bash
cd packages/rag
pip install -r requirements.txt
```

### 3. Configuration

```bash
# Copy environment template
cp env.template .env

# Edit .env with your project settings
# Required: GOOGLE_CLOUD_PROJECT, GOOGLE_APPLICATION_CREDENTIALS
```

### 4. Authenticate

```bash
# Option 1: Application default credentials (recommended)
gcloud auth application-default login

# Option 2: Service account key
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

### 5. Verify Setup

Run the automated validation:

```bash
python validate_setup.py
```

Or run individual test scripts:

```bash
python check_data.py          # Check Firestore data
python test_embeddings.py     # Test embedding generation
python test_retrieval.py      # Test retrieval pipeline
```

## Usage

### Document Ingestion

Ingest agricultural documents using the CLI:

```bash
# Ingest from local PDF
python ingestion.py \
  --pdf /path/to/tomato-guide.pdf \
  --id tomato-growing-guide-2024 \
  --name "Tomato Growing Guide 2024" \
  --type manual \
  --crop tomato \
  --region "East Africa"

# Ingest from Google Cloud Storage
python ingestion.py \
  --pdf gs://my-bucket/corn-manual.pdf \
  --id corn-cultivation-manual \
  --name "Corn Cultivation Manual" \
  --type manual \
  --crop corn
```

### Run the API Server

Start the FastAPI server:

```bash
# Development mode (with auto-reload)
python main.py

# Or using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

Interactive docs: `http://localhost:8000/docs`

## API Endpoints

### 1. Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "cropsense-rag",
  "version": "1.0.0"
}
```

### 2. Query (Retrieval)

```http
POST /query
Content-Type: application/json
```

**Request:**
```json
{
  "query": "How to prevent tomato blight in humid climates?",
  "top_k": 5,
  "filters": {
    "crop": "tomato",
    "documentType": "manual"
  },
  "min_score": 0.6
}
```

**Response:**
```json
{
  "query": "How to prevent tomato blight in humid climates?",
  "chunks": [
    {
      "chunkId": "tomato-guide_chunk_0042",
      "content": "To prevent blight in humid conditions...",
      "score": 0.87,
      "metadata": {
        "documentId": "tomato-guide-2024",
        "source": "Tomato Growing Guide 2024",
        "pageNumber": 12,
        "crop": "tomato",
        "documentType": "manual"
      }
    }
  ],
  "totalRetrieved": 5,
  "context": "[Source: Tomato Growing Guide 2024, Page: 12...]\n..."
}
```

### 3. Generate Embedding

```http
POST /embed
Content-Type: application/json
```

**Request:**
```json
{
  "text": "How to prepare soil for planting?",
  "task_type": "QUESTION_ANSWERING"
}
```

**Response:**
```json
{
  "embedding": [0.123, -0.456, ...],
  "dimension": 768
}
```

### 4. List Documents

```http
GET /documents
```

**Response:**
```json
{
  "documents": [
    {
      "documentId": "tomato-guide-2024",
      "source": "Tomato Growing Guide 2024",
      "documentType": "manual",
      "chunkCount": 145,
      "createdAt": "2024-11-11T10:30:00Z"
    }
  ],
  "totalDocuments": 1
}
```

### 5. Document Statistics

```http
GET /documents/{document_id}/stats
```

**Response:**
```json
{
  "documentId": "tomato-guide-2024",
  "chunkCount": 145
}
```

## Architecture

```
┌─────────────────────┐
│   Agricultural      │
│   PDFs (GCS/Local)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Ingestion Pipeline │
│  - Extract text     │
│  - Chunk (512 chars)│
│  - Generate embed   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    Firestore DB     │
│  vectorChunks/      │
│  - content          │
│  - embedding (768d) │
│  - metadata         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    User Query       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Query Embedding    │
│  (QUESTION_ANSWER)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Similarity Search  │
│  (Cosine distance)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Relevant Chunks    │
│  (with scores)      │
└─────────────────────┘
```

## Configuration

All configuration is done via environment variables (see `env.example`):

### Core Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `GOOGLE_CLOUD_PROJECT` | - | GCP project ID (required) |
| `VERTEX_AI_LOCATION` | `us-central1` | Vertex AI region |
| `EMBEDDING_MODEL` | `text-embedding-005` | Embedding model (latest) |
| `EMBEDDING_DIMENSION` | `768` | Embedding dimension |
| `VECTOR_COLLECTION` | `vectorChunks` | Firestore collection name |

### Chunking Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `CHUNK_SIZE` | `512` | Characters per chunk |
| `CHUNK_OVERLAP` | `50` | Character overlap |
| `EMBEDDING_BATCH_SIZE` | `20` | Chunks per API call |
| `FIRESTORE_BATCH_SIZE` | `500` | Documents per Firestore batch |

### Retrieval Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `TOP_K_RESULTS` | `5` | Default results to return |
| `SIMILARITY_THRESHOLD` | `0.6` | Minimum similarity score |
| `MAX_CONTEXT_LENGTH` | `8000` | Max context characters |

## Firestore Schema

### Collection: `vectorChunks`

```javascript
{
  "id": "tomato-guide_chunk_0042",
  "content": "Full text content of the chunk...",
  "embedding": [0.123, -0.456, ...], // 768-dimensional vector
  "embeddingDim": 768,
  "metadata": {
    "documentId": "tomato-guide-2024",
    "source": "Tomato Growing Guide 2024",
    "pageNumber": 12,
    "chunkIndex": 42,
    "documentType": "manual",  // manual, guide, research
    "crop": "tomato",          // optional
    "region": "East Africa"    // optional
  },
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
```

## Examples

### Python Client Example

```python
import requests

# Query the RAG system
response = requests.post(
    "http://localhost:8000/query",
    json={
        "query": "How to control aphids on tomatoes?",
        "top_k": 3,
        "filters": {"crop": "tomato"}
    }
)

data = response.json()
print(f"Retrieved {data['totalRetrieved']} chunks")

for chunk in data['chunks']:
    print(f"\nScore: {chunk['score']:.2f}")
    print(f"Source: {chunk['metadata']['source']}")
    print(f"Content: {chunk['content'][:200]}...")
```

### JavaScript/TypeScript Example

```typescript
const response = await fetch('http://localhost:8000/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'Best time to plant maize?',
    top_k: 5,
    filters: { crop: 'maize', region: 'East Africa' }
  })
});

const data = await response.json();
console.log(`Retrieved ${data.totalRetrieved} relevant chunks`);
```

## Troubleshooting

### "Permission denied" errors

Ensure your service account has:
- `roles/aiplatform.user` (Vertex AI)
- `roles/datastore.user` (Firestore)
- `roles/storage.objectViewer` (Cloud Storage, if using GCS)

```bash
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/aiplatform.user"
```

### "Model not found" errors

Ensure `text-multilingual-embedding-002` is available in your region:

```bash
# Check available models
gcloud ai models list --region=us-central1
```

### Firestore connection issues

Check Firestore is enabled and has a database:

```bash
gcloud firestore databases list
```

## Performance & Cost

### Embedding Costs

- **Model**: text-multilingual-embedding-002
- **Cost**: ~$0.00025 per 1K tokens
- **Example**: 100-page PDF (~50K tokens) ≈ $0.0125

### Storage Costs

- **Firestore**: $0.18 per GB/month
- **Example**: 1000 chunks (768-dim) ≈ 6MB ≈ $0.001/month

### API Latency

- **Embedding**: ~100-200ms per batch (20 chunks)
- **Retrieval**: ~500-1000ms (client-side similarity search)
- **Total query time**: ~1-2s

For production with large datasets, consider Vertex AI Vector Search for faster retrieval.

## Development

### Running Tests

```bash
# Run all tests
python test_pipeline.py

# Run specific module tests
pytest tests/  # (if pytest tests are added)
```

### Code Style

```bash
# Format code
black *.py

# Type checking
mypy *.py

# Linting
ruff check *.py
```

## Deployment

### Cloud Run Deployment

```bash
# Build and deploy
gcloud run deploy cropsense-rag \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_CLOUD_PROJECT=your-project-id
```

### Docker Deployment

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Next Steps

- [ ] Add Vertex AI Vector Search for production-scale retrieval
- [ ] Implement chunking strategies for different document types
- [ ] Add caching layer for frequently queried content
- [ ] Implement evaluation metrics (precision, recall, NDCG)
- [ ] Add authentication/authorization
- [ ] Set up monitoring and logging

## Support

- Technical Design Doc: `../../docs/Technical Design Doc.md`
- RAG Implementation Guide: `../../docs/rag.md`
- Issues: GitHub Issues

