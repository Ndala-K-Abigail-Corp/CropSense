import { motion } from 'framer-motion';
import { ChatInterface } from '@/components/ChatInterface';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Welcome back, {user?.email?.split('@')[0] || 'Farmer'}!
          </h1>
          <p className="text-text-secondary">
            Ask your agricultural questions and get expert guidance instantly.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chat Interface */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <ChatInterface />
          </motion.div>

          {/* Sidebar with stats and info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Quick Stats
                </CardTitle>
                <CardDescription>Your CropSense activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <StatItem icon={<MessageSquare />} label="Questions Asked" value="0" />
                <StatItem icon={<TrendingUp />} label="Topics Explored" value="0" />
                <StatItem icon={<Clock />} label="Member Since" value="Today" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tips for Better Results</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Be specific about your crop type and location</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Describe symptoms or conditions in detail</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Ask follow-up questions for clarification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Check cited sources for more information</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
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

