/**
 * Hero Component
 * Full-width hero section with responsive typography
 * Design tokens: hero padding (80px), typography scales, primary gradient
 * TDD §2, §12: Responsive design, WCAG AA contrast
 */

import React from 'react';
import { Button } from './ui/button';
import { useRegionCropContext } from '@/hooks/useRegionCropContext';

interface HeroProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  onCtaClick?: () => void;
  showRegionInfo?: boolean;
}

export function Hero({
  title = 'Smart Farming Guidance at Your Fingertips',
  subtitle = 'Get instant, context-aware agricultural advice powered by trusted sources and AI',
  ctaText = 'Start Now',
  onCtaClick,
  showRegionInfo = true,
}: HeroProps) {
  const { region, crop } = useRegionCropContext();

  return (
    <section
      className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 py-20 text-center text-neutral-white"
      aria-labelledby="hero-title"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          {/* Region/Crop Context Display */}
          {showRegionInfo && (region || crop) && (
            <div className="mb-6 animate-fadeIn">
              <p className="text-sm font-medium text-primary-100 tablet:text-base">
                {region && `📍 ${region.region}`}
                {region && crop && ' • '}
                {crop && `🌱 ${crop.cropName}`}
              </p>
            </div>
          )}

          {/* Title */}
          <h1
            id="hero-title"
            className="mb-6 font-heading text-3xl font-bold leading-tight text-neutral-white tablet:text-4xl desktop:text-5xl"
          >
            {title}
          </h1>

          {/* Subtitle */}
          <p className="mb-10 text-base text-primary-50 tablet:text-lg desktop:text-xl">
            {subtitle}
          </p>

          {/* CTA Button */}
          <Button
            onClick={onCtaClick}
            size="lg"
            variant="secondary"
            className="animate-slideUp font-medium shadow-lg transition-transform hover:scale-105"
          >
            {ctaText}
          </Button>

          {/* Feature Highlights */}
          <div className="mt-16 grid grid-cols-1 gap-6 text-left tablet:grid-cols-3">
            <div className="rounded-lg bg-primary-800/30 p-6 backdrop-blur-sm">
              <div className="mb-3 text-2xl">💬</div>
              <h3 className="mb-2 font-heading text-lg font-semibold">
                Ask Anything
              </h3>
              <p className="text-sm text-primary-100">
                Natural language Q&A for all your farming questions
              </p>
            </div>

            <div className="rounded-lg bg-primary-800/30 p-6 backdrop-blur-sm">
              <div className="mb-3 text-2xl">📚</div>
              <h3 className="mb-2 font-heading text-lg font-semibold">
                Trusted Sources
              </h3>
              <p className="text-sm text-primary-100">
                Answers backed by verified agricultural resources
              </p>
            </div>

            <div className="rounded-lg bg-primary-800/30 p-6 backdrop-blur-sm">
              <div className="mb-3 text-2xl">🌍</div>
              <h3 className="mb-2 font-heading text-lg font-semibold">
                Local Context
              </h3>
              <p className="text-sm text-primary-100">
                Region and crop-specific recommendations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
        aria-hidden="true"
      />
    </section>
  );
}

