import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInterface } from '../ChatInterface';

// Mock dependencies
vi.mock('@/hooks/useMessages', () => ({
  useMessages: vi.fn(() => ({
    messages: [],
    loading: false,
    error: null,
    addMessage: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('@/hooks/useConversations', () => ({
  useConversations: vi.fn(() => ({
    createConversation: vi.fn().mockResolvedValue('conv-123'),
  })),
}));

vi.mock('@/lib/api', () => ({
  api: {
    chat: {
      sendMessage: vi.fn().mockResolvedValue({
        message: {
          role: 'assistant',
          content: 'This is a test response about tomatoes.',
          sources: [
            {
              documentId: 'doc-1',
              title: 'Tomato Growing Guide',
              pageNumber: 5,
              excerpt: 'Plant tomatoes in well-drained soil...',
              url: 'https://example.com/guide.pdf',
            },
          ],
          createdAt: new Date(),
        },
      }),
    },
  },
}));

import { useMessages } from '@/hooks/useMessages';
import { useConversations } from '@/hooks/useConversations';
import { api } from '@/lib/api';

describe('ChatInterface', () => {
  const mockAddMessage = vi.fn().mockResolvedValue(undefined);
  const mockCreateConversation = vi.fn().mockResolvedValue('conv-123');

  beforeEach(() => {
    vi.clearAllMocks();
    (useMessages as any).mockReturnValue({
      messages: [],
      loading: false,
      error: null,
      addMessage: mockAddMessage,
    });
    (useConversations as any).mockReturnValue({
      createConversation: mockCreateConversation,
    });
  });

  describe('Initial State', () => {
    it('renders empty state when no messages', () => {
      render(<ChatInterface conversationId={null} />);
      
      expect(screen.getByText('Ask CropSense Anything')).toBeInTheDocument();
      expect(screen.getByText(/Get expert agricultural guidance/i)).toBeInTheDocument();
    });

    it('renders suggestion buttons in empty state', () => {
      render(<ChatInterface conversationId={null} />);
      
      expect(screen.getByText(/best practices for tomato cultivation/i)).toBeInTheDocument();
      expect(screen.getByText(/identify and treat common wheat diseases/i)).toBeInTheDocument();
    });

    it('renders input field and send button', () => {
      render(<ChatInterface conversationId={null} />);
      
      const input = screen.getByPlaceholderText(/Ask about crop management/i);
      expect(input).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });
  });

  describe('Message Display', () => {
    it('displays existing messages', () => {
      (useMessages as any).mockReturnValue({
        messages: [
          {
            role: 'user',
            content: 'How do I grow tomatoes?',
            createdAt: new Date('2024-01-01'),
          },
          {
            role: 'assistant',
            content: 'To grow tomatoes, you need well-drained soil...',
            createdAt: new Date('2024-01-01'),
            sources: [],
          },
        ],
        loading: false,
        error: null,
        addMessage: mockAddMessage,
      });

      render(<ChatInterface conversationId="conv-123" />);

      expect(screen.getByText('How do I grow tomatoes?')).toBeInTheDocument();
      expect(screen.getByText(/To grow tomatoes, you need well-drained soil/i)).toBeInTheDocument();
    });

    it('displays sources when available', () => {
      (useMessages as any).mockReturnValue({
        messages: [
          {
            role: 'assistant',
            content: 'Tomato growing tips...',
            createdAt: new Date('2024-01-01'),
            sources: [
              {
                title: 'Tomato Guide',
                pageNumber: 5,
                url: 'https://example.com/guide.pdf',
              },
            ],
          },
        ],
        loading: false,
        error: null,
        addMessage: mockAddMessage,
      });

      render(<ChatInterface conversationId="conv-123" />);

      expect(screen.getByText('Sources')).toBeInTheDocument();
      expect(screen.getByText('Tomato Guide')).toBeInTheDocument();
      expect(screen.getByText(/Page 5/i)).toBeInTheDocument();
    });

    it('shows loading indicator when messages are loading', () => {
      (useMessages as any).mockReturnValue({
        messages: [],
        loading: true,
        error: null,
        addMessage: mockAddMessage,
      });

      render(<ChatInterface conversationId="conv-123" />);

      // Look for loading spinner (Loader2 icon)
      const loader = document.querySelector('.animate-spin');
      expect(loader).toBeInTheDocument();
    });
  });

  describe('Sending Messages', () => {
    it('sends a message when form is submitted', async () => {
      const user = userEvent.setup();
      render(<ChatInterface conversationId="conv-123" />);

      const input = screen.getByPlaceholderText(/Ask about crop management/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'How do I prevent tomato blight?');
      await user.click(sendButton);

      await waitFor(() => {
        expect(mockAddMessage).toHaveBeenCalledWith(
          'conv-123',
          'user',
          'How do I prevent tomato blight?'
        );
      });
    });

    it('creates new conversation if none exists', async () => {
      const user = userEvent.setup();
      const mockOnConversationCreated = vi.fn();
      
      render(
        <ChatInterface 
          conversationId={null} 
          onConversationCreated={mockOnConversationCreated}
        />
      );

      const input = screen.getByPlaceholderText(/Ask about crop management/i);
      await user.type(input, 'Test question');
      await user.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        expect(mockCreateConversation).toHaveBeenCalled();
        expect(mockOnConversationCreated).toHaveBeenCalledWith('conv-123');
      });
    });

    it('disables input while sending', async () => {
      const user = userEvent.setup();
      render(<ChatInterface conversationId="conv-123" />);

      const input = screen.getByPlaceholderText(/Ask about crop management/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Test question');
      
      // Mock slow API response
      (api.chat.sendMessage as any).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      await user.click(sendButton);

      // Input should be disabled immediately
      expect(input).toBeDisabled();
      expect(sendButton).toBeDisabled();
    });

    it('clears input after sending message', async () => {
      const user = userEvent.setup();
      render(<ChatInterface conversationId="conv-123" />);

      const input = screen.getByPlaceholderText(/Ask about crop management/i) as HTMLInputElement;
      await user.type(input, 'Test question');
      await user.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('does not send empty messages', async () => {
      const user = userEvent.setup();
      render(<ChatInterface conversationId="conv-123" />);

      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeDisabled();

      const input = screen.getByPlaceholderText(/Ask about crop management/i);
      await user.type(input, '   '); // Only whitespace
      
      expect(sendButton).toBeDisabled();
      await user.click(sendButton);
      
      expect(mockAddMessage).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when send fails', async () => {
      const user = userEvent.setup();
      (api.chat.sendMessage as any).mockRejectedValueOnce(new Error('Network error'));
      
      render(<ChatInterface conversationId="conv-123" />);

      const input = screen.getByPlaceholderText(/Ask about crop management/i);
      await user.type(input, 'Test question');
      await user.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        expect(mockAddMessage).toHaveBeenCalledWith(
          'conv-123',
          'assistant',
          'Sorry, I encountered an error. Please try again.'
        );
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading indicator when sending message', async () => {
      const user = userEvent.setup();
      (api.chat.sendMessage as any).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );
      
      render(<ChatInterface conversationId="conv-123" />);

      const input = screen.getByPlaceholderText(/Ask about crop management/i);
      await user.type(input, 'Test question');
      await user.click(screen.getByRole('button', { name: /send/i }));

      // Should show loading indicator
      await waitFor(() => {
        expect(screen.getByText(/Searching knowledge base/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('form can be submitted with Enter key', async () => {
      const user = userEvent.setup();
      render(<ChatInterface conversationId="conv-123" />);

      const input = screen.getByPlaceholderText(/Ask about crop management/i);
      await user.type(input, 'Test question{Enter}');

      await waitFor(() => {
        expect(mockAddMessage).toHaveBeenCalled();
      });
    });

    it('has proper ARIA labels', () => {
      render(<ChatInterface conversationId="conv-123" />);

      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeInTheDocument();
    });
  });
});

