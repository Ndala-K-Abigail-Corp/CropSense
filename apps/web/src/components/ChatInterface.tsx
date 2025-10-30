/**
 * ChatInterface Component
 * Interactive chat interface with retrieval sources display
 * Design tokens: cards, spacing, shadows
 * TDD §2, §12: Responsive layout, ARIA live regions, focus management
 */

import React from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useChatInterface } from '@/hooks/useChatInterface';
import type { ChatMessage } from 'shared';

interface ChatInterfaceProps {
  placeholder?: string;
  emptyStateMessage?: string;
}

export function ChatInterface({
  placeholder = 'Ask about planting, irrigation, pest control...',
  emptyStateMessage = 'Start by asking a question about farming practices',
}: ChatInterfaceProps) {
  const {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    messagesEndRef,
  } = useChatInterface();

  return (
    <div className="flex h-full flex-col desktop:flex-row desktop:gap-6">
      {/* Chat Messages Area */}
      <div className="flex flex-1 flex-col">
        <Card className="flex h-[600px] flex-col">
          <CardHeader className="border-b border-neutral-200">
            <CardTitle className="font-heading text-2xl">
              Ask CropSense
            </CardTitle>
            <CardDescription>
              Get expert farming guidance backed by trusted sources
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-6">
            {/* Empty State */}
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 text-6xl">🌱</div>
                <p className="text-lg text-neutral-600">
                  {emptyStateMessage}
                </p>
                <div className="mt-6 grid grid-cols-1 gap-3 tablet:grid-cols-2">
                  <button
                    className="rounded-md border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    onClick={() =>
                      setInput('When should I plant corn in the Midwest?')
                    }
                  >
                    When should I plant corn?
                  </button>
                  <button
                    className="rounded-md border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    onClick={() =>
                      setInput('How often should I irrigate soybeans?')
                    }
                  >
                    How to irrigate soybeans?
                  </button>
                  <button
                    className="rounded-md border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    onClick={() =>
                      setInput('What are signs of nitrogen deficiency?')
                    }
                  >
                    Signs of nitrogen deficiency?
                  </button>
                  <button
                    className="rounded-md border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    onClick={() =>
                      setInput('How to control corn borers?')
                    }
                  >
                    Pest control for corn?
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            <div
              className="space-y-4"
              role="log"
              aria-live="polite"
              aria-label="Chat messages"
            >
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex items-center space-x-2 text-neutral-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </CardContent>

          {/* Input Area */}
          <div className="border-t border-neutral-200 p-4">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <label htmlFor="chat-input" className="sr-only">
                Ask a question
              </label>
              <Input
                id="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholder}
                disabled={isLoading}
                className="flex-1"
                aria-label="Chat input"
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                size="icon"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>

      {/* Sources Panel (Desktop) */}
      {messages.length > 0 && (
        <div className="mt-6 desktop:mt-0 desktop:w-96">
          <SourcesPanel messages={messages} />
        </div>
      )}
    </div>
  );
}

/**
 * Message Bubble Component
 */
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      role="article"
      aria-label={`${isUser ? 'Your' : 'Assistant'} message`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-primary-500 text-neutral-white'
            : 'bg-neutral-100 text-neutral-900'
        }`}
      >
        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 space-y-1 border-t border-neutral-300 pt-3">
            <p className="text-xs font-medium opacity-75">Sources:</p>
            {message.sources.map((source, idx) => (
              <a
                key={source.id}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs underline opacity-90 hover:opacity-100"
              >
                [{idx + 1}] {source.title}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Sources Panel Component
 */
function SourcesPanel({ messages }: { messages: ChatMessage[] }) {
  // Get all sources from messages
  const allSources = messages
    .filter((m) => m.sources && m.sources.length > 0)
    .flatMap((m) => m.sources || []);

  // Remove duplicates by ID
  const uniqueSources = Array.from(
    new Map(allSources.map((s) => [s.id, s])).values()
  );

  if (uniqueSources.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Referenced Sources</CardTitle>
        <CardDescription>
          Trusted agricultural resources used in responses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {uniqueSources.map((source) => (
          <div
            key={source.id}
            className="rounded-lg border border-neutral-200 p-4"
          >
            <h4 className="mb-2 font-medium text-neutral-900">{source.title}</h4>
            <p className="mb-2 text-sm text-neutral-600">{source.snippet}</p>
            {source.url && (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary-600 hover:text-primary-700 hover:underline"
              >
                View source →
              </a>
            )}
            {source.relevanceScore !== undefined && (
              <div className="mt-2">
                <span className="text-xs text-neutral-500">
                  Relevance: {Math.round(source.relevanceScore * 100)}%
                </span>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

