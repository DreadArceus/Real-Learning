import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../Header';
import { createMockAuthContext, mockAdminUser, mockViewerUser } from '@/app/__tests__/auth-test-utils';

// Mock the AuthContext
let mockAuthContextValue = createMockAuthContext();

jest.mock('@/app/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContextValue,
}));

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
  }),
}));

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the header with title', () => {
    mockAuthContextValue = createMockAuthContext(null);

    render(<Header />);

    expect(screen.getByText('Personal Status Tracker')).toBeInTheDocument();
  });

  it('shows login prompt when user is not authenticated', () => {
    mockAuthContextValue = createMockAuthContext(null);

    render(<Header />);

    expect(screen.getByText('Please log in')).toBeInTheDocument();
  });

  it('displays admin user information', () => {
    mockAuthContextValue = createMockAuthContext(mockAdminUser);

    render(<Header />);

    expect(screen.getByText('Welcome, admin')).toBeInTheDocument();
    expect(screen.getByText('(Admin)')).toBeInTheDocument();
  });

  it('displays viewer user information', () => {
    mockAuthContextValue = createMockAuthContext(mockViewerUser);

    render(<Header />);

    expect(screen.getByText('Welcome, viewer')).toBeInTheDocument();
    expect(screen.getByText('(Viewer)')).toBeInTheDocument();
  });

  it('applies correct styling for admin role', () => {
    mockAuthContextValue = createMockAuthContext(mockAdminUser);

    render(<Header />);

    const roleText = screen.getByText('(Admin)');
    expect(roleText).toHaveClass('text-yellow-600');
  });

  it('applies correct styling for viewer role', () => {
    mockAuthContextValue = createMockAuthContext(mockViewerUser);

    render(<Header />);

    const roleText = screen.getByText('(Viewer)');
    expect(roleText).toHaveClass('text-blue-600');
  });

  it('shows logout button when authenticated', () => {
    mockAuthContextValue = createMockAuthContext(mockAdminUser);

    render(<Header />);

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    expect(logoutButton).toBeInTheDocument();
  });

  it('calls logout function when logout button is clicked', () => {
    mockAuthContextValue = createMockAuthContext(mockAdminUser);

    render(<Header />);

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);

    expect(mockAuthContextValue.logout).toHaveBeenCalledTimes(1);
  });

  it('does not show logout button when not authenticated', () => {
    mockAuthContextValue = createMockAuthContext(null);

    render(<Header />);

    const logoutButton = screen.queryByRole('button', { name: /logout/i });
    expect(logoutButton).not.toBeInTheDocument();
  });

  it('handles long usernames gracefully', () => {
    const longUsernameUser = { ...mockAdminUser, username: 'very_long_username_that_might_break_layout' };
    mockAuthContextValue = createMockAuthContext(longUsernameUser);

    render(<Header />);

    expect(screen.getByText('Welcome, very_long_username_that_might_break_layout')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    mockAuthContextValue = createMockAuthContext(mockAdminUser);

    render(<Header />);

    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    expect(logoutButton).toHaveAttribute('type', 'button');
  });
});