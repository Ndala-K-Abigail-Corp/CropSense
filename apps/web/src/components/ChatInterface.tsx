import { useState, useRef, useEffect, memo, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Loader2, ExternalLink, BookOpen, Menu, Sparkles, User, Bot, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { api, type ChatMessage, type Source } from '@/lib/api';
import { useMessages } from '@/hooks/useMessages';
import { useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/contexts/AuthContext';
import { ChatSidebar } from './ChatSidebar';

interface ChatInterfaceProps {
  conversationId: string | null;
  onConversationCreated?: (id: string) => void;
  onSelectConversation?: (id: string | null) => void;
}

export function ChatInterface({ conversationId, onConversationCreated, onSelectConversation }: ChatInterfaceProps) {
  const { messages, loading: messagesLoading, addMessage } = useMessages(conversationId);
  const { createConversation } = useConversations();
  const { user, logout } = useAuth();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = useMemo(() => [
    'What are the best practices for tomato cultivation?',
    'How do I identify and treat common wheat diseases?',
    'What is the optimal planting time for corn in temperate climates?',
    'How can I improve soil health organically?',
  ], []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessageContent = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      let currentConversationId = conversationId;

      // Create new conversation if needed
      if (!currentConversationId) {
        currentConversationId = await createConversation();
        onConversationCreated?.(currentConversationId);
      }

      // Add user message to Firestore
      await addMessage(currentConversationId, 'user', userMessageContent);

      // Get AI response from backend
      const response = await api.chat.sendMessage({
        query: userMessageContent,
        conversationId: currentConversationId,
      });

      // Add assistant message to Firestore
      await addMessage(
        currentConversationId,
        'assistant',
        response.message.content,
        response.message.sources
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      // Add error message to current conversation if it exists
      if (conversationId) {
        await addMessage(
          conversationId,
          'assistant',
          'Sorry, I encountered an error. Please try again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, input, isLoading, createConversation, onConversationCreated, addMessage]);

  const handleSuggestedQuestion = useCallback((question: string) => {
    setInput(question);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const formatTime = useCallback((date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  }, []);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Desktop Sidebar */}
      <aside className="hidden w-80 border-r border-neutral-200 bg-white lg:block">
        <ChatSidebar
          activeConversationId={conversationId}
          onSelectConversation={(id) => {
            onSelectConversation?.(id);
          }}
          onNewConversation={async () => {
            const newId = await createConversation();
            onConversationCreated?.(newId);
            onSelectConversation?.(newId);
          }}
        />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <ChatSidebar
            activeConversationId={conversationId}
            onSelectConversation={(id) => {
              setSidebarOpen(false);
              onSelectConversation?.(id);
            }}
            onNewConversation={async () => {
              setSidebarOpen(false);
              const newId = await createConversation();
              onConversationCreated?.(newId);
              onSelectConversation?.(newId);
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Main Chat Area */}
      <main className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-neutral-900">
                CropSense AI Assistant
              </h1>
              <p className="text-xs text-neutral-500">
                Ask your agricultural questions
              </p>
            </div>
          </div>
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Avatar>
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Messages Area */}
        <ScrollArea className="flex-1">
          <div className="mx-auto max-w-4xl px-4 py-6">
            {messagesLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <EmptyState 
                onSelectQuestion={handleSuggestedQuestion} 
                suggestions={suggestedQuestions}
                userName={user?.displayName || user?.email?.split('@')[0] || 'Farmer'}
              />
            ) : (
              <div className="space-y-6">
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <MessageBubble key={index} message={message} formatTime={formatTime} />
                  ))}
                </AnimatePresence>
                {isLoading && <LoadingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-neutral-200 bg-white p-4">
          <form onSubmit={handleSubmit} className="mx-auto max-w-4xl">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about crops, pests, soil, irrigation, or any farming topic..."
                className="min-h-[60px] max-h-[200px] resize-none flex-1 rounded-xl"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="lg"
                className="h-[60px] w-[60px] shrink-0 rounded-xl bg-primary text-white hover:bg-primary-600"
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              Press <kbd className="rounded bg-neutral-100 px-1">Enter</kbd> to send,{' '}
              <kbd className="rounded bg-neutral-100 px-1">Shift + Enter</kbd> for new line
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}

const EmptyState = memo(function EmptyState({
  onSelectQuestion,
  suggestions,
  userName,
}: {
  onSelectQuestion: (question: string) => void;
  suggestions: string[];
  userName: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
        <Sparkles className="h-10 w-10 text-primary" />
      </div>
      <h2 className="mb-2 text-2xl font-semibold text-neutral-900">
        Welcome to CropSense AI{userName && `, ${userName}`}
      </h2>
      <p className="mb-8 text-center text-neutral-600">
        Ask your agricultural questions and get expert guidance instantly
      </p>

      <div className="w-full max-w-2xl">
        <p className="mb-4 text-sm text-neutral-500">
          Try one of these questions:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {suggestions.map((question, index) => (
            <button
              key={index}
              onClick={() => onSelectQuestion(question)}
              className="group rounded-xl border border-primary/20 bg-white p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 shrink-0 rounded-lg bg-primary/10 p-2 transition-colors group-hover:bg-primary/20">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm text-neutral-900">{question}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

const MessageBubble = memo(function MessageBubble({
  message,
  formatTime,
}: {
  message: ChatMessage;
  formatTime: (date: Date) => string;
}) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {message.role === 'assistant' && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-primary text-white'
            : 'border border-neutral-200 bg-white'
        }`}
      >
        <div className={`break-words text-sm ${
          isUser ? 'text-white' : 'text-neutral-900'
        }`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
              h2: ({ children }) => <h2 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h2>,
              h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-2 first:mt-0">{children}</h3>,
              ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="ml-2">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
              code: ({ children }) => (
                <code className={`px-1 py-0.5 rounded text-xs font-mono ${
                  isUser 
                    ? 'bg-white/20 text-white' 
                    : 'bg-neutral-100 text-neutral-800'
                }`}>
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className={`p-2 rounded text-xs font-mono overflow-x-auto mb-2 ${
                  isUser 
                    ? 'bg-white/20 text-white' 
                    : 'bg-neutral-100 text-neutral-800'
                }`}>
                  {children}
                </pre>
              ),
              blockquote: ({ children }) => (
                <blockquote className={`border-l-4 pl-3 my-2 ${
                  isUser 
                    ? 'border-white/30' 
                    : 'border-neutral-300'
                }`}>
                  {children}
                </blockquote>
              ),
              a: ({ href, children }) => (
                <a 
                  href={href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`underline hover:opacity-80 ${
                    isUser ? 'text-white' : 'text-primary'
                  }`}
                >
                  {children}
                </a>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        <div
          className={`mt-2 text-xs ${
            isUser ? 'text-white/70' : 'text-neutral-500'
          }`}
        >
          {formatTime(message.createdAt)}
        </div>
        {!isUser && message.sources && message.sources.length > 0 && (
          <SourcesList sources={message.sources} />
        )}
      </div>
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
          <User className="h-4 w-4 text-neutral-600" />
        </div>
      )}
    </motion.div>
  );
});

const SourcesList = memo(function SourcesList({ sources }: { sources: Source[] }) {
  return (
    <Card className="mt-3 p-3 bg-neutral-50">
      <h4 className="text-sm font-semibold text-neutral-900 mb-2 flex items-center gap-2">
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
                  <span className="text-neutral-500"> (Page {source.pageNumber})</span>
                )}
              </div>
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
});

const LoadingIndicator = memo(function LoadingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex gap-3"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    </motion.div>
  );
});
