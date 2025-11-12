import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMessages } from '../useMessages';

// Mock Firestore
vi.mock('@/lib/firebase', () => ({
  db: {},
}));

const mockOnSnapshot = vi.fn();
const mockAddDoc = vi.fn();
const mockUpdateDoc = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: mockOnSnapshot,
  addDoc: mockAddDoc,
  serverTimestamp: vi.fn(() => ({ seconds: Date.now() / 1000 })),
  doc: vi.fn(),
  updateDoc: mockUpdateDoc,
  increment: vi.fn((val) => val),
}));

describe('useMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSnapshot.mockImplementation((q, callback) => {
      callback({ docs: [] });
      return vi.fn(); // unsubscribe function
    });
  });

  it('returns empty messages when conversationId is null', async () => {
    const { result } = renderHook(() => useMessages(null));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('subscribes to messages when conversationId is provided', async () => {
    mockOnSnapshot.mockImplementation((q, callback) => {
      callback({
        docs: [
          {
            data: () => ({
              role: 'user',
              content: 'Hello',
              sources: [],
              createdAt: { toDate: () => new Date('2024-01-01') },
            }),
          },
        ],
      });
      return vi.fn();
    });

    const { result } = renderHook(() => useMessages('conv-123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toMatchObject({
      role: 'user',
      content: 'Hello',
    });
  });

  it('handles errors gracefully', async () => {
    const error = new Error('Firestore error');
    mockOnSnapshot.mockImplementation((q, callback, errorCallback) => {
      errorCallback(error);
      return vi.fn();
    });

    const { result } = renderHook(() => useMessages('conv-123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
  });

  it('addMessage creates a message and updates conversation', async () => {
    mockAddDoc.mockResolvedValue({ id: 'msg-123' });
    mockUpdateDoc.mockResolvedValue(undefined);

    const { result } = renderHook(() => useMessages('conv-123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.addMessage('conv-123', 'user', 'Test message');

    expect(mockAddDoc).toHaveBeenCalled();
    expect(mockUpdateDoc).toHaveBeenCalled();
  });
});

