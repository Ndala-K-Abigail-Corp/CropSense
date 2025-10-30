/**
 * useRetrievalAPI Hook
 * Handles retrieval of documents from knowledge base
 * TDD §4: Custom hooks for shared logic
 */

import { trpc } from '@/lib/trpc';

/**
 * Hook for retrieving documents
 * @param query - Search query
 * @param limit - Maximum number of results
 */
export function useRetrievalAPI(query: string, limit = 5) {
  const retrievalQuery = trpc.chat.retrieve.useQuery(
    { query, limit },
    {
      enabled: query.length >= 3, // Only fetch if query is meaningful
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      retry: 2,
    }
  );

  return {
    documents: retrievalQuery.data?.documents || [],
    totalCount: retrievalQuery.data?.totalCount || 0,
    isLoading: retrievalQuery.isLoading,
    isError: retrievalQuery.isError,
    error: retrievalQuery.error,
    refetch: retrievalQuery.refetch,
  };
}

