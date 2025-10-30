/**
 * Hero Storybook Stories
 * TDD §7, §10: Visual/interaction testing with Storybook
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Hero } from './Hero';
import { RegionCropContextProvider } from '@/hooks/useRegionCropContext';

const meta: Meta<typeof Hero> = {
  title: 'Components/Hero',
  component: Hero,
  decorators: [
    (Story) => (
      <RegionCropContextProvider>
        <Story />
      </RegionCropContextProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Hero>;

/**
 * Default hero section
 */
export const Default: Story = {
  args: {
    onCtaClick: () => console.log('CTA clicked'),
  },
};

/**
 * Custom content
 */
export const CustomContent: Story = {
  args: {
    title: 'Welcome to CropSense',
    subtitle: 'Your AI-powered farming assistant',
    ctaText: 'Get Started Today',
    onCtaClick: () => console.log('CTA clicked'),
  },
};

/**
 * Without region info display
 */
export const WithoutRegionInfo: Story = {
  args: {
    showRegionInfo: false,
    onCtaClick: () => console.log('CTA clicked'),
  },
};

/**
 * Mobile viewport
 */
export const Mobile: Story = {
  args: {
    onCtaClick: () => console.log('CTA clicked'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Tablet viewport
 */
export const Tablet: Story = {
  args: {
    onCtaClick: () => console.log('CTA clicked'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

