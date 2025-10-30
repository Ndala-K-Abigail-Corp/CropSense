/**
 * HomePage Component
 * Main landing page with Hero and ChatInterface
 */

import React from 'react';
import { Hero } from '@/components/Hero';
import { ChatInterface } from '@/components/ChatInterface';

export function HomePage() {
  const handleCtaClick = () => {
    // Scroll to chat interface
    const chatElement = document.getElementById('chat-section');
    chatElement?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      <Hero onCtaClick={handleCtaClick} />
      
      <section id="chat-section" className="container mx-auto px-4 py-16">
        <ChatInterface />
      </section>
    </div>
  );
}

