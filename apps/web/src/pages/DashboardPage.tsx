import { useState } from 'react';
import { ChatInterface } from '@/components/ChatInterface';

export function DashboardPage() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const handleConversationCreated = (id: string) => {
    setActiveConversationId(id);
  };

  const handleSelectConversation = (id: string | null) => {
    setActiveConversationId(id);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <ChatInterface
        conversationId={activeConversationId}
        onConversationCreated={handleConversationCreated}
        onSelectConversation={handleSelectConversation}
      />
    </div>
  );
}

