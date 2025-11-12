import type { Meta, StoryObj } from '@storybook/react';
import { Search, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Input } from './Input';

/**
 * Input component for user text entry
 */
const meta = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible input component with support for different types, states, and icons.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'search', 'number', 'tel', 'url'],
    },
    disabled: {
      control: 'boolean',
    },
    placeholder: {
      control: 'text',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default text input
 */
export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

/**
 * Email input
 */
export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'Enter your email',
  },
};

/**
 * Password input
 */
export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter your password',
  },
};

/**
 * Search input
 */
export const Search: Story = {
  args: {
    type: 'search',
    placeholder: 'Search...',
  },
};

/**
 * Disabled input
 */
export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
    value: 'This input is disabled',
  },
};

/**
 * Input with error state
 */
export const WithError: Story = {
  args: {
    placeholder: 'Enter email',
    className: 'border-red-500 focus:ring-red-500',
  },
  render: (args) => (
    <div className="w-80">
      <Input {...args} />
      <p className="mt-1 text-sm text-red-600">Please enter a valid email address</p>
    </div>
  ),
};

/**
 * Input with success state
 */
export const WithSuccess: Story = {
  args: {
    placeholder: 'Enter email',
    value: 'user@example.com',
    className: 'border-green-500 focus:ring-green-500',
  },
  render: (args) => (
    <div className="w-80">
      <Input {...args} />
      <p className="mt-1 text-sm text-green-600">Email is valid</p>
    </div>
  ),
};

/**
 * Input with label
 */
export const WithLabel: Story = {
  render: () => (
    <div className="w-80">
      <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
        Username
      </label>
      <Input id="username" placeholder="Enter your username" />
      <p className="mt-1 text-sm text-gray-500">Choose a unique username</p>
    </div>
  ),
};

/**
 * Input with icon (custom implementation)
 */
export const WithIcon: Story = {
  render: () => (
    <div className="w-80">
      <label htmlFor="email-icon" className="block text-sm font-medium text-gray-700 mb-2">
        Email Address
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Mail className="h-5 w-5 text-gray-400" />
        </div>
        <Input
          id="email-icon"
          type="email"
          placeholder="you@example.com"
          className="pl-10"
        />
      </div>
    </div>
  ),
};

/**
 * Password input with toggle visibility
 */
export const PasswordToggle: Story = {
  render: function PasswordToggleComponent() {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="w-80">
        <label htmlFor="password-toggle" className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <div className="relative">
          <Input
            id="password-toggle"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    );
  },
};

/**
 * Search input with icon
 */
export const SearchWithIcon: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <Input
          type="search"
          placeholder="Search crops, diseases, best practices..."
          className="pl-10"
        />
      </div>
    </div>
  ),
};

/**
 * Form with multiple inputs
 */
export const FormExample: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Full Name
        </label>
        <Input id="name" placeholder="John Doe" />
      </div>
      <div>
        <label htmlFor="email-form" className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <Input id="email-form" type="email" placeholder="john@example.com" />
      </div>
      <div>
        <label htmlFor="farm" className="block text-sm font-medium text-gray-700 mb-2">
          Farm Name
        </label>
        <Input id="farm" placeholder="Green Valley Farm" />
      </div>
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
          Location
        </label>
        <Input id="location" placeholder="City, Country" />
      </div>
    </div>
  ),
};

/**
 * Accessibility demonstration
 */
export const AccessibilityDemo: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-6">
      <div>
        <p className="text-sm text-gray-600 mb-4">
          All inputs have proper labels and ARIA attributes for screen readers.
          Press Tab to navigate between fields.
        </p>
      </div>
      <div>
        <label htmlFor="accessible-name" className="block text-sm font-medium text-gray-700 mb-2">
          Name <span className="text-red-500">*</span>
        </label>
        <Input
          id="accessible-name"
          required
          aria-required="true"
          aria-describedby="name-help"
          placeholder="Enter your name"
        />
        <p id="name-help" className="mt-1 text-sm text-gray-500">
          This field is required
        </p>
      </div>
      <div>
        <label htmlFor="accessible-email" className="block text-sm font-medium text-gray-700 mb-2">
          Email <span className="text-red-500">*</span>
        </label>
        <Input
          id="accessible-email"
          type="email"
          required
          aria-required="true"
          aria-describedby="email-help"
          placeholder="you@example.com"
        />
        <p id="email-help" className="mt-1 text-sm text-gray-500">
          We'll never share your email
        </p>
      </div>
    </div>
  ),
};

