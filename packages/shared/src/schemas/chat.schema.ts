import { z } from 'zod';

/**
 * Chat message schema
 * Represents a single message in the conversation
 */
export const chatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1, 'Message content cannot be empty'),
  timestamp: z.string().datetime(),
  sources: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        snippet: z.string(),
        url: z.string().url().optional(),
        relevanceScore: z.number().min(0).max(1).optional(),
      })
    )
    .optional(),
});

/**
 * Chat query input schema
 * Validates user input for chat queries
 */
export const chatQuerySchema = z.object({
  query: z
    .string()
    .min(3, 'Query must be at least 3 characters')
    .max(500, 'Query must be less than 500 characters'),
  context: z
    .object({
      region: z.string().optional(),
      crop: z.string().optional(),
      previousMessages: z.array(z.string()).optional(),
    })
    .optional(),
});

/**
 * Chat response schema
 * Represents the complete response from the RAG system
 */
export const chatResponseSchema = z.object({
  answer: z.string(),
  sources: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      snippet: z.string(),
      url: z.string().url().optional(),
      relevanceScore: z.number().min(0).max(1),
    })
  ),
  metadata: z
    .object({
      retrievalTime: z.number(),
      generationTime: z.number(),
      model: z.string().optional(),
    })
    .optional(),
});

/**
 * Retrieval result schema
 * Represents retrieved documents from the knowledge base
 */
export const retrievalResultSchema = z.object({
  documents: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      snippet: z.string(),
      url: z.string().url().optional(),
      metadata: z.record(z.any()).optional(),
      score: z.number().min(0).max(1),
    })
  ),
  totalCount: z.number(),
  query: z.string(),
});

// Type exports
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatQuery = z.infer<typeof chatQuerySchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
export type RetrievalResult = z.infer<typeof retrievalResultSchema>;

