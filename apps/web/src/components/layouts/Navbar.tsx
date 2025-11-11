import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sprout, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-neutral-200">
      <div className="container-custom">
        <div className="flex h-16 md:h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl"
              style={{ backgroundColor: 'var(--cs-primary)' }}
            >
              <Sprout className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </motion.div>
            <span className="text-xl md:text-2xl font-bold" style={{ color: 'var(--cs-text)' }}>
              CropSense
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-sm font-medium text-neutral-700 hover:text-primary transition-colors duration-200"
            >
              Home
            </Link>
            <Link
              to="/how-it-works"
              className="text-sm font-medium text-neutral-700 hover:text-primary transition-colors duration-200"
            >
              How it works
            </Link>
            {user && (
              <Link
                to="/dashboard"
                className="text-sm font-medium text-neutral-700 hover:text-primary transition-colors duration-200"
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <>
                <span className="text-sm text-neutral-600 max-w-[150px] truncate">
                  {user.email}
                </span>
                <Button 
                  variant="ghost" 
                  onClick={handleLogout} 
                  className="flex items-center gap-2 text-neutral-700"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden lg:inline">Logout</span>
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/login')}
                  className="text-neutral-700"
                >
                  Login
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => navigate('/signup')}
                  className="shadow-sm"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden py-4 space-y-4"
          >
            <Link
              to="/"
              className="block text-text-secondary hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/how-it-works"
              className="block text-text-secondary hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              How it works
            </Link>
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="block text-text-secondary hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Button variant="ghost" onClick={handleLogout} className="w-full">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
                    navigate('/login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full"
                >
                  Login
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    navigate('/signup');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full"
                >
                  Sign Up
                </Button>
              </>
            )}
          </motion.div>
        )}
      </div>
    </nav>
  );
}

