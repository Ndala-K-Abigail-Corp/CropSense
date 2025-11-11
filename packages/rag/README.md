# CropSense RAG Backend

FastAPI-based RAG (Retrieval-Augmented Generation) backend for CropSense.

## Overview

This package provides the RAG pipeline for processing agricultural documents and answering user queries using Vertex AI.

## Features

- **Document Ingestion**: Extract, chunk, and embed documents
- **Vector Storage**: Store embeddings in Firestore (MVP) or Vertex AI Vector Search (Production)
- **Retrieval**: Semantic search for relevant context
- **Generation**: Generate answers using Vertex AI Gemini

## Setup

1. Create a virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your Google Cloud credentials
```

4. Run the development server:
```bash
python main.py
# or
uvicorn main:app --reload
```

## API Endpoints

### Health Check
```
GET /health
```

### Query
```
POST /query
Content-Type: application/json

{
  "query": "What are best practices for tomato cultivation?",
  "top_k": 5,
  "filters": {
    "documentType": "manual"
  }
}
```

### Embed Text
```
POST /embed
Content-Type: application/json

{
  "text": "Sample text to embed"
}
```

## Architecture

```
┌─────────────────┐
│   User Query    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Embeddings    │
│  (Vertex AI)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Vector Search  │
│   (Firestore)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Context Build  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Generation    │
│   (Gemini)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Response     │
└─────────────────┘
```

## Development

Current implementation uses mock/stub responses for development. Production deployment requires:

1. Valid Google Cloud credentials
2. Vertex AI API enabled
3. Firestore database configured
4. Ingested documents with embeddings

## Next Steps

1. Implement actual Vertex AI integration
2. Add document ingestion pipeline
3. Implement chunking strategies
4. Add evaluation metrics
5. Deploy to Cloud Run

