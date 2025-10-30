/**
 * Hero Component Tests
 * TDD §7: Unit/component testing with Vitest + Testing Library
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Hero } from './Hero';
import { RegionCropContextProvider } from '@/hooks/useRegionCropContext';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <RegionCropContextProvider>{children}</RegionCropContextProvider>
);

describe('Hero', () => {
  it('renders default title and subtitle', () => {
    render(<Hero />, { wrapper: Wrapper });

    expect(
      screen.getByText('Smart Farming Guidance at Your Fingertips')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Get instant, context-aware agricultural advice powered by trusted sources/
      )
    ).toBeInTheDocument();
  });

  it('renders custom title and subtitle', () => {
    render(
      <Hero
        title="Custom Title"
        subtitle="Custom subtitle text"
        ctaText="Get Started"
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom subtitle text')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('calls onCtaClick when CTA button is clicked', async () => {
    const user = userEvent.setup();
    const onCtaClick = vi.fn();

    render(<Hero onCtaClick={onCtaClick} />, { wrapper: Wrapper });

    const ctaButton = screen.getByText('Start Now');
    await user.click(ctaButton);

    expect(onCtaClick).toHaveBeenCalledOnce();
  });

  it('has proper heading hierarchy for accessibility', () => {
    render(<Hero />, { wrapper: Wrapper });

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent(
      'Smart Farming Guidance at Your Fingertips'
    );
  });

  it('displays feature highlights', () => {
    render(<Hero />, { wrapper: Wrapper });

    expect(screen.getByText('Ask Anything')).toBeInTheDocument();
    expect(screen.getByText('Trusted Sources')).toBeInTheDocument();
    expect(screen.getByText('Local Context')).toBeInTheDocument();
  });

  it('has accessible labelledby attribute', () => {
    render(<Hero />, { wrapper: Wrapper });

    const section = screen.getByLabelText(
      'Smart Farming Guidance at Your Fingertips'
    );
    expect(section).toBeInTheDocument();
  });
});

