/**
 * Navbar Component
 * Responsive navigation bar with mobile menu
 * Design tokens: nav height (64px), shadow (sm), colors
 * TDD §2, §12: Accessibility (keyboard nav, ARIA labels)
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';

interface NavbarProps {
  isAuthenticated?: boolean;
  userName?: string;
  userAvatar?: string;
  onLogin?: () => void;
  onLogout?: () => void;
}

export function Navbar({
  isAuthenticated = false,
  userName = 'User',
  userAvatar,
  onLogin,
  onLogout,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Admin', href: '/admin' },
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleMobileMenu();
    }
  };

  return (
    <nav
      className="sticky top-0 z-50 bg-neutral-white shadow-sm"
      style={{ height: 'var(--ag-nav-height)' }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container mx-auto flex h-full items-center justify-between px-4">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center space-x-2 font-heading text-2xl font-bold text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          <span>🌾</span>
          <span>CropSense</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center space-x-6 tablet:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-neutral-700 transition-colors hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              {link.label}
            </Link>
          ))}

          <Separator orientation="vertical" className="h-6" />

          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={userAvatar} alt={userName} />
                <AvatarFallback className="bg-primary-100 text-primary-700">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" onClick={onLogout} size="sm">
                Logout
              </Button>
            </div>
          ) : (
            <Button onClick={onLogin} size="sm">
              Login
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="tablet:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          onClick={toggleMobileMenu}
          onKeyDown={handleKeyDown}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-neutral-700" />
          ) : (
            <Menu className="h-6 w-6 text-neutral-700" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="border-t border-neutral-200 bg-neutral-white tablet:hidden"
          role="menu"
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-neutral-700 transition-colors hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                  onClick={() => setMobileMenuOpen(false)}
                  role="menuitem"
                >
                  {link.label}
                </Link>
              ))}

              <Separator />

              {isAuthenticated ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={userAvatar} alt={userName} />
                      <AvatarFallback className="bg-primary-100 text-primary-700">
                        {userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-neutral-700">{userName}</span>
                  </div>
                  <Button variant="ghost" onClick={onLogout} size="sm">
                    Logout
                  </Button>
                </div>
              ) : (
                <Button onClick={onLogin} className="w-full">
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

