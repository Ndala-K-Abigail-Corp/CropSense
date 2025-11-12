import type { Meta, StoryObj } from '@storybook/react';
import { Send, Loader2, Trash2 } from 'lucide-react';
import { Button } from './Button';

/**
 * Button component for triggering actions throughout the application.
 * Supports multiple variants, sizes, and states.
 */
const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile button component with multiple variants and full accessibility support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'destructive'],
      description: 'Visual style variant of the button',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the button',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    children: {
      control: 'text',
      description: 'Button content',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Primary button for main actions
 */
export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
};

/**
 * Secondary button for alternative actions
 */
export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
};

/**
 * Outline button for tertiary actions
 */
export const Outline: Story = {
  args: {
    children: 'Outline Button',
    variant: 'outline',
  },
};

/**
 * Ghost button for minimal emphasis
 */
export const Ghost: Story = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
  },
};

/**
 * Destructive button for dangerous actions
 */
export const Destructive: Story = {
  args: {
    children: 'Delete',
    variant: 'destructive',
  },
};

/**
 * Small button size
 */
export const Small: Story = {
  args: {
    children: 'Small Button',
    size: 'sm',
  },
};

/**
 * Medium button size (default)
 */
export const Medium: Story = {
  args: {
    children: 'Medium Button',
    size: 'md',
  },
};

/**
 * Large button size
 */
export const Large: Story = {
  args: {
    children: 'Large Button',
    size: 'lg',
  },
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
};

/**
 * Button with icon
 */
export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Send className="w-4 h-4 mr-2" />
        Send Message
      </>
    ),
  },
};

/**
 * Loading state with spinner
 */
export const Loading: Story = {
  args: {
    children: (
      <>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading...
      </>
    ),
    disabled: true,
  },
};

/**
 * Icon only button
 */
export const IconOnly: Story = {
  args: {
    children: <Trash2 className="w-5 h-5" />,
    'aria-label': 'Delete item',
  },
};

/**
 * All variants showcase
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
      </div>
      <div className="flex gap-2">
        <Button variant="primary" size="sm">Small</Button>
        <Button variant="primary" size="md">Medium</Button>
        <Button variant="primary" size="lg">Large</Button>
      </div>
      <div className="flex gap-2">
        <Button disabled>Disabled</Button>
        <Button>
          <Send className="w-4 h-4 mr-2" />
          With Icon
        </Button>
      </div>
    </div>
  ),
};

/**
 * Accessibility test: Keyboard navigation and focus states
 */
export const AccessibilityDemo: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-sm text-gray-600 mb-2">
        Press Tab to navigate between buttons. Each button should have a visible focus indicator.
      </p>
      <div className="flex gap-2">
        <Button>First Button</Button>
        <Button variant="secondary">Second Button</Button>
        <Button variant="outline">Third Button</Button>
      </div>
    </div>
  ),
};

