import React from 'react';
import { render, renderHook, act, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { authService } from '@/app/lib/authService';

jest.mock('@/app/lib/authService', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
    getToken: jest.fn(),
  }
}));

const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('AuthContext', () => {
  const renderWithProvider = (children: React.ReactNode) => {
    return render(<AuthProvider>{children}</AuthProvider>);
  };

  const renderHookWithProvider = <T,>(hook: () => T) => {
    return renderHook(hook, {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthService.getCurrentUser.mockReturnValue(null);
    mockAuthService.getToken.mockReturnValue(null);
  });

  it('should provide initial auth state', () => {
    const { result } = renderHookWithProvider(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should initialize with existing user', () => {
    const mockUser = { id: 1, username: 'admin', role: 'admin' as const };
    mockAuthService.getCurrentUser.mockReturnValue(mockUser);
    mockAuthService.getToken.mockReturnValue('mock-token');

    const { result } = renderHookWithProvider(() => useAuth());

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe('mock-token');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle successful login', async () => {
    const mockUser = { id: 1, username: 'admin', role: 'admin' as const };
    const credentials = { username: 'admin', password: 'password' };
    
    mockAuthService.login.mockResolvedValue({
      user: mockUser,
      token: 'mock-token'
    });

    const { result } = renderHookWithProvider(() => useAuth());

    await act(async () => {
      await result.current.login(credentials);
    });

    expect(mockAuthService.login).toHaveBeenCalledWith(credentials);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe('mock-token');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should handle login failure', async () => {
    const credentials = { username: 'admin', password: 'wrong' };
    const errorMessage = 'Invalid credentials';
    
    mockAuthService.login.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHookWithProvider(() => useAuth());

    await act(async () => {
      await result.current.login(credentials);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it('should handle successful registration', async () => {
    const mockUser = { id: 1, username: 'newuser', role: 'viewer' as const };
    const userData = { username: 'newuser', password: 'password' };
    
    mockAuthService.register.mockResolvedValue(mockUser);

    const { result } = renderHookWithProvider(() => useAuth());

    await act(async () => {
      await result.current.register(userData);
    });

    expect(mockAuthService.register).toHaveBeenCalledWith(userData);
    expect(result.current.error).toBeNull();
  });

  it('should handle registration failure', async () => {
    const userData = { username: 'newuser', password: 'password' };
    const errorMessage = 'Username already exists';
    
    mockAuthService.register.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHookWithProvider(() => useAuth());

    await act(async () => {
      await result.current.register(userData);
    });

    expect(result.current.error).toBe(errorMessage);
  });

  it('should handle logout', () => {
    const mockUser = { id: 1, username: 'admin', role: 'admin' as const };
    mockAuthService.getCurrentUser.mockReturnValue(mockUser);
    mockAuthService.getToken.mockReturnValue('mock-token');

    const { result } = renderHookWithProvider(() => useAuth());

    act(() => {
      result.current.logout();
    });

    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should clear error on new login attempt', async () => {
    const credentials = { username: 'admin', password: 'wrong' };
    mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

    const { result } = renderHookWithProvider(() => useAuth());

    // First login attempt with error
    await act(async () => {
      await result.current.login(credentials);
    });

    expect(result.current.error).toBe('Invalid credentials');

    // Second login attempt should clear error
    mockAuthService.login.mockResolvedValue({
      user: { id: 1, username: 'admin', role: 'admin' as const },
      token: 'mock-token'
    });

    await act(async () => {
      await result.current.login(credentials);
    });

    expect(result.current.error).toBeNull();
  });

  it('should handle viewer user role correctly', () => {
    const mockUser = { id: 1, username: 'viewer', role: 'viewer' as const };
    mockAuthService.getCurrentUser.mockReturnValue(mockUser);
    mockAuthService.getToken.mockReturnValue('mock-token');

    const { result } = renderHookWithProvider(() => useAuth());

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isAdmin).toBe(false);
  });

  it('should throw error when useAuth is used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleError.mockRestore();
  });
});