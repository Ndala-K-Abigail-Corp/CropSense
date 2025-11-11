/**
 * Shared constants for CropSense
 */

/**
 * Firestore collection names
 */
export const COLLECTIONS = {
  USERS: 'users',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  VECTOR_CHUNKS: 'vectorChunks',
  DOCUMENTS: 'documents',
} as const;

/**
 * RAG Configuration
 */
export const RAG_CONFIG = {
  CHUNK_SIZE: 512,
  CHUNK_OVERLAP: 50,
  TOP_K_RESULTS: 5,
  EMBEDDING_MODEL: 'text-embedding-005',
  GENERATION_MODEL: 'gemini-2.5-pro',
  MAX_CONTEXT_LENGTH: 8000,
} as const;

/**
 * API Rate Limits
 */
export const RATE_LIMITS = {
  QUERIES_PER_MINUTE: 10,
  QUERIES_PER_DAY: 100,
} as const;

/**
 * Error Codes
 */
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

/**
 * User Roles
 */
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

