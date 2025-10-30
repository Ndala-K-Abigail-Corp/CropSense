/**
 * Navbar Storybook Stories
 * TDD §7, §10: Visual/interaction testing with Storybook
 */

import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { Navbar } from './Navbar';

const meta: Meta<typeof Navbar> = {
  title: 'Components/Navbar',
  component: Navbar,
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Navbar>;

/**
 * Default state - not authenticated
 */
export const Default: Story = {
  args: {
    isAuthenticated: false,
    onLogin: () => console.log('Login clicked'),
  },
};

/**
 * Authenticated state with user
 */
export const Authenticated: Story = {
  args: {
    isAuthenticated: true,
    userName: 'John Farmer',
    onLogout: () => console.log('Logout clicked'),
  },
};

/**
 * Authenticated with avatar image
 */
export const WithAvatar: Story = {
  args: {
    isAuthenticated: true,
    userName: 'Jane Smith',
    userAvatar: 'https://i.pravatar.cc/150?img=5',
    onLogout: () => console.log('Logout clicked'),
  },
};

/**
 * Mobile viewport
 */
export const Mobile: Story = {
  args: {
    isAuthenticated: false,
    onLogin: () => console.log('Login clicked'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Mobile viewport - authenticated
 */
export const MobileAuthenticated: Story = {
  args: {
    isAuthenticated: true,
    userName: 'John Farmer',
    onLogout: () => console.log('Logout clicked'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

