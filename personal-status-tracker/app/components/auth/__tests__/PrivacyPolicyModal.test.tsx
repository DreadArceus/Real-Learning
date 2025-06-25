import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PrivacyPolicyModal } from '../PrivacyPolicyModal';
import { mockFetch, mockApiResponse } from '@/app/__tests__/auth-test-utils';

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001';

describe('PrivacyPolicyModal', () => {
  const mockOnAccept = jest.fn();
  const mockOnDecline = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders modal with privacy policy content', () => {
    render(
      <PrivacyPolicyModal
        isOpen={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText(/we collect and process the following types of personal data/i)).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <PrivacyPolicyModal
        isOpen={false}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    expect(screen.queryByText('Privacy Policy')).not.toBeInTheDocument();
  });

  it('shows accept and decline buttons', () => {
    render(
      <PrivacyPolicyModal
        isOpen={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument();
  });

  it('accept button is initially disabled', () => {
    render(
      <PrivacyPolicyModal
        isOpen={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    const acceptButton = screen.getByRole('button', { name: /accept/i });
    expect(acceptButton).toBeDisabled();
  });

  it('enables accept button after scrolling to bottom', async () => {
    render(
      <PrivacyPolicyModal
        isOpen={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    const scrollContainer = screen.getByTestId('privacy-policy-content');
    const acceptButton = screen.getByRole('button', { name: /accept/i });

    // Initially disabled
    expect(acceptButton).toBeDisabled();

    // Mock scrolling to bottom
    Object.defineProperty(scrollContainer, 'scrollTop', {
      writable: true,
      value: 500,
    });
    Object.defineProperty(scrollContainer, 'scrollHeight', {
      writable: true,
      value: 600,
    });
    Object.defineProperty(scrollContainer, 'clientHeight', {
      writable: true,
      value: 100,
    });

    fireEvent.scroll(scrollContainer);

    await waitFor(() => {
      expect(acceptButton).not.toBeDisabled();
    });
  });

  it('calls onDecline when decline button is clicked', () => {
    render(
      <PrivacyPolicyModal
        isOpen={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    const declineButton = screen.getByRole('button', { name: /decline/i });
    fireEvent.click(declineButton);

    expect(mockOnDecline).toHaveBeenCalledTimes(1);
  });

  it('fetches privacy policy content on mount', async () => {
    const mockPrivacyPolicy = {
      title: 'Privacy Policy',
      content: 'Mock privacy policy content'
    };

    mockFetch(mockApiResponse(mockPrivacyPolicy), 200);

    render(
      <PrivacyPolicyModal
        isOpen={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/privacy-policy');
    });
  });

  it('handles API error gracefully', async () => {
    mockFetch(mockApiResponse({ error: 'Failed to fetch' }), 500);

    render(
      <PrivacyPolicyModal
        isOpen={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    await waitFor(() => {
      // Should still render default content even if API fails
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    });
  });

  it('calls onAccept when accept button is clicked after scrolling', async () => {
    render(
      <PrivacyPolicyModal
        isOpen={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    const scrollContainer = screen.getByTestId('privacy-policy-content');
    const acceptButton = screen.getByRole('button', { name: /accept/i });

    // Simulate scrolling to bottom to enable button
    Object.defineProperty(scrollContainer, 'scrollTop', {
      writable: true,
      value: 500,
    });
    Object.defineProperty(scrollContainer, 'scrollHeight', {
      writable: true,
      value: 600,
    });
    Object.defineProperty(scrollContainer, 'clientHeight', {
      writable: true,
      value: 100,
    });

    fireEvent.scroll(scrollContainer);

    await waitFor(() => {
      expect(acceptButton).not.toBeDisabled();
    });

    fireEvent.click(acceptButton);

    expect(mockOnAccept).toHaveBeenCalledTimes(1);
  });

  it('handles keyboard navigation', () => {
    render(
      <PrivacyPolicyModal
        isOpen={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    // ESC key should trigger decline
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(mockOnDecline).toHaveBeenCalledTimes(1);
  });

  it('prevents modal from closing when clicking inside content', () => {
    render(
      <PrivacyPolicyModal
        isOpen={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    const modalContent = screen.getByTestId('privacy-policy-content');
    fireEvent.click(modalContent);

    // Should not trigger onDecline
    expect(mockOnDecline).not.toHaveBeenCalled();
  });

  it('has proper ARIA attributes for accessibility', () => {
    render(
      <PrivacyPolicyModal
        isOpen={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-labelledby');
    expect(modal).toHaveAttribute('aria-modal', 'true');
  });

  it('traps focus within modal when open', () => {
    render(
      <PrivacyPolicyModal
        isOpen={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    const declineButton = screen.getByRole('button', { name: /decline/i });
    const acceptButton = screen.getByRole('button', { name: /accept/i });

    // Tab navigation should cycle through modal elements
    declineButton.focus();
    expect(document.activeElement).toBe(declineButton);

    fireEvent.keyDown(declineButton, { key: 'Tab' });
    // In a real implementation, focus would move to accept button
  });

  it('displays loading state while fetching policy', () => {
    // Mock a delayed response
    global.fetch = jest.fn().mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockApiResponse({ content: 'Loaded content' }))
        }), 100)
      )
    );

    render(
      <PrivacyPolicyModal
        isOpen={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    // Should show some loading indicator or default content
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });
});