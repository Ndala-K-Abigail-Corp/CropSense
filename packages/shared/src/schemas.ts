import { z } from 'zod';

/**
 * User Profile Schema
 */
export const userProfileSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  photoURL: z.string().url().optional(),
  role: z.enum(['user', 'admin']).default('user'),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

/**
 * Chat Message Schema
 */
export const chatMessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  sources: z
    .array(
      z.object({
        documentId: z.string(),
        title: z.string(),
        pageNumber: z.number().optional(),
        excerpt: z.string(),
        url: z.string().optional(),
      })
    )
    .optional(),
  createdAt: z.date(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

/**
 * Conversation Schema
 */
export const conversationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  messageCount: z.number().default(0),
});

export type Conversation = z.infer<typeof conversationSchema>;

/**
 * Vector Chunk Schema (for RAG)
 */
export const vectorChunkSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  source: z.string(),
  pageNumber: z.number().optional(),
  chunkIndex: z.number(),
  content: z.string(),
  embedding: z.array(z.number()),
  embeddingDim: z.number(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
});

export type VectorChunk = z.infer<typeof vectorChunkSchema>;

/**
 * API Request/Response Schemas
 */
export const sendMessageRequestSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  conversationId: z.string().optional(),
});

export type SendMessageRequest = z.infer<typeof sendMessageRequestSchema>;

export const sendMessageResponseSchema = z.object({
  message: chatMessageSchema,
  conversationId: z.string(),
});

export type SendMessageResponse = z.infer<typeof sendMessageResponseSchema>;

/**
 * Ingestion Request Schema
 */
export const ingestionRequestSchema = z.object({
  storagePath: z.string(),
  documentId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type IngestionRequest = z.infer<typeof ingestionRequestSchema>;

