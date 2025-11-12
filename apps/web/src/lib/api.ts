import { env } from '@/env';

const API_BASE_URL = env.VITE_API_URL;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  createdAt: Date;
}

export interface Source {
  documentId: string;
  title: string;
  pageNumber?: number;
  excerpt: string;
  url?: string;
}

export interface SendMessageRequest {
  query: string;
  conversationId?: string;
}

export interface SendMessageResponse {
  message: ChatMessage;
  conversationId: string;
}

/**
 * Custom error class for RAG API errors
 */
export class RAGError extends Error {
  constructor(
    message: string,
    public code: 'NETWORK' | 'SERVER' | 'TIMEOUT' | 'UNKNOWN',
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'RAGError';
  }
}

/**
 * Retry helper with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry if it's not retryable or if it's the last attempt
      if (error instanceof RAGError && !error.retryable) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff: wait longer on each retry
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Call the RAG backend with Gemini-powered answer generation
 */
export async function sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
  const RAG_API_URL = env.VITE_RAG_API_URL || 'http://localhost:8000';
  const USE_GEMINI = env.VITE_USE_GEMINI !== 'false'; // Default to true

  return retryWithBackoff(async () => {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout for Gemini

      try {
        // Call RAG /answer endpoint (with Gemini) or /query endpoint (retrieval only)
        const endpoint = USE_GEMINI ? '/answer' : '/query';
        const response = await fetch(`${RAG_API_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: request.query,
            use_rag: true,
            top_k: 5,
            min_score: 0.6,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle different HTTP error codes
        if (!response.ok) {
          if (response.status >= 500) {
            throw new RAGError(
              `Server error: ${response.statusText}`,
              'SERVER',
              true // Retryable
            );
          } else if (response.status === 403) {
            throw new RAGError(
              'Authentication failed',
              'SERVER',
              false // Not retryable
            );
          } else {
            throw new RAGError(
              `Request failed: ${response.statusText}`,
              'SERVER',
              false
            );
          }
        }

        const data = await response.json();

        // Transform response based on endpoint type
        let content: string;
        let sources: Source[] = [];

        if (USE_GEMINI && data.answer) {
          // Gemini answer response
          content = data.answer;
          
          // Extract sources from chunks if available
          if (data.chunks && Array.isArray(data.chunks)) {
            sources = data.chunks.map((chunk: any) => {
              const source: Source = {
                documentId: chunk.metadata?.documentId || 'unknown',
                title: chunk.metadata?.source || 'Agricultural Document',
                excerpt: chunk.content.substring(0, 150) + '...',
              };

              if (chunk.metadata?.pageNumber) {
                source.pageNumber = chunk.metadata.pageNumber;
              }

              if (chunk.metadata?.gcsPath) {
                source.url = chunk.metadata.gcsPath;
              }

              return source;
            });
          }
        } else {
          // Query-only response (no Gemini)
          sources = (data.chunks || []).map((chunk: any) => {
            const source: Source = {
              documentId: chunk.metadata?.documentId || 'unknown',
              title: chunk.metadata?.source || 'Agricultural Document',
              excerpt: chunk.content.substring(0, 150) + '...',
            };

            if (chunk.metadata?.pageNumber) {
              source.pageNumber = chunk.metadata.pageNumber;
            }

            if (chunk.metadata?.gcsPath) {
              source.url = chunk.metadata.gcsPath;
            }

            return source;
          });

          // Format context for non-Gemini response
          content = formatRAGResponse(data.context, request.query);
        }

        // Build response message
        const responseMessage: SendMessageResponse = {
          conversationId: request.conversationId || `conv-${Date.now()}`,
          message: {
            role: 'assistant',
            content: content,
            sources: sources,
            createdAt: new Date(),
          },
        };

        return responseMessage;
      } catch (error) {
        // Handle abort/timeout
        if (error instanceof Error && error.name === 'AbortError') {
          throw new RAGError(
            'Request timed out',
            'TIMEOUT',
            true // Retryable
          );
        }
        throw error;
      }
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new RAGError(
          'Network connection failed',
          'NETWORK',
          true // Retryable
        );
      }
      throw error;
    }
  }, 2).catch((error) => {
    // Final fallback after all retries exhausted
    console.error('RAG query failed after retries:', error);

    // Generate user-friendly error message
    let userMessage: string;
    if (error instanceof RAGError) {
      switch (error.code) {
        case 'NETWORK':
          userMessage = "I'm unable to connect to the knowledge base. Please check your internet connection and try again.";
          break;
        case 'TIMEOUT':
          userMessage = "The request took too long. Please try asking a simpler question.";
          break;
        case 'SERVER':
          userMessage = "The server is experiencing issues. Please try again in a moment.";
          break;
        default:
          userMessage = "I'm having trouble right now. Please try again in a moment.";
      }
    } else {
      userMessage = "An unexpected error occurred. Please try again.";
    }

    return {
      conversationId: request.conversationId || `conv-${Date.now()}`,
      message: {
        role: 'assistant',
        content: userMessage,
        sources: [],
        createdAt: new Date(),
      },
    };
  });
}

/**
 * Format RAG context into a user-friendly response
 */
function formatRAGResponse(context: string, query: string): string {
  if (!context || context.trim().length === 0) {
    return `I couldn't find specific information about "${query}" in our agricultural knowledge base. This might be because:\n\n• The information isn't in our current database\n• Try rephrasing your question\n• The topic is too specific\n\nPlease try asking about general farming practices, crop management, or pest control.`;
  }

  // Extract the most relevant information
  const sections = context.split('---').map(s => s.trim()).filter(s => s.length > 0);
  
  let response = `Based on our agricultural knowledge base, here's what I found:\n\n`;
  
  // Add the first (most relevant) section
  if (sections.length > 0) {
    const firstSection = sections[0];
    // Remove the metadata header like [Source: ..., Page: ...]
    const content = firstSection.replace(/^\[.*?\]\n/, '');
    response += content;
  }
  
  if (sections.length > 1) {
    response += `\n\n**Additional Information:**\n`;
    for (let i = 1; i < Math.min(sections.length, 3); i++) {
      const content = sections[i].replace(/^\[.*?\]\n/, '');
      response += `\n• ${content.substring(0, 200)}...`;
    }
  }
  
  response += `\n\n*This information is retrieved from our curated agricultural resources. For specific recommendations, consult with local agricultural extension services.*`;
  
  return response;
}

export const api = {
  chat: {
    sendMessage,
  },
};

