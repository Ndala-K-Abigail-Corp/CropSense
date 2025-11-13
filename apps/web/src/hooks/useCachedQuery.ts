import { useQuery } from '@tanstack/react-query';
import { api, type SendMessageRequest, type SendMessageResponse } from '@/lib/api';

/**
 * Hook for cached RAG queries using TanStack Query
 * Provides client-side caching with 5-minute stale time
 */
export function useCachedQuery(request: SendMessageRequest, enabled: boolean = true) {
  return useQuery<SendMessageResponse>({
    queryKey: ['rag-query', request.query, request.conversationId],
    queryFn: () => api.chat.sendMessage(request),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

