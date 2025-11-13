import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useConversations } from '../useConversations';

// Mock Firestore
vi.mock('@/lib/firebase', () => ({
  db: {},
}));

const mockOnSnapshot = vi.fn();
const mockAddDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  onSnapshot: mockOnSnapshot,
  addDoc: mockAddDoc,
  serverTimestamp: vi.fn(() => ({ seconds: Date.now() / 1000 })),
  doc: vi.fn(),
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
}));

// Mock auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { uid: 'test-user-123' },
  })),
}));

describe('useConversations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSnapshot.mockImplementation((q, callback) => {
      callback({ docs: [] });
      return vi.fn(); // unsubscribe function
    });
  });

  describe('Initialization', () => {
    it('returns empty conversations initially', async () => {
      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.conversations).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('subscribes to conversations for authenticated user', async () => {
      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockOnSnapshot).toHaveBeenCalled();
    });
  });

  describe('Loading Conversations', () => {
    it('loads conversations from Firestore', async () => {
      mockOnSnapshot.mockImplementation((q, callback) => {
        callback({
          docs: [
            {
              id: 'conv-1',
              data: () => ({
                userId: 'test-user-123',
                title: 'Tomato Growing',
                createdAt: { toDate: () => new Date('2024-01-01') },
                updatedAt: { toDate: () => new Date('2024-01-02') },
                messageCount: 5,
              }),
            },
            {
              id: 'conv-2',
              data: () => ({
                userId: 'test-user-123',
                title: 'Wheat Diseases',
                createdAt: { toDate: () => new Date('2024-01-03') },
                updatedAt: { toDate: () => new Date('2024-01-04') },
                messageCount: 3,
              }),
            },
          ],
        });
        return vi.fn();
      });

      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.conversations).toHaveLength(2);
      expect(result.current.conversations[0]).toMatchObject({
        id: 'conv-1',
        title: 'Tomato Growing',
        messageCount: 5,
      });
      expect(result.current.conversations[1]).toMatchObject({
        id: 'conv-2',
        title: 'Wheat Diseases',
        messageCount: 3,
      });
    });

    it('handles conversations without titles', async () => {
      mockOnSnapshot.mockImplementation((q, callback) => {
        callback({
          docs: [
            {
              id: 'conv-1',
              data: () => ({
                userId: 'test-user-123',
                createdAt: { toDate: () => new Date('2024-01-01') },
                updatedAt: { toDate: () => new Date('2024-01-02') },
                messageCount: 2,
              }),
            },
          ],
        });
        return vi.fn();
      });

      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.conversations[0].title).toBeUndefined();
    });
  });

  describe('Creating Conversations', () => {
    it('creates a new conversation', async () => {
      mockAddDoc.mockResolvedValue({ id: 'new-conv-123' });

      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const conversationId = await result.current.createConversation('My New Conversation');

      expect(mockAddDoc).toHaveBeenCalled();
      expect(conversationId).toBe('new-conv-123');
    });

    it('creates conversation without title', async () => {
      mockAddDoc.mockResolvedValue({ id: 'new-conv-456' });

      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const conversationId = await result.current.createConversation();

      expect(mockAddDoc).toHaveBeenCalled();
      expect(conversationId).toBe('new-conv-456');
    });

    it('includes userId in created conversation', async () => {
      mockAddDoc.mockResolvedValue({ id: 'new-conv-789' });

      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.createConversation('Test Conversation');

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'test-user-123',
          title: 'Test Conversation',
          messageCount: 0,
        })
      );
    });
  });

  describe('Updating Conversations', () => {
    it('updates conversation title', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.updateConversation('conv-123', { title: 'Updated Title' });

      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    it('updates conversation metadata', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.updateConversation('conv-123', { 
        title: 'New Title',
        messageCount: 10,
      });

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          title: 'New Title',
          messageCount: 10,
        })
      );
    });
  });

  describe('Deleting Conversations', () => {
    it('deletes a conversation', async () => {
      mockDeleteDoc.mockResolvedValue(undefined);

      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.deleteConversation('conv-to-delete');

      expect(mockDeleteDoc).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles Firestore errors gracefully', async () => {
      const error = new Error('Firestore error');
      mockOnSnapshot.mockImplementation((q, callback, errorCallback) => {
        errorCallback(error);
        return vi.fn();
      });

      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.conversations).toEqual([]);
    });

    it('handles creation errors', async () => {
      mockAddDoc.mockRejectedValue(new Error('Creation failed'));

      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.createConversation('Test')).rejects.toThrow();
    });

    it('handles update errors', async () => {
      mockUpdateDoc.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.updateConversation('conv-123', { title: 'New' })
      ).rejects.toThrow();
    });

    it('handles deletion errors', async () => {
      mockDeleteDoc.mockRejectedValue(new Error('Deletion failed'));

      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.deleteConversation('conv-123')).rejects.toThrow();
    });
  });

  describe('Real-time Updates', () => {
    it('updates conversations when Firestore data changes', async () => {
      let snapshotCallback: any;
      mockOnSnapshot.mockImplementation((q, callback) => {
        snapshotCallback = callback;
        callback({ docs: [] }); // Initial empty state
        return vi.fn();
      });

      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Simulate Firestore update
      snapshotCallback({
        docs: [
          {
            id: 'conv-new',
            data: () => ({
              userId: 'test-user-123',
              title: 'New Conversation',
              createdAt: { toDate: () => new Date() },
              updatedAt: { toDate: () => new Date() },
              messageCount: 1,
            }),
          },
        ],
      });

      await waitFor(() => {
        expect(result.current.conversations).toHaveLength(1);
      });

      expect(result.current.conversations[0].title).toBe('New Conversation');
    });
  });

  describe('Cleanup', () => {
    it('unsubscribes on unmount', async () => {
      const mockUnsubscribe = vi.fn();
      mockOnSnapshot.mockImplementation((q, callback) => {
        callback({ docs: [] });
        return mockUnsubscribe;
      });

      const { unmount } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(mockOnSnapshot).toHaveBeenCalled();
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});


