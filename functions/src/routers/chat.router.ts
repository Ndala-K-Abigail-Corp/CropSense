/**
 * Chat router - stub implementation
 * Handles chat queries and retrieval procedures
 */

import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import {
  chatQuerySchema,
  type ChatResponse,
  type RetrievalResult,
} from 'shared';

// Mock knowledge base documents
const mockDocuments = [
  {
    id: 'doc-1',
    title: 'Corn Planting Guide for Midwest Regions',
    content:
      'Plant corn when soil temperature reaches 50°F (10°C) at 2-inch depth. Optimal planting dates for the Midwest are typically late April to early May.',
    snippet:
      'Plant corn when soil temperature reaches 50°F (10°C) at 2-inch depth.',
    url: 'https://example.com/corn-planting',
    metadata: { category: 'planting', crops: ['corn'], region: 'Midwest' },
    score: 0.95,
  },
  {
    id: 'doc-2',
    title: 'Irrigation Best Practices for Row Crops',
    content:
      'For corn and soybeans, aim for 1-1.5 inches of water per week. Monitor soil moisture at 6-12 inch depth to optimize irrigation timing.',
    snippet: 'Aim for 1-1.5 inches of water per week for row crops.',
    url: 'https://example.com/irrigation-guide',
    metadata: {
      category: 'irrigation',
      crops: ['corn', 'soybeans'],
      region: 'All',
    },
    score: 0.88,
  },
  {
    id: 'doc-3',
    title: 'Integrated Pest Management for Corn',
    content:
      'Scout fields regularly for corn borers and armyworms. Use economic thresholds to determine treatment needs. Beneficial insects can provide natural control.',
    snippet:
      'Scout fields regularly for corn borers and armyworms using economic thresholds.',
    url: 'https://example.com/ipm-corn',
    metadata: { category: 'pest-control', crops: ['corn'], region: 'All' },
    score: 0.82,
  },
];

export const chatRouter = router({
  /**
   * Submit a chat query
   */
  query: publicProcedure.input(chatQuerySchema).mutation(({ input }) => {
    // Simulate retrieval + generation
    const query = input.query.toLowerCase();

    // Simple keyword matching for demo
    let relevantDocs = mockDocuments;
    if (query.includes('corn')) {
      relevantDocs = mockDocuments.filter((d) =>
        d.metadata.crops.includes('corn')
      );
    } else if (query.includes('irrigation') || query.includes('water')) {
      relevantDocs = mockDocuments.filter((d) =>
        d.metadata.category === 'irrigation'
      );
    } else if (query.includes('pest')) {
      relevantDocs = mockDocuments.filter((d) =>
        d.metadata.category === 'pest-control'
      );
    }

    // Generate mock response
    const response: ChatResponse = {
      answer: `Based on trusted agricultural sources, here's what I found about "${input.query}": ${relevantDocs[0]?.content || 'No specific guidance found, but general best practices recommend consulting with local extension services for region-specific advice.'}`,
      sources: relevantDocs.slice(0, 3).map((doc) => ({
        id: doc.id,
        title: doc.title,
        snippet: doc.snippet,
        url: doc.url,
        relevanceScore: doc.score,
      })),
      metadata: {
        retrievalTime: 120,
        generationTime: 450,
        model: 'gpt-4',
      },
    };

    return response;
  }),

  /**
   * Retrieve relevant documents
   */
  retrieve: publicProcedure
    .input(z.object({ query: z.string(), limit: z.number().default(5) }))
    .query(({ input }) => {
      const result: RetrievalResult = {
        documents: mockDocuments.slice(0, input.limit),
        totalCount: mockDocuments.length,
        query: input.query,
      };

      return result;
    }),

  /**
   * Get chat history
   */
  getHistory: publicProcedure
    .input(z.object({ userId: z.string(), limit: z.number().default(10) }))
    .query(() => {
      // Return empty history for stub
      return [];
    }),
});

