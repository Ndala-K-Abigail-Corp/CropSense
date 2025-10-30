/**
 * useChatInterface Hook
 * Manages chat interface state and message submission
 * TDD §4: Custom hooks for shared logic
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useRegionCropContext } from './useRegionCropContext';
import type { ChatMessage } from 'shared';

/**
 * Chat interface state and handlers
 */
export function useChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { region, crop } = useRegionCropContext();

  // tRPC mutation for submitting queries
  const submitQueryMutation = trpc.chat.query.useMutation({
    onSuccess: (response) => {
      // Add assistant response to messages
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toISOString(),
        sources: response.sources,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    },
    onError: (error) => {
      // Add error message
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  /**
   * Submit a new message
   */
  const submitMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      // Add user message to chat
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput('');

      // Submit query with context
      await submitQueryMutation.mutateAsync({
        query: text,
        context: {
          region: region?.region,
          crop: crop?.cropName,
        },
      });
    },
    [submitQueryMutation, region, crop]
  );

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      submitMessage(input);
    },
    [input, submitMessage]
  );

  /**
   * Clear chat history
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  /**
   * Scroll to bottom of messages
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return {
    messages,
    input,
    setInput,
    submitMessage,
    handleSubmit,
    clearMessages,
    isLoading: submitQueryMutation.isLoading,
    messagesEndRef,
  };
}

