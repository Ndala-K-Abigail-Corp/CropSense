# ADR 002: RAG Architecture with Firestore and Vertex AI

**Date**: 2025-11-12  
**Status**: Accepted  
**Deciders**: CropSense Team

## Context

CropSense needs to provide farmers with accurate, context-aware agricultural guidance. We need a system that can:
1. Ingest and process agricultural documents (PDFs, manuals, guides)
2. Store document embeddings for semantic search
3. Retrieve relevant context for user queries
4. Generate accurate answers grounded in trusted sources
5. Scale cost-effectively for MVP while supporting future growth

### Requirements

**Functional**:
- Process PDF documents and extract text
- Generate embeddings for semantic search
- Perform k-NN (nearest neighbor) search for relevant chunks
- Cite sources in responses
- Support filtering by document metadata (crop type, region, etc.)

**Non-Functional**:
- Query latency < 5 seconds (p95)
- Cost-effective for MVP (<$100/month)
- Easy to iterate and improve
- Path to scale to 10,000+ documents

### Considered Options

1. **OpenAI Embeddings + Pinecone**: Popular commercial stack
2. **Vertex AI + Vertex AI Vector Search**: Fully managed GCP solution
3. **Vertex AI + Firestore**: Hybrid approach (MVP-friendly)
4. **Self-hosted Embedding Model + PostgreSQL pgvector**: Open-source stack
5. **Azure OpenAI + Azure Cognitive Search**: Microsoft stack

## Decision

We will use **Vertex AI for embeddings and generation** with **Firestore for vector storage** in MVP, with a clear migration path to **Vertex AI Vector Search** for production scale.

### Architecture

```
┌─────────────┐
│   Web App   │
│  (React)    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Cloud Functions │  ←  API Gateway
│   (Node.js)     │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐     ┌──────────────┐
│  RAG Backend    │────▶│  Vertex AI   │
│  (FastAPI)      │     │  - Embeddings│
└─────┬───────────┘     │  - Gemini    │
      │                 └──────────────┘
      ▼
┌─────────────────┐
│   Firestore     │
│  (Vector Store) │
└─────────────────┘
```

### Technology Choices

**Embeddings**: `text-embedding-005` (768 dimensions)
- Multi-lingual support
- High quality for semantic search
- Cost: $0.00001/1K characters

**Generation**: `gemini-1.5-pro`
- Long context window (1M tokens)
- Good at following instructions
- Supports grounding with citations

**Vector Store**:
- **MVP**: Firestore with cosine similarity in memory
  - Simple to implement
  - No additional infrastructure
  - Good for <1,000 documents
  - Cost: ~$5-10/month

- **Production**: Vertex AI Vector Search
  - Managed k-NN search
  - Sub-second latency at scale
  - Supports filtering
  - Migration path is straightforward

## Consequences

### Positive

✅ **Fast MVP Development**: Firestore allows quick prototyping  
✅ **Cost-Effective Start**: Minimal infrastructure costs for MVP  
✅ **Integrated Ecosystem**: All services in GCP work together seamlessly  
✅ **Clear Migration Path**: Easy transition to Vector Search when needed  
✅ **Quality Embeddings**: Vertex AI embeddings are state-of-the-art  
✅ **Long Context**: Gemini's 1M token context supports extensive grounding  
✅ **Managed Services**: No infrastructure to maintain

### Negative

⚠️ **Firestore Limitations**: Not optimized for vector search at scale  
⚠️ **Vendor Lock-in**: Tied to GCP ecosystem  
⚠️ **Cold Start Latency**: Cloud Functions may have cold starts  
⚠️ **Cost at Scale**: Vertex AI costs grow with usage  
⚠️ **Limited Offline Support**: Requires internet connectivity

### Mitigation Strategies

- **Performance**: Implement caching layer for common queries
- **Vendor Lock-in**: Abstract vector store behind interface for portability
- **Cold Starts**: Use minimum instances or Cloud Run for backend
- **Cost**: Monitor usage with billing alerts, optimize chunk sizes
- **Migration**: Plan transition to Vector Search at 1,000+ documents

## Implementation Details

### Document Ingestion Pipeline

1. **Upload**: Admin uploads PDF to Cloud Storage
2. **Trigger**: Cloud Function detects new file
3. **Extract**: Python service extracts text with PyMuPDF
4. **Chunk**: Split text into 512-character chunks with 50-char overlap
5. **Embed**: Generate embeddings via Vertex AI API (batch requests)
6. **Store**: Save chunks + embeddings to Firestore `vectorChunks` collection

### Query Pipeline

1. **User Query**: User asks question via web app
2. **Embed Query**: Generate embedding for user query
3. **Retrieve**: Find top-k (5-10) most similar chunks using cosine similarity
4. **Build Context**: Concatenate retrieved chunks with sources
5. **Generate**: Call Gemini with context + query + instructions
6. **Return**: Send answer + source citations to user

### Data Model

```typescript
// Firestore Collection: vectorChunks
{
  chunkId: string;
  documentId: string;
  content: string;
  embedding: number[];  // 768-dim vector
  metadata: {
    source: string;
    pageNumber: number;
    crop?: string;
    region?: string;
  };
  createdAt: Timestamp;
}
```

## Migration to Production

**Triggers for Migration**:
- More than 1,000 documents ingested
- Query latency exceeds 3 seconds (p95)
- Monthly costs exceed budget threshold

**Migration Steps**:
1. Create Vertex AI Vector Search index
2. Batch upload existing embeddings
3. Update retriever to use Vector Search API
4. Run A/B test comparing performance
5. Migrate traffic gradually
6. Archive Firestore vector data

## Performance Targets

| Metric | MVP Target | Production Target |
|--------|-----------|-------------------|
| Ingestion Time | < 30s/document | < 10s/document |
| Query Latency (p50) | < 2s | < 1s |
| Query Latency (p95) | < 5s | < 2s |
| Embedding Cost | < $10/month | < $50/month |
| Generation Cost | < $20/month | < $100/month |

## Related Decisions

- [ADR 001](001-monorepo-structure.md): Monorepo structure for code organization
- [ADR 003](003-frontend-framework-choice.md): Frontend implementation

## References

- [Vertex AI Embeddings Documentation](https://cloud.google.com/vertex-ai/docs/generative-ai/embeddings/get-text-embeddings)
- [Vertex AI Vector Search](https://cloud.google.com/vertex-ai/docs/vector-search/overview)
- [RAG Best Practices](https://www.anthropic.com/index/contextual-retrieval)
- [Gemini Models Documentation](https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini)

