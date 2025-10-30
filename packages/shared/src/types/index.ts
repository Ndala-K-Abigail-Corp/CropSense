/**
 * Shared TypeScript types for CropSense
 * Used across web app and backend functions
 */

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: 'farmer' | 'admin' | 'extension-officer' | 'researcher';
  region?: string;
  crops?: string[];
  createdAt: string;
  lastLoginAt?: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  category:
    | 'planting'
    | 'irrigation'
    | 'soil-health'
    | 'pest-control'
    | 'fertilization'
    | 'harvesting'
    | 'general';
  crops: string[];
  regions: string[];
  tags: string[];
  sourceUrl?: string;
  author?: string;
  publishedDate?: string;
  lastUpdated: string;
  verified: boolean;
}

export interface FeedbackSubmission {
  id: string;
  userId: string;
  messageId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  timestamp: string;
}

export type ApiResponse<T = unknown> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
        details?: unknown;
      };
    };

