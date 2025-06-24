import React, { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Mock user for testing
export const mockAdminUser = {
  id: 1,
  username: 'admin',
  role: 'admin' as const,
  createdAt: '2025-01-01T00:00:00Z',
  lastLogin: '2025-01-01T00:00:00Z'
};

export const mockViewerUser = {
  id: 2,
  username: 'viewer',
  role: 'viewer' as const,
  createdAt: '2025-01-01T00:00:00Z',
  lastLogin: '2025-01-01T00:00:00Z'
};

// Create a context mock value factory
export const createMockAuthContext = (
  user: typeof mockAdminUser | typeof mockViewerUser | null = null,
  isLoading = false,
  error: string | null = null
) => ({
  user,
  token: user ? 'mock-token' : null,
  isAuthenticated: !!user,
  isAdmin: user?.role === 'admin',
  isLoading,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  error,
});

// Mock AuthContext for testing
export const MockAuthProvider = ({ 
  children, 
  user = null, 
  isLoading = false,
  error = null
}: { 
  children: ReactNode; 
  user?: typeof mockAdminUser | typeof mockViewerUser | null;
  isLoading?: boolean;
  error?: string | null;
}) => {
  return <div data-testid="mock-auth-provider">{children}</div>;
};

// Helper to render components with auth context
export const renderWithAuth = (
  ui: ReactNode,
  options: RenderOptions & {
    user?: typeof mockAdminUser | typeof mockViewerUser | null;
    isLoading?: boolean;
    error?: string | null;
  } = {}
) => {
  const { user, isLoading, error, ...renderOptions } = options;
  
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MockAuthProvider user={user} isLoading={isLoading} error={error}>
      {children}
    </MockAuthProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Helper to mock API responses
export const mockApiResponse = (data: any, success = true) => ({
  success,
  data,
  message: success ? 'Success' : 'Error'
});

// Mock fetch for API calls
export const mockFetch = (response: any, status = 200) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(response)
  });
};