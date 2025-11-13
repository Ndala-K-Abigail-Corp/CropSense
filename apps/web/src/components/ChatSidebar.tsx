import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { useConversations, type Conversation } from '@/hooks/useConversations';
import { formatRelativeTime } from '@/lib/utils';

interface ChatSidebarProps {
  activeConversationId: string | null;
  onSelectConversation: (id: string | null) => void;
  onNewConversation: () => void;
  onDeleteConversation?: (id: string) => void;
}

export function ChatSidebar({
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: ChatSidebarProps) {
  const { conversations, deleteConversation, loading } = useConversations();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteConversation) {
      onDeleteConversation(id);
    } else {
      await deleteConversation(id);
      if (activeConversationId === id) {
        onSelectConversation(null);
      }
    }
  };

  return (
    <div className="flex h-full w-80 flex-col border-r border-neutral-200 bg-white">
      {/* Header */}
      <div className="border-b border-neutral-200 p-4">
        <Button
          onClick={onNewConversation}
          className="w-full gap-2 bg-primary text-white hover:bg-primary-600"
        >
          <Plus className="h-4 w-4" />
          New Conversation
        </Button>
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1 px-2 py-4">
        <div className="space-y-2">
          {loading ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-neutral-500">Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <MessageSquare className="mx-auto mb-2 h-8 w-8 text-neutral-400" />
              <p className="text-sm text-neutral-500">No conversations yet</p>
              <p className="text-xs text-neutral-400 mt-1">Start a new one to begin</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group relative rounded-lg border transition-all ${
                  activeConversationId === conv.id
                    ? 'border-primary bg-primary-50'
                    : 'border-transparent bg-white hover:bg-neutral-50'
                }`}
                onMouseEnter={() => setHoveredId(conv.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <button
                  onClick={() => onSelectConversation(conv.id)}
                  className="w-full p-3 text-left"
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-sm font-medium text-neutral-900">
                      {conv.title}
                    </h3>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs text-neutral-500">
                    <span>{conv.messageCount} messages</span>
                    <span>·</span>
                    <span>{formatRelativeTime(conv.updatedAt)}</span>
                  </div>
                </button>
                {(hoveredId === conv.id || activeConversationId === conv.id) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDelete(conv.id, e)}
                    className="absolute right-2 top-2 h-7 w-7 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

