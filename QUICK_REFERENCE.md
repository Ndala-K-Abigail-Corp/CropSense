# CropSense RAG - Quick Reference Card

## 🚀 Common Commands

### Document Ingestion

```bash
# Single document
python packages/rag/ingestion.py --pdf /path/to/doc.pdf --id doc-id --name "Document Name"

# Batch from GCS
python packages/rag/batch_ingest.py --bucket my-bucket --prefix farming-documents/

# Limit processing
python packages/rag/batch_ingest.py --bucket my-bucket --max 10

# Force reprocess
python packages/rag/batch_ingest.py --bucket my-bucket --no-skip-processed
```

### Start API Server

```bash
cd packages/rag
python main.py                    # Development
uvicorn main:app --host 0.0.0.0   # Production
```

### Test API

```bash
# Health check
curl http://localhost:8000/health

# Query (retrieval only)
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "How to grow tomatoes?"}'

# Answer (with Gemini)
curl -X POST http://localhost:8000/answer \
  -H "Content-Type: application/json" \
  -d '{"query": "How to grow tomatoes?", "use_rag": true}'

# List documents
curl http://localhost:8000/documents
```

### Cloud Functions

```bash
# Deploy
cd functions && npm run build && firebase deploy --only functions

# View logs
firebase functions:log

# Test locally
npm run serve
```

### Frontend

```bash
cd apps/web
pnpm install
pnpm dev          # Development
pnpm build        # Production build
```

## 📝 Configuration

### Environment Variables (Backend)

```env
# Required
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
VERTEX_AI_LOCATION=us-central1

# Gemini
GEMINI_ENABLED=True
GEMINI_MAX_REQUESTS_PER_HOUR=60
GEMINI_CACHE_TTL_HOURS=24
GEMINI_FALLBACK_THRESHOLD=0.5

# RAG Settings
CHUNK_SIZE=512
CHUNK_OVERLAP=50
TOP_K_RESULTS=5
SIMILARITY_THRESHOLD=0.6
```

### Environment Variables (Frontend)

```env
VITE_RAG_API_URL=http://localhost:8000
VITE_USE_GEMINI=true
VITE_FIREBASE_PROJECT_ID=your-project-id
```

## 📦 File Locations

### Python Backend (`packages/rag/`)
- `main.py` - FastAPI server
- `document_processor.py` - Multi-format processor
- `batch_ingest.py` - Batch ingestion script
- `gemini_service.py` - Gemini AI integration
- `ingestion.py` - Single document ingestion
- `vector_store.py` - Firestore vector store
- `retriever.py` - Retrieval service
- `embeddings.py` - Vertex AI embeddings

### Cloud Functions (`functions/src/`)
- `processNewDocument.ts` - Auto-process uploads
- `rateLimiting.ts` - Rate limit management
- `index.ts` - Main exports

### Frontend (`apps/web/src/`)
- `lib/api.ts` - API client
- `components/ChatInterface.tsx` - Chat UI
- `env.ts` - Environment config

## 🗄️ Firestore Collections

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| `vectorChunks` | Document embeddings | id, content, embedding, metadata |
| `document_status` | Processing status | documentId, status, metadata |
| `gemini_cache` | Cached responses | query, response, cachedAt |
| `gemini_rate_limits` | Rate limiting | userId, requestsThisHour |
| `conversations` | User conversations | userId, title, messageCount |
| `userLimits` | User quotas | userId, conversationsToday |

## 🔍 Monitoring

### Check Document Status
```python
from document_processor import document_processor
status = await document_processor.get_document_status("doc-id")
```

### View Processing Logs
```bash
# Cloud Functions
firebase functions:log

# FastAPI
tail -f app.log
```

### API Health
```bash
curl http://localhost:8000/health | jq
```

## 🐛 Troubleshooting

### Documents Not Processing
1. Check file extension: `.pdf`, `.docx`, `.txt`
2. Verify folder: `farming-documents/` or `agricultural-docs/`
3. Check logs: `firebase functions:log`
4. Verify permissions on GCS bucket

### Gemini Errors
1. Check `GEMINI_ENABLED=True`
2. Verify API quota not exceeded
3. Check rate limits in `gemini_rate_limits` collection
4. Review error logs

### Slow Responses
1. Enable caching: `GEMINI_CACHE_TTL_HOURS > 0`
2. Reduce `TOP_K_RESULTS`
3. Check Firestore indexes
4. Use Gemini Flash instead of Pro

### Empty Results
1. Lower `SIMILARITY_THRESHOLD`
2. Check documents are ingested: `/documents`
3. Verify embeddings generated correctly
4. Review query format

## 📊 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check & cache stats |
| `/query` | POST | Retrieval only (no Gemini) |
| `/answer` | POST | Answer with Gemini + RAG |
| `/embed` | POST | Generate embeddings |
| `/documents` | GET | List all documents |
| `/documents/{id}/stats` | GET | Document statistics |

## 💡 Best Practices

### Document Ingestion
- Use descriptive document IDs
- Add metadata (crop, region, type)
- Process in batches for efficiency
- Monitor `document_status` collection

### Query Optimization
- Use specific queries (not too general)
- Add filters for better results
- Adjust `min_score` based on use case
- Monitor cache hit rates

### Cost Optimization
- Enable caching (default 24h TTL)
- Set appropriate rate limits
- Use batch ingestion
- Monitor API usage

### Security
- Set `RAG_API_KEY` in production
- Configure CORS properly
- Use Firestore security rules
- Implement user authentication

## 📈 Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Query Latency (cached) | < 100ms | With warm cache |
| Query Latency (uncached) | < 2s | Including Gemini |
| Document Processing | < 30s per doc | Depends on size |
| Cache Hit Rate | > 40% | For typical usage |
| Embedding Generation | < 1s per batch | 20 chunks/batch |

## 🎯 Common Use Cases

### 1. Initial Setup
```bash
cd packages/rag
cp env.template .env
# Edit .env
pip install -r requirements.txt
python main.py
```

### 2. Bulk Document Import
```bash
# Upload to GCS
gsutil -m cp documents/* gs://bucket/farming-documents/

# Process batch
python batch_ingest.py --bucket bucket --prefix farming-documents/
```

### 3. Test Query
```bash
curl -X POST http://localhost:8000/answer \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How do I prevent pests on tomatoes?",
    "use_rag": true,
    "top_k": 5
  }' | jq
```

### 4. Check Processing Status
```bash
# Get document status
curl http://localhost:8000/documents | jq

# Check specific document
curl http://localhost:8000/documents/tomato-guide/stats | jq
```

## 🔗 Useful Links

- **API Docs**: http://localhost:8000/docs
- **Implementation Guide**: `IMPLEMENTATION_GUIDE.md`
- **Enhancements Summary**: `ENHANCEMENTS_SUMMARY.md`
- **Vertex AI Console**: https://console.cloud.google.com/vertex-ai
- **Firestore Console**: https://console.firebase.google.com/project/_/firestore

## 🆘 Support

For issues:
1. Check logs first
2. Review relevant documentation
3. Run validation scripts: `python validate_setup.py`
4. Check Firestore collections for status
5. Review error messages in `document_status`

## 📚 Documentation Index

- **Setup**: `IMPLEMENTATION_GUIDE.md` → "Installation & Setup"
- **Usage**: `IMPLEMENTATION_GUIDE.md` → "Usage"
- **API**: http://localhost:8000/docs
- **Architecture**: `ENHANCEMENTS_SUMMARY.md` → "System Architecture"
- **Troubleshooting**: `IMPLEMENTATION_GUIDE.md` → "Troubleshooting"
- **Costs**: `ENHANCEMENTS_SUMMARY.md` → "Cost Impact"

