# CropSense RAG Enhancement Implementation Guide

This guide provides comprehensive instructions for the enhanced CropSense RAG system with automatic document ingestion, Gemini integration, and multi-format support.

## Overview of Enhancements

### 1. Multi-Format Document Support
- **PDF**: Full support for PDF document processing
- **DOCX**: Microsoft Word document processing
- **TXT**: Plain text file processing
- Automatic format detection and appropriate text extraction

### 2. Intelligent Document Tracking
- **Status Tracking**: Tracks processing status in Firestore (`document_status` collection)
- **Deduplication**: Prevents reprocessing of already ingested documents
- **Error Handling**: Tracks failed documents with error messages
- **Hash-based Detection**: Content-based deduplication using SHA-256

### 3. Automatic Document Processing
- **Cloud Function**: Automatically processes documents uploaded to GCS
- **Real-time Processing**: Triggers on file upload to specific folders
- **Batch Processing**: Process multiple documents with single command
- **Incremental Updates**: Only processes new/unprocessed documents

### 4. Gemini AI Integration
- **Question Answering**: Uses Gemini for intelligent responses
- **RAG Fallback**: Automatically falls back between RAG-enhanced and direct answers
- **Caching**: Caches responses to reduce API calls and improve latency
- **Rate Limiting**: Per-user rate limiting to control costs

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Document Sources                         │
│  GCS Bucket (PDF, DOCX, TXT) │ Manual Upload │ API         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Document Processing Layer                       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Cloud        │  │ Batch        │  │ Manual       │      │
│  │ Function     │  │ Ingestion    │  │ Ingestion    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                           │                                 │
│  ┌────────────────────────▼──────────────────────┐          │
│  │    Document Processor                        │          │
│  │  - Multi-format text extraction              │          │
│  │  - Status tracking & deduplication           │          │
│  │  - Intelligent chunking                      │          │
│  │  - Vertex AI embeddings                      │          │
│  └────────────────────────┬──────────────────────┘          │
└───────────────────────────┼─────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 Firestore Storage                            │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │ vectorChunks   │  │ document_      │  │ gemini_cache │  │
│  │   (768-dim)    │  │   status       │  │              │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Query Processing                           │
│                                                              │
│  User Query                                                  │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────────┐                                        │
│  │ Vector Search   │                                        │
│  │ (Cosine Sim)    │                                        │
│  └────────┬────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────────────────────┐                        │
│  │  Score >= Threshold?            │                        │
│  └────┬──────────────────────┬─────┘                        │
│       │ Yes                  │ No                           │
│       ▼                      ▼                              │
│  ┌────────────┐      ┌─────────────┐                        │
│  │ Gemini +   │      │ Gemini      │                        │
│  │ RAG Context│      │ Direct      │                        │
│  └────────────┘      └─────────────┘                        │
│       │                      │                              │
│       └──────────┬───────────┘                              │
│                  │                                           │
│                  ▼                                           │
│         ┌────────────────┐                                   │
│         │ Cache Response │                                   │
│         └────────┬───────┘                                   │
│                  │                                           │
│                  ▼                                           │
│            Final Answer                                      │
└─────────────────────────────────────────────────────────────┘
```

## Installation & Setup

### Prerequisites

1. **Python 3.9+** with pip
2. **Node.js 18+** with pnpm
3. **Google Cloud Project** with:
   - Vertex AI API enabled
   - Firestore enabled
   - Cloud Storage bucket
   - Service account with appropriate permissions

### Backend Setup (Python RAG)

1. **Navigate to RAG package**:
   ```bash
   cd packages/rag
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**:
   ```bash
   cp env.template .env
   # Edit .env with your project details
   ```

4. **Required environment variables**:
   ```env
   # Google Cloud
   GOOGLE_CLOUD_PROJECT=your-project-id
   GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
   
   # Vertex AI
   VERTEX_AI_LOCATION=us-central1
   EMBEDDING_MODEL=text-embedding-005
   EMBEDDING_DIMENSION=768
   GENERATION_MODEL=gemini-2.0-flash-exp
   
   # Gemini Configuration
   GEMINI_ENABLED=True
   GEMINI_MAX_REQUESTS_PER_HOUR=60
   GEMINI_CACHE_TTL_HOURS=24
   GEMINI_FALLBACK_THRESHOLD=0.5
   
   # Firestore
   FIRESTORE_DATABASE=(default)
   VECTOR_COLLECTION=vectorChunks
   
   # RAG Configuration
   CHUNK_SIZE=512
   CHUNK_OVERLAP=50
   TOP_K_RESULTS=5
   MAX_CONTEXT_LENGTH=8000
   SIMILARITY_THRESHOLD=0.6
   ```

5. **Authenticate with Google Cloud**:
   ```bash
   gcloud auth application-default login
   # OR set service account key
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
   ```

### Firebase Cloud Functions Setup

1. **Navigate to functions directory**:
   ```bash
   cd functions
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Firebase**:
   ```bash
   firebase use <your-project-id>
   ```

4. **Deploy functions**:
   ```bash
   npm run build
   firebase deploy --only functions
   ```

### Frontend Setup

1. **Navigate to web app**:
   ```bash
   cd apps/web
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Configure environment** (create `.env`):
   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   VITE_RAG_API_URL=http://localhost:8000
   VITE_USE_GEMINI=true
   ```

## Usage

### 1. Manual Document Ingestion

Ingest a single document:

```bash
cd packages/rag

# PDF document
python ingestion.py \
  --pdf /path/to/document.pdf \
  --id tomato-growing-guide \
  --name "Tomato Growing Guide" \
  --type manual \
  --crop tomato

# DOCX document
python ingestion.py \
  --pdf /path/to/document.docx \
  --id corn-management \
  --name "Corn Management Guide" \
  --type guide \
  --crop corn

# From Google Cloud Storage
python ingestion.py \
  --pdf gs://my-bucket/farming-documents/wheat-guide.pdf \
  --id wheat-cultivation \
  --name "Wheat Cultivation Manual" \
  --type manual \
  --crop wheat
```

### 2. Batch Document Ingestion

Process multiple documents from GCS:

```bash
cd packages/rag

# Process all unprocessed documents in bucket
python batch_ingest.py \
  --bucket your-bucket-name \
  --prefix farming-documents/

# Process specific file types
python batch_ingest.py \
  --bucket your-bucket-name \
  --prefix farming-documents/ \
  --extensions pdf docx txt

# Limit number of documents
python batch_ingest.py \
  --bucket your-bucket-name \
  --max 10

# Force reprocess all documents
python batch_ingest.py \
  --bucket your-bucket-name \
  --no-skip-processed
```

### 3. Automatic Processing via Cloud Function

The Cloud Function automatically processes documents uploaded to specific folders:

1. **Upload documents to GCS**:
   ```bash
   gsutil cp document.pdf gs://your-bucket/farming-documents/
   gsutil cp *.docx gs://your-bucket/agricultural-docs/
   ```

2. **Monitor processing**:
   ```bash
   # View function logs
   firebase functions:log
   
   # Check document status in Firestore
   # Collection: document_status
   ```

3. **Supported folders**:
   - `farming-documents/`
   - `agricultural-docs/`

### 4. Running the RAG API Server

Start the FastAPI server:

```bash
cd packages/rag

# Development mode
python main.py

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

API will be available at:
- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **Health**: http://localhost:8000/health

### 5. Using the API

#### Query without Gemini (Retrieval Only)

```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How to prevent tomato blight?",
    "top_k": 5,
    "min_score": 0.6
  }'
```

#### Answer with Gemini (RAG-enhanced)

```bash
curl -X POST http://localhost:8000/answer \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How to prevent tomato blight?",
    "use_rag": true,
    "top_k": 5,
    "min_score": 0.6,
    "user_id": "user123"
  }'
```

#### List Documents

```bash
curl http://localhost:8000/documents
```

### 6. Frontend Usage

Start the development server:

```bash
cd apps/web
pnpm dev
```

The application will:
- Automatically use Gemini for answers (if `VITE_USE_GEMINI=true`)
- Fall back to retrieval-only if Gemini is unavailable
- Display sources for all answers
- Cache responses for faster subsequent queries

## Features in Detail

### Document Tracking System

The system tracks all documents in the `document_status` collection:

```javascript
{
  documentId: "tomato-growing-guide",
  status: "completed", // pending, processing, completed, failed
  metadata: {
    gcsPath: "gs://bucket/farming-documents/tomato-guide.pdf",
    fileType: "pdf",
    chunks: 145,
    successfulChunks: 145,
    failedChunks: 0,
    completedAt: "2024-11-12T10:30:00Z",
    durationSeconds: 23.5
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Gemini Integration

The Gemini service provides:

1. **Intelligent Fallback**:
   - If RAG retrieves good context (score >= threshold), uses Gemini + RAG
   - If no good context found, uses Gemini direct answer
   - Threshold configurable via `GEMINI_FALLBACK_THRESHOLD`

2. **Caching** (Firestore collection: `gemini_cache`):
   - Caches responses for 24 hours (configurable)
   - Reduces API calls and improves latency
   - Automatic cache invalidation

3. **Rate Limiting** (Firestore collection: `gemini_rate_limits`):
   - Per-user rate limiting (60 requests/hour default)
   - Prevents abuse and controls costs
   - Configurable limits

### Multi-Format Support

#### PDF Processing
- Uses `pdfplumber` for reliable text extraction
- Preserves page numbers and structure
- Handles scanned PDFs (if OCR enabled)

#### DOCX Processing
- Uses `mammoth` for clean text extraction
- Preserves formatting and structure
- Handles complex Word documents

#### TXT Processing
- Direct UTF-8 text reading
- Fast and efficient
- Suitable for plain text knowledge bases

## Monitoring & Troubleshooting

### Check Document Processing Status

```python
from document_processor import document_processor
import asyncio

async def check_status():
    status = await document_processor.get_document_status("tomato-guide")
    print(status)

asyncio.run(check_status())
```

### List Unprocessed Documents

```python
from document_processor import document_processor
import asyncio

async def list_unprocessed():
    docs = await document_processor.get_unprocessed_documents(
        bucket_name="your-bucket",
        prefix="farming-documents/"
    )
    for doc in docs:
        print(f"{doc['document_id']}: {doc['file_type']}, {doc['size_bytes']:,} bytes")

asyncio.run(list_unprocessed())
```

### View Gemini Cache Stats

```bash
curl http://localhost:8000/health
```

Response includes cache statistics:
```json
{
  "status": "healthy",
  "service": "cropsense-rag",
  "version": "1.0.0",
  "cache": {
    "hits": 45,
    "misses": 12,
    "hit_rate": 0.789
  }
}
```

### Common Issues

#### Issue: Documents not processing automatically

**Solution**:
1. Check Cloud Function logs: `firebase functions:log`
2. Verify documents are in correct folders (`farming-documents/` or `agricultural-docs/`)
3. Check file extensions are supported (`.pdf`, `.docx`, `.txt`)
4. Verify Cloud Function has permissions to access Storage bucket

#### Issue: Gemini rate limit exceeded

**Solution**:
1. Increase `GEMINI_MAX_REQUESTS_PER_HOUR` in config
2. Check rate limit status in `gemini_rate_limits` collection
3. Wait for hourly reset
4. Implement user-specific limits

#### Issue: Poor answer quality

**Solution**:
1. Adjust `GEMINI_FALLBACK_THRESHOLD` (lower = more RAG usage)
2. Increase `TOP_K_RESULTS` for more context
3. Lower `SIMILARITY_THRESHOLD` to include more chunks
4. Review and improve document quality

#### Issue: Slow response times

**Solution**:
1. Enable caching (`GEMINI_CACHE_TTL_HOURS > 0`)
2. Reduce `TOP_K_RESULTS` if too many chunks
3. Use Gemini Flash model instead of Pro
4. Implement CDN caching for frontend

## Performance Optimization

### Embedding Generation
- Batch size: 20 chunks per request (configurable)
- Parallel processing for large documents
- Retry logic with exponential backoff

### Vector Search
- Client-side cosine similarity (MVP)
- For production: migrate to Vertex AI Vector Search
- Current limit: 1000 documents per query

### Caching Strategy
- Query cache: In-memory with TTL
- Gemini cache: Firestore with 24-hour TTL
- Response cache: Browser cache control headers

## Cost Estimation

### Vertex AI Embedding (text-embedding-005)
- **Cost**: ~$0.00025 per 1K tokens
- **Example**: 100-page PDF (~50K tokens) ≈ $0.0125

### Gemini API (gemini-2.0-flash-exp)
- **Cost**: ~$0.00025 per 1K input tokens, ~$0.001 per 1K output tokens
- **Example**: 100 queries with RAG context ≈ $0.05-0.10

### Firestore Storage
- **Storage**: $0.18 per GB/month
- **Example**: 1000 chunks (768-dim) ≈ 6MB ≈ $0.001/month

### Cloud Functions
- **Invocations**: $0.40 per million
- **Compute**: $0.0000025 per GB-second
- **Example**: 1000 documents processed ≈ $0.01

## Security Considerations

1. **API Key Authentication**: Set `RAG_API_KEY` environment variable
2. **Firebase Security Rules**: Restrict Firestore access
3. **CORS Configuration**: Limit allowed origins
4. **Rate Limiting**: Prevent abuse
5. **Input Validation**: Sanitize all user inputs

## Next Steps

1. **Evaluate Performance**: Monitor query latency and answer quality
2. **Scale Storage**: Migrate to Vertex AI Vector Search for large datasets
3. **Enhance Caching**: Implement Redis for distributed caching
4. **Add Analytics**: Track usage patterns and popular queries
5. **Improve Prompts**: Fine-tune Gemini prompts for better answers
6. **Add Feedback Loop**: Collect user feedback on answer quality

## Support

For issues or questions:
- Check logs: `firebase functions:log` or FastAPI console
- Review Firestore collections: `document_status`, `gemini_cache`, `gemini_rate_limits`
- Consult technical documentation in `/docs`
- Review test scripts in `packages/rag/test_*.py`

