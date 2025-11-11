import { useEffect, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ChatMessage, Source } from '@/lib/api';

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messageData: ChatMessage[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            role: data.role as 'user' | 'assistant',
            content: data.content,
            sources: data.sources || [],
            createdAt: data.createdAt?.toDate() || new Date(),
          };
        });
        setMessages(messageData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching messages:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [conversationId]);

  const addMessage = async (
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    sources?: Source[]
  ) => {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    await addDoc(messagesRef, {
      role,
      content,
      sources: sources || [],
      createdAt: serverTimestamp(),
    });

    // Update conversation message count and updatedAt
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      messageCount: increment(1),
      updatedAt: serverTimestamp(),
      // Update title with first user message if it's still "New Conversation"
      ...(role === 'user' && {
        title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
      }),
    });
  };

  return {
    messages,
    loading,
    error,
    addMessage,
  };
}

