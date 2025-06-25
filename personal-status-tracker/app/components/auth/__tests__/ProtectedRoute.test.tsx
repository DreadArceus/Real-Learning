import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from '../ProtectedRoute';
import { useAuth } from '@/app/contexts/AuthContext';

// Mock the useAuth hook
jest.mock('@/app/contexts/AuthContext');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock the child components
jest.mock('../AuthWrapper', () => ({
  AuthWrapper: () => <div data-testid="auth-wrapper">Auth Wrapper</div>,
}));

jest.mock('@/app/components/ui/LoadingSpinner', () => ({
  LoadingSpinner: ({ message }: { message: string }) => (
    <div data-testid="loading-spinner">{message}</div>
  ),
}));

describe('ProtectedRoute', () => {
  const mockChildren = <div data-testid="protected-content">Protected Content</div>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading spinner when loading', () => {
    mockUseAuth.mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
      isAdmin: false,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(<ProtectedRoute>{mockChildren}</ProtectedRoute>);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should show AuthWrapper when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      isAdmin: false,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(<ProtectedRoute>{mockChildren}</ProtectedRoute>);

    expect(screen.getByTestId('auth-wrapper')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should show protected content when authenticated as regular user', () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      isAdmin: false,
      user: { id: 1, username: 'testuser', role: 'viewer' },
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(<ProtectedRoute>{mockChildren}</ProtectedRoute>);

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('auth-wrapper')).not.toBeInTheDocument();
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });

  it('should show protected content when authenticated as admin user', () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      isAdmin: true,
      user: { id: 1, username: 'admin', role: 'admin' },
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(<ProtectedRoute>{mockChildren}</ProtectedRoute>);

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('auth-wrapper')).not.toBeInTheDocument();
  });

  it('should show access denied when requireAdmin=true and user is not admin', () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      isAdmin: false,
      user: { id: 1, username: 'testuser', role: 'viewer' },
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(<ProtectedRoute requireAdmin={true}>{mockChildren}</ProtectedRoute>);

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText('You need admin privileges to access this feature.')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('(viewer)')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should show protected content when requireAdmin=true and user is admin', () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      isAdmin: true,
      user: { id: 1, username: 'admin', role: 'admin' },
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(<ProtectedRoute requireAdmin={true}>{mockChildren}</ProtectedRoute>);

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
  });

  it('should show access denied for null user when requireAdmin=true', () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      isAdmin: false,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(<ProtectedRoute requireAdmin={true}>{mockChildren}</ProtectedRoute>);

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });
});