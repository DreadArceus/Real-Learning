import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '../LoginForm';
import { mockFetch, mockAdminUser } from '@/app/__tests__/auth-test-utils';

// Mock the auth context
const mockLogin = jest.fn();
const mockUseAuth = {
  login: mockLogin,
  isLoading: false,
  error: null,
  user: null,
  token: null,
  isAuthenticated: false,
  isAdmin: false,
  register: jest.fn(),
  logout: jest.fn()
};

jest.mock('@/app/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth
}));

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form with all fields', () => {
    render(<LoginForm />);

    expect(screen.getByRole('heading', { name: /personal status tracker/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows demo credentials section', () => {
    render(<LoginForm />);

    expect(screen.getByText(/demo credentials/i)).toBeInTheDocument();
    expect(screen.getByText(/dreadarceus/i)).toBeInTheDocument();
    expect(screen.getByText(/admin \(full access\)/i)).toBeInTheDocument();
  });

  it('shows registration link when onSwitchToRegister is provided', () => {
    const mockSwitchToRegister = jest.fn();
    render(<LoginForm onSwitchToRegister={mockSwitchToRegister} />);

    const registerLink = screen.getByText(/sign up for free/i);
    expect(registerLink).toBeInTheDocument();

    fireEvent.click(registerLink);
    expect(mockSwitchToRegister).toHaveBeenCalledTimes(1);
  });

  it('does not show registration link when onSwitchToRegister is not provided', () => {
    render(<LoginForm />);

    expect(screen.queryByText(/sign up for free/i)).not.toBeInTheDocument();
  });

  it('handles form submission with valid credentials', async () => {
    mockLogin.mockResolvedValue(undefined);
    
    render(<LoginForm />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123'
      });
    });
  });

  it('validates required fields', async () => {
    render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Submit with empty fields
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter both username and password/i)).toBeInTheDocument();
    });

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('validates username field', async () => {
    render(<LoginForm />);

    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter both username and password/i)).toBeInTheDocument();
    });

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('validates password field', async () => {
    render(<LoginForm />);

    const usernameInput = screen.getByLabelText(/username/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter both username and password/i)).toBeInTheDocument();
    });

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('shows loading state during authentication', async () => {
    // Mock a delayed login response
    const mockDelayedLogin = jest.fn().mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          success: true,
          user: { id: 1, username: 'testuser', role: 'viewer' },
          token: 'mock-token'
        }), 100)
      )
    );
    
    mockAuthContextValue.login = mockDelayedLogin;

    render(<LoginForm />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // Check loading state appears
    expect(screen.getByText(/signing in.../i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Wait for loading to complete
    await waitFor(() => {
      expect(mockDelayedLogin).toHaveBeenCalledTimes(1);
    });
  });

  it('clears local error when user starts typing', async () => {
    render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    const usernameInput = screen.getByLabelText(/username/i);

    // Trigger validation error
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter both username and password/i)).toBeInTheDocument();
    });

    // Start typing to clear error
    fireEvent.change(usernameInput, { target: { value: 't' } });

    await waitFor(() => {
      expect(screen.queryByText(/please enter both username and password/i)).not.toBeInTheDocument();
    });
  });

  it('handles login failure gracefully', async () => {
    const errorMessage = 'Login failed';
    mockLogin.mockRejectedValue(new Error(errorMessage));
    
    render(<LoginForm />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });

    // The error should be handled by the auth context
    expect(mockLogin).toHaveBeenCalledWith({
      username: 'testuser',
      password: 'wrongpassword'
    });
  });

  it('has proper accessibility attributes', () => {
    render(<LoginForm />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);

    expect(usernameInput).toHaveAttribute('autoComplete', 'username');
    expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
    expect(passwordInput).toHaveAttribute('type', 'password');

    expect(usernameInput).toHaveAttribute('required');
    expect(passwordInput).toHaveAttribute('required');
  });
});