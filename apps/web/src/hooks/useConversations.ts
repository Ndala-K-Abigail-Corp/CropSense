import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const conversationData: Conversation[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId,
            title: data.title || 'New Conversation',
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            messageCount: data.messageCount || 0,
          };
        });
        setConversations(conversationData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching conversations:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const createConversation = async (title?: string): Promise<string> => {
    if (!user) throw new Error('User must be authenticated');

    const conversationsRef = collection(db, 'conversations');
    const docRef = await addDoc(conversationsRef, {
      userId: user.uid,
      title: title || 'New Conversation',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      messageCount: 0,
    });

    return docRef.id;
  };

  const updateConversation = async (
    conversationId: string,
    updates: { title?: string; messageCount?: number }
  ) => {
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  };

  const deleteConversation = async (conversationId: string) => {
    const conversationRef = doc(db, 'conversations', conversationId);
    await deleteDoc(conversationRef);
  };

  return {
    conversations,
    loading,
    error,
    createConversation,
    updateConversation,
    deleteConversation,
  };
}

