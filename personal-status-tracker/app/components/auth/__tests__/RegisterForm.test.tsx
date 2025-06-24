import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegisterForm } from '../RegisterForm';
import { mockFetch, mockApiResponse } from '../../../__tests__/auth-test-utils';

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001';

describe('RegisterForm', () => {
  const mockOnBackToLogin = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset fetch mock
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders registration form with all fields', () => {
    render(
      <RegisterForm 
        onBackToLogin={mockOnBackToLogin} 
        onSuccess={mockOnSuccess} 
      />
    );

    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to login/i })).toBeInTheDocument();
  });

  it('shows account benefits section', () => {
    render(
      <RegisterForm 
        onBackToLogin={mockOnBackToLogin} 
        onSuccess={mockOnSuccess} 
      />
    );

    expect(screen.getByText(/account benefits/i)).toBeInTheDocument();
    expect(screen.getByText(/track your water intake and mood/i)).toBeInTheDocument();
    expect(screen.getByText(/view your status history/i)).toBeInTheDocument();
    expect(screen.getByText(/read-only access to data/i)).toBeInTheDocument();
    expect(screen.getByText(/only admins can update status data/i)).toBeInTheDocument();
  });

  it('handles back to login button click', () => {
    render(
      <RegisterForm 
        onBackToLogin={mockOnBackToLogin} 
        onSuccess={mockOnSuccess} 
      />
    );

    const backButton = screen.getByRole('button', { name: /back to login/i });
    fireEvent.click(backButton);

    expect(mockOnBackToLogin).toHaveBeenCalledTimes(1);
  });

  it('validates required fields', async () => {
    render(
      <RegisterForm 
        onBackToLogin={mockOnBackToLogin} 
        onSuccess={mockOnSuccess} 
      />
    );

    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('validates username length', async () => {
    render(
      <RegisterForm 
        onBackToLogin={mockOnBackToLogin} 
        onSuccess={mockOnSuccess} 
      />
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(usernameInput, { target: { value: 'ab' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/username must be at least 3 characters long/i)).toBeInTheDocument();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('validates password length', async () => {
    render(
      <RegisterForm 
        onBackToLogin={mockOnBackToLogin} 
        onSuccess={mockOnSuccess} 
      />
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: '12345' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters long/i)).toBeInTheDocument();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('validates password confirmation', async () => {
    render(
      <RegisterForm 
        onBackToLogin={mockOnBackToLogin} 
        onSuccess={mockOnSuccess} 
      />
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const mockResponse = mockApiResponse({
      id: 1,
      username: 'testuser',
      role: 'viewer',
      createdAt: '2025-01-01T00:00:00Z'
    });

    mockFetch(mockResponse, 201);

    render(
      <RegisterForm 
        onBackToLogin={mockOnBackToLogin} 
        onSuccess={mockOnSuccess} 
      />
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/auth/register',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'testuser',
            password: 'password123'
          })
        })
      );
    });
  });

  it('shows success state after successful registration', async () => {
    const mockResponse = mockApiResponse({
      id: 1,
      username: 'testuser',
      role: 'viewer'
    });

    mockFetch(mockResponse, 201);

    render(
      <RegisterForm 
        onBackToLogin={mockOnBackToLogin} 
        onSuccess={mockOnSuccess} 
      />
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/account created!/i)).toBeInTheDocument();
      expect(screen.getByText(/your viewer account has been created successfully/i)).toBeInTheDocument();
      expect(screen.getByText(/redirecting you to login/i)).toBeInTheDocument();
    });

    // Should call onSuccess after timeout
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });
  });

  it('displays API error messages', async () => {
    const errorResponse = {
      success: false,
      error: 'Username already exists'
    };

    mockFetch(errorResponse, 400);

    render(
      <RegisterForm 
        onBackToLogin={mockOnBackToLogin} 
        onSuccess={mockOnSuccess} 
      />
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(usernameInput, { target: { value: 'existinguser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/username already exists/i)).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('shows loading state during submission', async () => {
    // Mock a delayed response
    global.fetch = jest.fn().mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          status: 201,
          json: () => Promise.resolve(mockApiResponse({ id: 1, username: 'testuser', role: 'viewer' }))
        }), 100)
      )
    );

    render(
      <RegisterForm 
        onBackToLogin={mockOnBackToLogin} 
        onSuccess={mockOnSuccess} 
      />
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // Check loading state
    expect(screen.getByText(/creating account.../i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText(/account created!/i)).toBeInTheDocument();
    });
  });

  it('clears error when user starts typing', async () => {
    render(
      <RegisterForm 
        onBackToLogin={mockOnBackToLogin} 
        onSuccess={mockOnSuccess} 
      />
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Trigger validation error
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
    });

    // Start typing to clear error
    fireEvent.change(usernameInput, { target: { value: 't' } });

    await waitFor(() => {
      expect(screen.queryByText(/username is required/i)).not.toBeInTheDocument();
    });
  });

  it('has proper accessibility attributes', () => {
    render(
      <RegisterForm 
        onBackToLogin={mockOnBackToLogin} 
        onSuccess={mockOnSuccess} 
      />
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    expect(usernameInput).toHaveAttribute('autoComplete', 'username');
    expect(passwordInput).toHaveAttribute('autoComplete', 'new-password');
    expect(confirmPasswordInput).toHaveAttribute('autoComplete', 'new-password');

    expect(usernameInput).toHaveAttribute('required');
    expect(passwordInput).toHaveAttribute('required');
    expect(confirmPasswordInput).toHaveAttribute('required');

    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
  });
});