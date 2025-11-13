# Cloud Function Deployment Guide

## Overview

The `processNewDocument` Cloud Function automatically processes documents uploaded to GCS buckets, extracts text, generates embeddings, and stores chunks in Firestore's `vectorChunks` collection.

## Features

- ✅ Auto-triggers on file upload to GCS
- ✅ Supports PDF, DOCX, DOC, and TXT files
- ✅ Extracts text and creates intelligent chunks
- ✅ Generates embeddings using Vertex AI (`text-embedding-005`)
- ✅ Stores chunks in `vectorChunks` collection
- ✅ Tracks processing status in `document_status` collection
- ✅ Prevents duplicate processing
- ✅ Handles errors gracefully with retry logic

## Trigger Configuration

The function triggers when files are uploaded to paths:
- `farming-documents/**`
- `agricultural-docs/**`

You can modify these paths in `functions/src/processNewDocument.ts` (lines 240-244).

## Deployment Steps

### 1. Build Functions

```bash
cd functions
npm install
npm run build
```

### 2. Deploy All Functions

```bash
# From project root
firebase deploy --only functions
```

### 3. Deploy Only Document Processor

```bash
firebase deploy --only functions:processNewDocument
```

### 4. Deploy Storage Rules (if needed)

```bash
firebase deploy --only storage
```

## Verification

### Check Function Deployment

```bash
firebase functions:list
```

You should see:
```
processNewDocument (Cloud Storage)
  Trigger: gs://YOUR_BUCKET/farming-documents/**, agricultural-docs/**
  Region: us-central1
  Runtime: Node.js 18
  Memory: 2GB
  Timeout: 540s
```

### Check Function Logs

```bash
firebase functions:log --only processNewDocument
```

### Test the Function

Upload a PDF to the configured bucket:

```bash
# Using gsutil
gsutil cp test-document.pdf gs://farming-knowledge-base/farming-documents/

# Using Python
from google.cloud import storage
storage_client = storage.Client()
bucket = storage_client.bucket('farming-knowledge-base')
blob = bucket.blob('farming-documents/test-document.pdf')
blob.upload_from_filename('test-document.pdf')
```

Monitor logs to see processing:
```bash
firebase functions:log --only processNewDocument --limit 100
```

## Configuration

### Supported File Types

Edit in `processNewDocument.ts` (line 233):
```typescript
const supportedExtensions = ['pdf', 'docx', 'doc', 'txt'];
```

### Upload Paths

Edit in `processNewDocument.ts` (lines 241-243):
```typescript
if (!filePath.startsWith('farming-documents/') && 
    !filePath.startsWith('agricultural-docs/')) {
  console.log('Not in farming documents folder, skipping');
  return null;
}
```

### Resource Allocation

Edit in `processNewDocument.ts` (lines 217-220):
```typescript
.runWith({
  timeoutSeconds: 540,    // 9 minutes
  memory: '2GB',          // 2GB RAM
})
```

## Monitoring

### Check Processing Status

```python
from google.cloud import firestore

db = firestore.Client()

# Get all processing statuses
statuses = db.collection('document_status').stream()

for doc in statuses:
    data = doc.to_dict()
    print(f"{doc.id}: {data.get('status')} - {data.get('metadata', {}).get('chunks', 0)} chunks")
```

### Failed Documents

```python
# Get failed documents
failed = db.collection('document_status').where('status', '==', 'failed').stream()

for doc in failed:
    data = doc.to_dict()
    print(f"Failed: {doc.id}")
    print(f"  Error: {data.get('errorMessage')}")
```

## Troubleshooting

### Function Not Triggering

1. **Check bucket permissions:**
   ```bash
   gsutil iam get gs://farming-knowledge-base
   ```
   
   Ensure Cloud Functions service account has `storage.objectViewer` role.

2. **Verify upload path:**
   Files must be in `farming-documents/` or `agricultural-docs/` folders.

3. **Check function deployment:**
   ```bash
   firebase functions:list
   ```

### PDF Text Extraction Fails

Some PDFs are image-based and don't contain extractable text. Solutions:
- Use OCR preprocessing before upload
- Convert to text-based PDFs
- Use alternative document formats (DOCX, TXT)

### Timeout Errors

For very large documents (>100 pages):
1. Increase timeout in function config (max 540s for HTTP, 540s for event-driven)
2. Split large documents into smaller files
3. Process in batches

### Embedding Generation Fails

Check Vertex AI quota:
```bash
gcloud alpha quotas list --service=aiplatform.googleapis.com --filter="metric=generate_content"
```

Request quota increase if needed.

## Cost Optimization

### Reduce Costs

1. **Deduplicate before upload** - Check if document already processed
2. **Optimize chunk size** - Larger chunks = fewer embeddings = lower cost
3. **Batch processing** - Use Python batch ingestion for bulk uploads instead of triggering function per file
4. **Set bucket lifecycle** - Auto-delete old files after processing

### Estimated Costs

Per 1000 documents (average 50 pages each):
- Cloud Functions execution: ~$0.50
- Vertex AI embeddings: ~$5.00 (based on text volume)
- Firestore writes: ~$0.20
- **Total: ~$5.70 per 1000 documents**

## Manual Trigger (Alternative)

If you prefer manual batch processing over auto-trigger:

```python
# Disable Cloud Function and use batch ingestion
cd packages/rag
python batch_ingest.py --bucket farming-knowledge-base --prefix farming-documents/
```

Benefits:
- More control over processing
- Better error handling
- Progress tracking
- Lower costs (no function cold starts)

## Security

### Service Account Permissions

The Cloud Function service account needs:
- `storage.objects.get` - Read uploaded files
- `firestore.documents.write` - Write chunks
- `aiplatform.endpoints.predict` - Generate embeddings

### Storage Rules

Update `storage.rules` to allow admin uploads:
```javascript
match /farming-documents/{fileName} {
  allow read: if true; // Allow function to read
  allow write: if isAdmin(); // Only admins can upload
}
```

## Next Steps

1. ✅ Deploy function: `firebase deploy --only functions:processNewDocument`
2. ✅ Test with sample document upload
3. ✅ Monitor logs for first few documents
4. ✅ Set up monitoring alerts
5. ✅ Document your upload process for admins

## Support

For issues:
1. Check function logs: `firebase functions:log`
2. Check Firestore `document_status` collection
3. Review Cloud Functions dashboard in Firebase Console
4. Check Vertex AI quota and usage

