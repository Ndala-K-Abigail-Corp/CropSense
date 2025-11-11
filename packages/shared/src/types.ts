/**
 * Common TypeScript types for CropSense
 */

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * RAG-specific types
 */
export interface EmbeddingRequest {
  text: string;
  model?: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  dimension: number;
}

export interface RetrievalResult {
  chunkId: string;
  content: string;
  score: number;
  metadata: {
    documentId: string;
    source: string;
    pageNumber?: number;
  };
}

export interface GenerationRequest {
  query: string;
  context: string[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerationResponse {
  answer: string;
  sources: Array<{
    documentId: string;
    title: string;
    pageNumber?: number;
    excerpt: string;
  }>;
  metadata?: {
    model: string;
    tokensUsed: number;
    latencyMs: number;
  };
}

