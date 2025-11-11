import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Sprout, MessageSquare, BookOpen, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function HeroSection() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCTA = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-surface to-secondary-100 opacity-50" />

      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-200 rounded-pill mb-6"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary-700">
              AI-Powered Agricultural Guidance
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-6xl font-bold text-text-primary mb-6 leading-tight"
          >
            Grow Smarter with{' '}
            <span className="text-primary bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
              CropSense
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl text-text-secondary mb-8 max-w-2xl mx-auto"
          >
            Get instant, evidence-based answers to your farming questions. Powered by trusted
            agricultural resources and advanced AI.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Button size="lg" onClick={handleCTA} className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {user ? 'Go to Dashboard' : 'Start Asking Questions'}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/how-it-works')}
              className="flex items-center gap-2"
            >
              <BookOpen className="w-5 h-5" />
              Learn How It Works
            </Button>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16"
          >
            <FeatureCard
              icon={<Sprout className="w-8 h-8 text-primary" />}
              title="Expert Knowledge"
              description="Answers grounded in trusted agricultural resources and best practices"
            />
            <FeatureCard
              icon={<MessageSquare className="w-8 h-8 text-primary" />}
              title="Instant Guidance"
              description="Get immediate, context-aware responses tailored to your needs"
            />
            <FeatureCard
              icon={<BookOpen className="w-8 h-8 text-primary" />}
              title="Cited Sources"
              description="Every answer includes references to original documentation"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="card bg-surface/80 backdrop-blur-sm border border-neutral-200"
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-4">{icon}</div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>
    </motion.div>
  );
}

