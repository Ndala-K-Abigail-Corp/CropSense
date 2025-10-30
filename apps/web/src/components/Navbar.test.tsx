/**
 * Navbar Component Tests
 * TDD §7: Unit/component testing with Vitest + Testing Library
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Navbar } from './Navbar';

// Wrapper for React Router
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Navbar', () => {
  it('renders the logo and navigation links', () => {
    render(<Navbar />, { wrapper: RouterWrapper });

    expect(screen.getByText('CropSense')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('shows login button when not authenticated', () => {
    render(<Navbar isAuthenticated={false} />, { wrapper: RouterWrapper });

    expect(screen.getAllByText('Login')).toHaveLength(1);
  });

  it('shows user avatar and logout button when authenticated', () => {
    render(
      <Navbar isAuthenticated={true} userName="John Farmer" />,
      { wrapper: RouterWrapper }
    );

    expect(screen.getByText('J')).toBeInTheDocument(); // Avatar fallback
    expect(screen.getAllByText('Logout')).toHaveLength(1);
  });

  it('calls onLogin when login button is clicked', async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn();

    render(<Navbar isAuthenticated={false} onLogin={onLogin} />, {
      wrapper: RouterWrapper,
    });

    const loginButton = screen.getAllByText('Login')[0];
    await user.click(loginButton);

    expect(onLogin).toHaveBeenCalledOnce();
  });

  it('calls onLogout when logout button is clicked', async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();

    render(
      <Navbar isAuthenticated={true} userName="John" onLogout={onLogout} />,
      { wrapper: RouterWrapper }
    );

    const logoutButton = screen.getAllByText('Logout')[0];
    await user.click(logoutButton);

    expect(onLogout).toHaveBeenCalledOnce();
  });

  it('toggles mobile menu when hamburger button is clicked', async () => {
    const user = userEvent.setup();
    render(<Navbar />, { wrapper: RouterWrapper });

    const menuButton = screen.getByLabelText('Open menu');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await user.click(menuButton);

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByLabelText('Close menu')).toBeInTheDocument();
  });

  it('has proper ARIA labels for accessibility', () => {
    render(<Navbar />, { wrapper: RouterWrapper });

    expect(screen.getByRole('navigation')).toHaveAttribute(
      'aria-label',
      'Main navigation'
    );
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
  });

  it('closes mobile menu when a link is clicked', async () => {
    const user = userEvent.setup();
    render(<Navbar />, { wrapper: RouterWrapper });

    // Open menu
    const menuButton = screen.getByLabelText('Open menu');
    await user.click(menuButton);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    // Click a link
    const mobileLinks = screen.getAllByText('Home');
    await user.click(mobileLinks[mobileLinks.length - 1]); // Click mobile link

    // Menu should be closed
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});

