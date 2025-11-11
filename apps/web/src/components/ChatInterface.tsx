import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, ExternalLink, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { api, type ChatMessage, type Source } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.chat.sendMessage({
        query: userMessage.content,
        conversationId,
      });

      setConversationId(response.conversationId);
      setMessages((prev) => [...prev, response.message]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[800px] bg-surface rounded-lg shadow-lg border border-neutral-200">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <AnimatePresence>
            {messages.map((message, index) => (
              <MessageBubble key={index} message={message} />
            ))}
          </AnimatePresence>
        )}
        {isLoading && <LoadingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-neutral-200 p-4 bg-neutral-50">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about crop management, pest control, soil health..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={!input.trim() || isLoading} className="flex-shrink-0">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

function EmptyState() {
  const suggestions = [
    'What are the best practices for tomato cultivation?',
    'How do I identify and treat common wheat diseases?',
    'What is the optimal planting time for corn in temperate climates?',
    'How can I improve soil health organically?',
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-12">
      <div className="mb-6 w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center">
        <BookOpen className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-text-primary mb-2">
        Ask CropSense Anything
      </h3>
      <p className="text-text-secondary mb-8 max-w-md">
        Get expert agricultural guidance backed by trusted resources. Try one of these questions:
      </p>
      <div className="grid gap-2 w-full max-w-lg">
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.02 }}
            className="p-3 text-left text-sm bg-white border border-neutral-200 rounded-md hover:border-primary hover:bg-primary-50 transition-colors"
            onClick={() => {
              const event = new CustomEvent('setSuggestion', { detail: suggestion });
              window.dispatchEvent(event);
            }}
          >
            {suggestion}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div
          className={`rounded-lg p-4 ${
            isUser
              ? 'bg-primary text-white'
              : 'bg-neutral-100 text-text-primary border border-neutral-200'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <div
          className={`mt-1 text-xs text-text-secondary ${isUser ? 'text-right' : 'text-left'}`}
        >
          {formatRelativeTime(message.createdAt)}
        </div>
        {!isUser && message.sources && message.sources.length > 0 && (
          <SourcesList sources={message.sources} />
        )}
      </div>
    </motion.div>
  );
}

function SourcesList({ sources }: { sources: Source[] }) {
  return (
    <Card className="mt-3 p-3 bg-surface">
      <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
        <BookOpen className="w-4 h-4" />
        Sources
      </h4>
      <ul className="space-y-2">
        {sources.map((source, index) => (
          <li key={index} className="text-xs">
            <a
              href={source.url || '#'}
              className="flex items-start gap-2 hover:text-primary transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">{source.title}</span>
                {source.pageNumber && (
                  <span className="text-text-secondary"> (Page {source.pageNumber})</span>
                )}
              </div>
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function LoadingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex justify-start"
    >
      <div className="bg-neutral-100 rounded-lg p-4 border border-neutral-200">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm text-text-secondary">Searching knowledge base...</span>
        </div>
      </div>
    </motion.div>
  );
}

