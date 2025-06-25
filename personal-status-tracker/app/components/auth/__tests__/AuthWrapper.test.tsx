import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthWrapper } from '../AuthWrapper';

// Mock the child components
jest.mock('../LoginForm', () => ({
  LoginForm: ({ onSwitchToRegister }: { onSwitchToRegister: () => void }) => (
    <div data-testid="login-form">
      <button onClick={onSwitchToRegister}>Switch to Register</button>
    </div>
  ),
}));

jest.mock('../RegisterForm', () => ({
  RegisterForm: ({ 
    onBackToLogin, 
    onSuccess 
  }: { 
    onBackToLogin: () => void; 
    onSuccess: () => void;
  }) => (
    <div data-testid="register-form">
      <button onClick={onBackToLogin}>Back to Login</button>
      <button onClick={onSuccess}>Registration Success</button>
    </div>
  ),
}));

describe('AuthWrapper', () => {
  it('should render LoginForm by default', () => {
    render(<AuthWrapper />);
    
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.queryByTestId('register-form')).not.toBeInTheDocument();
  });

  it('should switch to RegisterForm when switch button is clicked', () => {
    render(<AuthWrapper />);
    
    const switchButton = screen.getByText('Switch to Register');
    fireEvent.click(switchButton);
    
    expect(screen.queryByTestId('login-form')).not.toBeInTheDocument();
    expect(screen.getByTestId('register-form')).toBeInTheDocument();
  });

  it('should switch back to LoginForm when back button is clicked', () => {
    render(<AuthWrapper />);
    
    // First switch to register
    const switchToRegisterButton = screen.getByText('Switch to Register');
    fireEvent.click(switchToRegisterButton);
    
    // Then switch back to login
    const backToLoginButton = screen.getByText('Back to Login');
    fireEvent.click(backToLoginButton);
    
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.queryByTestId('register-form')).not.toBeInTheDocument();
  });

  it('should switch to LoginForm on registration success', () => {
    render(<AuthWrapper />);
    
    // First switch to register
    const switchToRegisterButton = screen.getByText('Switch to Register');
    fireEvent.click(switchToRegisterButton);
    
    // Simulate registration success
    const successButton = screen.getByText('Registration Success');
    fireEvent.click(successButton);
    
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.queryByTestId('register-form')).not.toBeInTheDocument();
  });
});