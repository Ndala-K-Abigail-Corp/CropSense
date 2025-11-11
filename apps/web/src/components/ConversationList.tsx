import { motion } from 'framer-motion';
import { MessageSquare, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useConversations } from '@/hooks/useConversations';
import { formatRelativeTime } from '@/lib/utils';

interface ConversationListProps {
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}

export function ConversationList({
  activeConversationId,
  onSelectConversation,
  onNewConversation,
}: ConversationListProps) {
  const { conversations, loading, deleteConversation } = useConversations();

  const handleDelete = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      try {
        await deleteConversation(conversationId);
        if (activeConversationId === conversationId) {
          onNewConversation();
        }
      } catch (error) {
        console.error('Failed to delete conversation:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200">
        <Button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2"
          size="sm"
        >
          <Plus className="w-4 h-4" />
          New Conversation
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-6 text-center text-neutral-500 text-sm">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No conversations yet</p>
            <p className="text-xs mt-1">Start a new chat to begin</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {conversations.map((conversation) => (
              <motion.button
                key={conversation.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={() => onSelectConversation(conversation.id)}
                className={`
                  w-full text-left p-3 rounded-lg transition-colors group
                  ${
                    activeConversationId === conversation.id
                      ? 'bg-primary text-white'
                      : 'hover:bg-neutral-100'
                  }
                `}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="w-4 h-4 flex-shrink-0" />
                      <p className="font-medium text-sm truncate">{conversation.title}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs opacity-75">
                      <span>{conversation.messageCount} messages</span>
                      <span>•</span>
                      <span>{formatRelativeTime(conversation.updatedAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, conversation.id)}
                    className={`
                      p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity
                      ${activeConversationId === conversation.id ? 'hover:bg-primary-600' : 'hover:bg-neutral-200'}
                    `}
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

