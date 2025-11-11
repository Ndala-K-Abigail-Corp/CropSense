import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChatInterface } from '@/components/ChatInterface';
import { ConversationList } from '@/components/ConversationList';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, TrendingUp, Clock, Menu, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useConversations } from '@/hooks/useConversations';

export function DashboardPage() {
  const { user } = useAuth();
  const { conversations } = useConversations();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setShowSidebar(false);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setShowSidebar(false);
  };

  const handleConversationCreated = (id: string) => {
    setActiveConversationId(id);
  };

  const totalMessages = conversations.reduce((sum, conv) => sum + conv.messageCount, 0);
  const memberSince = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'Recently';

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="h-full">
        {/* Header */}
        <div className="bg-white border-b border-neutral-200 px-4 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--cs-text)' }}>
                Welcome back, {user?.displayName || user?.email?.split('@')[0] || 'Farmer'}!
              </h1>
              <p className="text-sm text-neutral-600 mt-1">
                Ask your agricultural questions and get expert guidance instantly.
              </p>
            </motion.div>
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="lg:hidden p-2 rounded-lg hover:bg-neutral-100"
              aria-label="Toggle sidebar"
            >
              {showSidebar ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex h-[calc(100vh-10rem)]">
          {/* Sidebar - Conversation List */}
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            className={`
              ${showSidebar ? 'fixed inset-y-0 left-0 z-40' : 'hidden'}
              lg:relative lg:block
              w-80 bg-white border-r border-neutral-200
              lg:translate-x-0
            `}
          >
            {showSidebar && (
              <div
                className="fixed inset-0 bg-black/20 lg:hidden"
                onClick={() => setShowSidebar(false)}
              />
            )}
            <div className="relative z-50 h-full bg-white">
              <ConversationList
                activeConversationId={activeConversationId}
                onSelectConversation={handleSelectConversation}
                onNewConversation={handleNewConversation}
              />
            </div>
          </motion.div>

          {/* Chat Interface */}
          <div className="flex-1 flex flex-col lg:flex-row gap-6 p-4 lg:p-8 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex-1 min-h-0"
            >
              <ChatInterface
                conversationId={activeConversationId}
                onConversationCreated={handleConversationCreated}
              />
            </motion.div>

            {/* Stats Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="hidden xl:block w-80 space-y-4"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" style={{ color: 'var(--cs-primary)' }} />
                    Quick Stats
                  </CardTitle>
                  <CardDescription>Your CropSense activity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <StatItem
                    icon={<MessageSquare className="w-4 h-4" />}
                    label="Total Messages"
                    value={totalMessages.toString()}
                  />
                  <StatItem
                    icon={<TrendingUp className="w-4 h-4" />}
                    label="Conversations"
                    value={conversations.length.toString()}
                  />
                  <StatItem
                    icon={<Clock className="w-4 h-4" />}
                    label="Member Since"
                    value={memberSince}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tips for Better Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-neutral-600">
                    <li className="flex items-start gap-2">
                      <span style={{ color: 'var(--cs-primary)' }}>•</span>
                      <span>Be specific about your crop type and location</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span style={{ color: 'var(--cs-primary)' }}>•</span>
                      <span>Describe symptoms or conditions in detail</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span style={{ color: 'var(--cs-primary)' }}>•</span>
                      <span>Ask follow-up questions for clarification</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span style={{ color: 'var(--cs-primary)' }}>•</span>
                      <span>Check cited sources for more information</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="text-primary">{icon}</div>
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
      <span className="font-semibold text-text-primary">{value}</span>
    </div>
  );
}

