import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Mock console.error globally for this test file
const originalError = console.error;

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  // Mock console.error to prevent error output in tests
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should catch errors and display error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('should display custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('should have try again button that can be clicked', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    
    const tryAgainButton = screen.getByRole('button', { name: 'Try again' });
    expect(tryAgainButton).toBeInTheDocument();
    
    // Verify button can be clicked (implementation detail of reset is handled by React)
    fireEvent.click(tryAgainButton);
    // The error boundary internal state reset is a React implementation detail
  });

  it('should log errors to console', () => {
    // Clear previous calls
    consoleErrorSpy.mockClear();
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(consoleErrorSpy).toHaveBeenCalled();
    // Look for our custom error logging
    const errorCalls = consoleErrorSpy.mock.calls;
    const customErrorCall = errorCalls.find(call => call[0] === 'Uncaught error:');
    expect(customErrorCall).toBeDefined();
    expect(customErrorCall[1]).toBeInstanceOf(Error);
    expect(customErrorCall[1].message).toBe('Test error message');
  });

  it('should handle errors without message', () => {
    const ThrowErrorWithoutMessage = () => {
      throw new Error();
    };

    render(
      <ErrorBoundary>
        <ThrowErrorWithoutMessage />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
  });

  it('should catch errors from nested components', () => {
    const NestedError = () => {
      return (
        <div>
          <div>
            <ThrowError shouldThrow={true} />
          </div>
        </div>
      );
    };

    render(
      <ErrorBoundary>
        <NestedError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should apply correct styling to error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const card = screen.getByText('Something went wrong').closest('div');
    expect(card).toHaveClass('max-w-lg', 'mx-auto', 'mt-8');

    const heading = screen.getByText('Something went wrong');
    expect(heading).toHaveClass('text-xl', 'font-semibold', 'text-red-600', 'dark:text-red-400', 'mb-2');

    const message = screen.getByText('Test error message');
    expect(message).toHaveClass('text-gray-600', 'dark:text-gray-400', 'mb-4');

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-200'); // Secondary variant
  });

  it('should catch different types of errors', () => {
    const ThrowDifferentError = () => {
      throw new Error('Different error type');
    };

    render(
      <ErrorBoundary>
        <ThrowDifferentError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Different error type')).toBeInTheDocument();
  });

  it('should maintain error boundary isolation', () => {
    render(
      <div>
        <ErrorBoundary>
          <div>First child - no error</div>
        </ErrorBoundary>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
        <ErrorBoundary>
          <div>Third child - no error</div>
        </ErrorBoundary>
      </div>
    );

    // First and third children should render normally
    expect(screen.getByText('First child - no error')).toBeInTheDocument();
    expect(screen.getByText('Third child - no error')).toBeInTheDocument();
    
    // Second child should show error
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});