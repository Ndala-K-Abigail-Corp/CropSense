/**
 * ChatInterface Storybook Stories
 * TDD §7, §10: Visual/interaction testing with Storybook
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ChatInterface } from './ChatInterface';
import { RegionCropContextProvider } from '@/hooks/useRegionCropContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a query client for stories
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});

const meta: Meta<typeof ChatInterface> = {
  title: 'Components/ChatInterface',
  component: ChatInterface,
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <RegionCropContextProvider>
          <div className="h-screen p-6">
            <Story />
          </div>
        </RegionCropContextProvider>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ChatInterface>;

/**
 * Empty state - no messages
 */
export const Empty: Story = {
  args: {},
};

/**
 * Custom placeholder and empty message
 */
export const CustomText: Story = {
  args: {
    placeholder: 'What farming question can I help with?',
    emptyStateMessage: 'Ask me anything about agriculture!',
  },
};

/**
 * Mobile viewport
 */
export const Mobile: Story = {
  args: {},
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
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

