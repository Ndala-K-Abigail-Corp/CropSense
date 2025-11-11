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
    <section className="relative py-16 md:py-24 lg:py-32 overflow-hidden bg-gradient-to-b from-white to-neutral-50">
      {/* Background decoration with organic shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: 'var(--cs-accent)' }}
        />
        <div 
          className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: 'var(--cs-primary)' }}
        />
      </div>

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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-pill mb-8 shadow-sm"
            style={{ 
              backgroundColor: 'rgba(139, 195, 74, 0.1)',
              border: '1px solid rgba(139, 195, 74, 0.3)'
            }}
          >
            <Sparkles className="w-4 h-4" style={{ color: 'var(--cs-primary)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--cs-primary)' }}>
              AI-Powered Agricultural Guidance
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
            style={{ color: 'var(--cs-text)' }}
          >
            Grow Smarter with{' '}
            <span 
              className="relative inline-block"
              style={{ color: 'var(--cs-primary)' }}
            >
              CropSense
              <svg 
                className="absolute -bottom-2 left-0 w-full" 
                height="12" 
                viewBox="0 0 200 12" 
                fill="none"
                style={{ opacity: 0.3 }}
              >
                <path 
                  d="M2 10C50 2 150 2 198 10" 
                  stroke="currentColor" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl text-neutral-600 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Get instant, evidence-based answers to your farming questions. Powered by trusted
            agricultural resources and advanced AI technology.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Button 
              size="lg" 
              onClick={handleCTA} 
              className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow px-8 py-4"
            >
              <MessageSquare className="w-5 h-5" />
              {user ? 'Go to Dashboard' : 'Start Asking Questions'}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/how-it-works')}
              className="flex items-center gap-2 border-2 px-8 py-4"
              style={{ borderColor: 'var(--cs-primary)', color: 'var(--cs-primary)' }}
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
            className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
          >
            <FeatureCard
              icon={<Sprout className="w-8 h-8" style={{ color: 'var(--cs-primary)' }} />}
              title="Expert Knowledge"
              description="Answers grounded in trusted agricultural resources and best practices"
            />
            <FeatureCard
              icon={<MessageSquare className="w-8 h-8" style={{ color: 'var(--cs-primary)' }} />}
              title="Instant Guidance"
              description="Get immediate, context-aware responses tailored to your needs"
            />
            <FeatureCard
              icon={<BookOpen className="w-8 h-8" style={{ color: 'var(--cs-primary)' }} />}
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
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="p-6 lg:p-8 rounded-xl bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col items-center text-center">
        <div 
          className="mb-4 p-3 rounded-xl"
          style={{ backgroundColor: 'rgba(139, 195, 74, 0.1)' }}
        >
          {icon}
        </div>
        <h3 
          className="text-lg font-semibold mb-2"
          style={{ color: 'var(--cs-text)' }}
        >
          {title}
        </h3>
        <p className="text-sm text-neutral-600 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

