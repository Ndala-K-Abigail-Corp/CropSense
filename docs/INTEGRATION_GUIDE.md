# CropSense RAG Frontend Integration Guide

## 🎯 Overview

This guide shows how to integrate your RAG backend with the CropSense frontend and set up automatic PDF processing.

## ✅ What's Been Integrated

### 1. Frontend → RAG Backend Connection
- ✅ Updated `apps/web/src/lib/api.ts` to call RAG `/query` endpoint
- ✅ Added `VITE_RAG_API_URL` environment variable
- ✅ Frontend now retrieves real farming knowledge from vectorChunks
- ✅ Sources displayed in chat interface with metadata

### 2. Auto-Processing Pipeline
- ✅ Cloud Function `processNewDocument` created
- ✅ Automatically triggers when PDFs uploaded to bucket
- ✅ Extracts text, generates embeddings, stores in vectorChunks
- ✅ Updates `farming_knowledge` collection with metadata

### 3. Data Flow

```
┌─────────────────────────────────────────────────────┐
│  User uploads PDF → Cloud Storage Bucket            │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  Cloud Function: processNewDocument (Auto-triggers) │
│  1. Download PDF                                    │
│  2. Extract text                                    │
│  3. Chunk intelligently                             │
│  4. Generate embeddings (Vertex AI)                 │
│  5. Store in vectorChunks                           │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  Firestore Collections:                             │
│  - vectorChunks (searchable chunks)                 │
│  - farming_knowledge (metadata)                     │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  User asks question in Chat Interface               │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  Frontend calls RAG /query endpoint                 │
│  - Query embedded                                   │
│  - Vector similarity search                         │
│  - Top chunks retrieved                             │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  Response displayed in chat with sources            │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment Steps

### Step 1: Deploy RAG Backend

```bash
cd packages/rag

# Ensure your .env is configured
cat .env

# Start RAG API (for local testing)
python main.py

# For production: Deploy to Cloud Run
gcloud run deploy cropsense-rag \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_CLOUD_PROJECT=cropsense-927f8 \
  --set-env-vars EMBEDDING_MODEL=text-multilingual-embedding-002
```

**Note your deployed URL:** `https://cropsense-rag-xxxxx.run.app`

### Step 2: Deploy Cloud Functions

```bash
cd functions

# Install dependencies
npm install
npm install @google-cloud/aiplatform pdf-parse

# Deploy the processNewDocument function
firebase deploy --only functions:processNewDocument
```

This creates a trigger that automatically processes PDFs when uploaded to your bucket.

### Step 3: Configure Frontend Environment

Create or update `apps/web/.env`:

```bash
# Firebase Config (keep your existing values)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=cropsense-927f8.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=cropsense-927f8
VITE_FIREBASE_STORAGE_BUCKET=cropsense-927f8.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# RAG API URL (Update with your Cloud Run URL)
VITE_RAG_API_URL=https://cropsense-rag-xxxxx.run.app

# Or for local development:
# VITE_RAG_API_URL=http://localhost:8000
```

### Step 4: Deploy Frontend

```bash
cd apps/web

# Build
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

---

## 📁 Cloud Storage Bucket Setup

### Create Folder Structure

Your storage bucket should have folders for agricultural documents:

```
gs://cropsense-927f8.firebasestorage.app/
├── farming-documents/        # Auto-processed by Cloud Function
│   ├── maize-cultivation.pdf
│   ├── tomato-diseases.pdf
│   └── pest-management.pdf
├── agricultural-docs/         # Also auto-processed
│   └── soil-health-guide.pdf
└── user-uploads/             # User-uploaded files (not auto-processed)
```

### Upload Test Document

```bash
# Upload a farming PDF
gsutil cp your-farming-guide.pdf gs://cropsense-927f8.firebasestorage.app/farming-documents/

# Or use Firebase Console:
# 1. Go to Firebase Console → Storage
# 2. Create folder: farming-documents
# 3. Upload PDF files

# The Cloud Function will automatically:
# ✅ Detect the new PDF
# ✅ Extract text
# ✅ Generate embeddings
# ✅ Store in vectorChunks
```

---

## 🧪 Testing the Integration

### 1. Test RAG Backend (Standalone)

```bash
cd packages/rag

# Start server
python main.py

# In another terminal, test query
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "How to prevent maize blight?", "top_k": 3}'
```

**Expected:** JSON response with relevant farming chunks and context.

### 2. Test Cloud Function (Local Emulator)

```bash
cd functions

# Start Firebase emulators
firebase emulators:start --only functions,storage

# Upload a test PDF to trigger function
# (Use Firebase Console or gsutil with emulator)
```

### 3. Test Full Integration (Frontend → Backend)

```bash
# Terminal 1: Start RAG backend
cd packages/rag
python main.py

# Terminal 2: Start frontend
cd apps/web
npm run dev

# Open browser: http://localhost:5173
# 1. Sign up/Login
# 2. Ask: "How to grow tomatoes?"
# 3. Should see real farming knowledge with sources!
```

---

## 📊 Verify Data in Firestore

### Check vectorChunks Collection

```bash
cd packages/rag
python check_data.py
```

**Expected output:**
```
✓ vectorChunks has data (10+ docs)
  → Ready for CropSense RAG queries!
```

### Query from Firebase Console

1. Go to Firestore Database
2. Open `vectorChunks` collection
3. Should see documents like:
   - `maize-cultivation_chunk_0000`
   - `tomato-diseases_chunk_0001`
4. Each document has:
   - `content`: Text chunk
   - `embedding`: 768-dimensional array
   - `metadata`: {documentId, source, crop, region, etc.}

---

## 🔄 Processing Existing Documents

If you already have PDFs in `farming_knowledge` but no chunks in `vectorChunks`:

### Option 1: Re-upload to Trigger Auto-Processing

```bash
# Download existing PDFs from wherever they are
# Upload to farming-documents folder to trigger Cloud Function
gsutil cp local-pdfs/*.pdf gs://cropsense-927f8.firebasestorage.app/farming-documents/
```

### Option 2: Batch Process with Python Script

```bash
cd packages/rag

# Use the existing ingestion script
python ingestion.py \
  --pdf gs://cropsense-927f8.firebasestorage.app/path/to/doc.pdf \
  --id document-id \
  --name "Document Name" \
  --type manual \
  --crop tomato
```

### Option 3: Process All GCS PDFs in Bulk

Create `process_all_gcs_docs.py`:

```python
from google.cloud import storage
import asyncio
from ingestion import ingest_document

async def main():
    storage_client = storage.Client(project="cropsense-927f8")
    bucket = storage_client.bucket("cropsense-927f8.firebasestorage.app")
    
    # List all PDFs in farming-documents
    blobs = bucket.list_blobs(prefix="farming-documents/")
    
    for blob in blobs:
        if blob.name.endswith('.pdf'):
            doc_id = blob.name.split('/')[-1].replace('.pdf', '')
            gcs_path = f"gs://{bucket.name}/{blob.name}"
            
            print(f"Processing: {doc_id}")
            await ingest_document(
                pdf_path=gcs_path,
                document_id=doc_id,
                document_name=doc_id.replace('-', ' ').replace('_', ' ').title(),
                document_type="agricultural_guide",
                metadata={"source": "cloud_storage"}
            )

if __name__ == "__main__":
    asyncio.run(main())
```

Run: `python process_all_gcs_docs.py`

---

## 🎨 Frontend Features Enabled

### 1. Real-Time Knowledge Retrieval
- Users ask farming questions
- System retrieves relevant chunks from vectorChunks
- Displays formatted response with context

### 2. Source Citations
- Each response shows sources
- Document name, page number shown
- Users can see where information came from

### 3. Metadata Filtering (Future)
Update frontend to filter by crop/region:

```typescript
// In api.ts, modify the fetch call:
body: JSON.stringify({
  query: request.query,
  top_k: 5,
  min_score: 0.6,
  filters: {
    crop: 'tomato',  // Optional filter
    region: 'zambia' // Optional filter
  }
}),
```

---

## 🐛 Troubleshooting

### Issue: Frontend shows "RAG API error"

**Check:**
1. Is RAG backend running? `curl http://localhost:8000/health`
2. Is `VITE_RAG_API_URL` correct in `.env`?
3. Check browser console for CORS errors

**Fix:**
- Ensure RAG `main.py` has CORS enabled (already done)
- Restart frontend: `npm run dev`

### Issue: Cloud Function not triggering

**Check:**
1. Function deployed? `firebase functions:list`
2. PDF in correct folder? (farming-documents/ or agricultural-docs/)
3. Check function logs: `firebase functions:log`

**Fix:**
```bash
# Redeploy function
firebase deploy --only functions:processNewDocument

# Check logs
gcloud functions logs read processNewDocument --region=us-central1
```

### Issue: No results from queries

**Check:**
1. Is vectorChunks empty? Run `python check_data.py`
2. Are embeddings generated correctly?
3. Try lowering similarity threshold

**Fix:**
```bash
# Add test data
cd packages/rag
python ingest_test_data.py

# Or adjust threshold in frontend api.ts:
min_score: 0.5  // Lower from 0.6
```

---

## 📈 Monitoring & Maintenance

### Check RAG API Health

```bash
curl https://your-rag-api.run.app/health
```

### Monitor Cloud Function Executions

```bash
# View function logs
gcloud functions logs read processNewDocument --limit=50

# Check execution count
gcloud monitoring time-series list \
  --filter='metric.type="cloudfunctions.googleapis.com/function/execution_count"'
```

### Monitor Costs

```bash
# Check Vertex AI usage
gcloud alpha billing accounts get-costs-table

# Firestore reads/writes
# Go to Firebase Console → Usage Tab
```

---

## 🎯 Next Steps

1. **Add More Documents**
   - Upload agricultural PDFs to `farming-documents/` folder
   - Auto-processing will handle rest

2. **Improve Responses**
   - Add Gemini for generation (currently retrieval-only)
   - Implement conversation memory

3. **Add Admin Panel**
   - View all ingested documents
   - Manually trigger re-processing
   - Monitor chunk counts

4. **Optimize Performance**
   - Implement caching for common queries
   - Add Vertex AI Vector Search for faster retrieval
   - Compress embeddings

---

## 📚 Key Files Modified

- `apps/web/src/lib/api.ts` - RAG backend integration
- `apps/web/src/env.ts` - RAG API URL config
- `functions/src/processNewDocument.ts` - Auto-processing Cloud Function
- `functions/src/index.ts` - Function export
- `packages/rag/*` - RAG backend (already working)

---

## ✅ Integration Complete Checklist

- [ ] RAG backend deployed and accessible
- [ ] Cloud Function deployed (`processNewDocument`)
- [ ] Frontend environment configured (`VITE_RAG_API_URL`)
- [ ] Frontend deployed to Firebase Hosting
- [ ] Test PDF uploaded to `farming-documents/`
- [ ] Verified chunks in `vectorChunks` collection
- [ ] Tested query from frontend chat interface
- [ ] Responses show relevant farming knowledge
- [ ] Sources displayed correctly

---

**🎉 Your CropSense RAG system is now fully integrated!**

Users can upload agricultural PDFs → Auto-processed → Searchable via chat interface!

