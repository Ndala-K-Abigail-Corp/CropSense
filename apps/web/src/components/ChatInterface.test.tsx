/**
 * ChatInterface Component Tests
 * TDD §7: Unit/component testing with Vitest + Testing Library
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInterface } from './ChatInterface';
import { RegionCropContextProvider } from '@/hooks/useRegionCropContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';

// Mock tRPC client
vi.mock('@/lib/trpc', () => ({
  trpc: {
    chat: {
      query: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn(),
          isLoading: false,
        })),
      },
    },
  },
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <RegionCropContextProvider>{children}</RegionCropContextProvider>
    </QueryClientProvider>
  );
};

describe('ChatInterface', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no messages', () => {
    render(<ChatInterface />, { wrapper: Wrapper });

    expect(
      screen.getByText('Start by asking a question about farming practices')
    ).toBeInTheDocument();
  });

  it('renders input field and send button', () => {
    render(<ChatInterface />, { wrapper: Wrapper });

    expect(screen.getByLabelText('Chat input')).toBeInTheDocument();
    expect(screen.getByLabelText('Send message')).toBeInTheDocument();
  });

  it('displays custom placeholder text', () => {
    render(
      <ChatInterface placeholder="Type your farming question here..." />,
      { wrapper: Wrapper }
    );

    expect(
      screen.getByPlaceholderText('Type your farming question here...')
    ).toBeInTheDocument();
  });

  it('has accessible labels for screen readers', () => {
    render(<ChatInterface />, { wrapper: Wrapper });

    expect(screen.getByLabelText('Ask a question')).toBeInTheDocument();
    expect(screen.getByLabelText('Chat messages')).toBeInTheDocument();
  });

  it('updates input value when typing', async () => {
    const user = userEvent.setup();
    render(<ChatInterface />, { wrapper: Wrapper });

    const input = screen.getByLabelText('Chat input');
    await user.type(input, 'When to plant corn?');

    expect(input).toHaveValue('When to plant corn?');
  });

  it('disables send button when input is empty', () => {
    render(<ChatInterface />, { wrapper: Wrapper });

    const sendButton = screen.getByLabelText('Send message');
    expect(sendButton).toBeDisabled();
  });

  it('enables send button when input has text', async () => {
    const user = userEvent.setup();
    render(<ChatInterface />, { wrapper: Wrapper });

    const input = screen.getByLabelText('Chat input');
    await user.type(input, 'Test question');

    const sendButton = screen.getByLabelText('Send message');
    expect(sendButton).not.toBeDisabled();
  });

  it('displays suggestion buttons in empty state', () => {
    render(<ChatInterface />, { wrapper: Wrapper });

    expect(screen.getByText('When should I plant corn?')).toBeInTheDocument();
    expect(screen.getByText('How to irrigate soybeans?')).toBeInTheDocument();
    expect(
      screen.getByText('Signs of nitrogen deficiency?')
    ).toBeInTheDocument();
  });

  it('fills input when suggestion is clicked', async () => {
    const user = userEvent.setup();
    render(<ChatInterface />, { wrapper: Wrapper });

    const suggestion = screen.getByText('When should I plant corn?');
    await user.click(suggestion);

    const input = screen.getByLabelText('Chat input');
    expect(input).toHaveValue('When should I plant corn in the Midwest?');
  });

  it('has proper ARIA live region for messages', () => {
    render(<ChatInterface />, { wrapper: Wrapper });

    const messageLog = screen.getByRole('log');
    expect(messageLog).toHaveAttribute('aria-live', 'polite');
    expect(messageLog).toHaveAttribute('aria-label', 'Chat messages');
  });
});

