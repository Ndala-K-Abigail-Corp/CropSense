/**
 * MainLayout Component
 * Main layout wrapper with navbar
 * TDD §13: Routing and layout structure
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';

export function MainLayout() {
  // Mock auth state - in production, this would come from auth context
  const isAuthenticated = false;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar isAuthenticated={isAuthenticated} />
      
      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-neutral-200 bg-neutral-100 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-neutral-600">
          <p>
            © {new Date().getFullYear()} CropSense. Empowering farmers with
            AI-driven agricultural guidance.
          </p>
          <div className="mt-2 space-x-4">
            <a
              href="/about"
              className="hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              About
            </a>
            <span className="text-neutral-400">•</span>
            <a
              href="/privacy"
              className="hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              Privacy
            </a>
            <span className="text-neutral-400">•</span>
            <a
              href="/terms"
              className="hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

