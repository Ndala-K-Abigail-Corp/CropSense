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
 * Mock implementation of chat.sendMessage for development
 * Replace with actual tRPC/API call in production
 */
export async function sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Mock response
  const mockResponse: SendMessageResponse = {
    conversationId: request.conversationId || `conv-${Date.now()}`,
    message: {
      role: 'assistant',
      content: `Based on your question about "${request.query}", here's what I found from trusted agricultural resources:\n\nThis is a mock response for development. The actual RAG pipeline will retrieve relevant information from indexed documents and generate a contextual answer using Vertex AI.\n\nKey recommendations:\n1. Follow local agricultural best practices\n2. Consider soil conditions and climate\n3. Consult with local agricultural extension services`,
      sources: [
        {
          documentId: 'doc-1',
          title: 'Agricultural Best Practices Guide',
          pageNumber: 12,
          excerpt: 'Sample excerpt from the source document...',
          url: '/docs/best-practices.pdf',
        },
        {
          documentId: 'doc-2',
          title: 'Crop Management Handbook',
          pageNumber: 45,
          excerpt: 'Another relevant excerpt...',
        },
      ],
      createdAt: new Date(),
    },
  };

  return mockResponse;
}

export const api = {
  chat: {
    sendMessage,
  },
};

