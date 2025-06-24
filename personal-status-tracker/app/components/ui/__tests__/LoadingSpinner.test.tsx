import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render with default message', () => {
    render(<LoadingSpinner />);
    
    expect(screen.getAllByText('Loading...')).toHaveLength(2); // visible + sr-only
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render with custom message', () => {
    render(<LoadingSpinner message="Fetching data..." />);
    
    expect(screen.getAllByText('Fetching data...')).toHaveLength(2); // visible + sr-only
  });

  describe('sizes', () => {
    it('should apply small size classes', () => {
      const { container } = render(<LoadingSpinner size="sm" />);
      const spinner = container.querySelector('.animate-spin');
      
      expect(spinner).toHaveClass('w-6', 'h-6');
    });

    it('should apply medium size classes by default', () => {
      const { container } = render(<LoadingSpinner />);
      const spinner = container.querySelector('.animate-spin');
      
      expect(spinner).toHaveClass('w-8', 'h-8');
    });

    it('should apply large size classes', () => {
      const { container } = render(<LoadingSpinner size="lg" />);
      const spinner = container.querySelector('.animate-spin');
      
      expect(spinner).toHaveClass('w-12', 'h-12');
    });
  });

  describe('accessibility', () => {
    it('should have status role', () => {
      render(<LoadingSpinner />);
      
      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
    });

    it('should have screen reader text', () => {
      render(<LoadingSpinner message="Processing..." />);
      
      // Should have both visible and sr-only text
      const allText = screen.getAllByText('Processing...');
      expect(allText).toHaveLength(2); // One visible, one sr-only
      expect(allText[1]).toHaveClass('sr-only');
    });
  });

  describe('styling', () => {
    it('should have centered layout', () => {
      const { container } = render(<LoadingSpinner />);
      const wrapper = container.firstChild;
      
      expect(wrapper).toHaveClass('flex', 'flex-col', 'justify-center', 'items-center', 'min-h-[50vh]');
    });

    it('should have spinner animation classes', () => {
      const { container } = render(<LoadingSpinner />);
      const spinner = container.querySelector('.animate-spin');
      
      expect(spinner).toHaveClass('animate-spin', 'rounded-full', 'border-b-2', 'border-blue-600');
    });

    it('should style the message text', () => {
      render(<LoadingSpinner message="Loading data" />);
      const messages = screen.getAllByText('Loading data');
      const visibleMessage = messages.find(msg => !msg.classList.contains('sr-only'));
      
      expect(visibleMessage).toHaveClass('mt-2', 'text-gray-600', 'dark:text-gray-400');
    });
  });

  describe('edge cases', () => {
    it('should handle empty message', () => {
      render(<LoadingSpinner message="" />);
      
      // Should still render the status div
      expect(screen.getByRole('status')).toBeInTheDocument();
      
      // Should render empty spans
      const spans = document.querySelectorAll('span');
      expect(spans.length).toBeGreaterThan(0);
    });

    it('should handle very long messages', () => {
      const longMessage = 'This is a very long loading message that might wrap on smaller screens';
      render(<LoadingSpinner message={longMessage} />);
      
      expect(screen.getAllByText(longMessage)).toHaveLength(2); // visible + sr-only
    });
  });
});