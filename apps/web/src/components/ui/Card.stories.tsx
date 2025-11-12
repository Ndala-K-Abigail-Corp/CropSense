import type { Meta, StoryObj } from '@storybook/react';
import { BookOpen, TrendingUp, Users } from 'lucide-react';
import { Card } from './Card';

/**
 * Card component for grouping related content
 */
const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A flexible card container for displaying grouped content with consistent styling.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic card with text content
 */
export const Basic: Story = {
  args: {
    children: (
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-2">Card Title</h3>
        <p className="text-gray-600">
          This is a basic card with some text content. Cards are great for grouping related information.
        </p>
      </div>
    ),
  },
};

/**
 * Feature card with icon
 */
export const FeatureCard: Story = {
  args: {
    children: (
      <div className="p-6">
        <div className="p-3 rounded-xl bg-primary-50 inline-block mb-4">
          <BookOpen className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Expert Knowledge</h3>
        <p className="text-gray-600">
          Access comprehensive agricultural guidance backed by trusted resources and expert knowledge.
        </p>
      </div>
    ),
  },
};

/**
 * Stats card
 */
export const StatsCard: Story = {
  args: {
    children: (
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-600">Total Conversations</p>
          <TrendingUp className="w-4 h-4 text-green-500" />
        </div>
        <p className="text-3xl font-bold text-gray-900">1,234</p>
        <p className="text-xs text-green-600 mt-1">+12% from last month</p>
      </div>
    ),
  },
};

/**
 * Interactive card (hoverable)
 */
export const Interactive: Story = {
  args: {
    className: 'hover:shadow-lg transition-shadow cursor-pointer',
    children: (
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-2">Clickable Card</h3>
        <p className="text-gray-600">
          This card has hover effects. Try hovering over it to see the shadow transition.
        </p>
      </div>
    ),
  },
};

/**
 * Card with image
 */
export const WithImage: Story = {
  args: {
    children: (
      <div>
        <div className="h-48 bg-gradient-to-br from-green-400 to-green-600 rounded-t-lg"></div>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-2">Tomato Growing Guide</h3>
          <p className="text-gray-600 text-sm">
            Learn the best practices for growing healthy, productive tomato plants in any climate.
          </p>
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <Users className="w-4 h-4 mr-1" />
            1,234 views
          </div>
        </div>
      </div>
    ),
  },
};

/**
 * Compact card
 */
export const Compact: Story = {
  args: {
    children: (
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50">
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-sm">Quick Tip</h4>
            <p className="text-xs text-gray-600">Water in the morning</p>
          </div>
        </div>
      </div>
    ),
  },
};

/**
 * Card grid layout
 */
export const GridLayout: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
      <Card>
        <div className="p-6">
          <div className="p-3 rounded-xl bg-green-50 inline-block mb-4">
            <BookOpen className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Knowledge Base</h3>
          <p className="text-sm text-gray-600">
            Comprehensive agricultural guides
          </p>
        </div>
      </Card>
      <Card>
        <div className="p-6">
          <div className="p-3 rounded-xl bg-blue-50 inline-block mb-4">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">AI Powered</h3>
          <p className="text-sm text-gray-600">
            Intelligent farming recommendations
          </p>
        </div>
      </Card>
      <Card>
        <div className="p-6">
          <div className="p-3 rounded-xl bg-purple-50 inline-block mb-4">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Community</h3>
          <p className="text-sm text-gray-600">
            Connect with other farmers
          </p>
        </div>
      </Card>
    </div>
  ),
};

/**
 * Dark mode card
 */
export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  args: {
    className: 'bg-gray-800 border-gray-700',
    children: (
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-2 text-white">Dark Mode Card</h3>
        <p className="text-gray-300">
          This card is styled for dark mode with appropriate contrast and colors.
        </p>
      </div>
    ),
  },
};

