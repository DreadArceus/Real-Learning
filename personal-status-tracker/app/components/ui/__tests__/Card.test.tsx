import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardContent } from '../Card';

describe('Card components', () => {
  describe('Card', () => {
    it('should render children correctly', () => {
      render(
        <Card>
          <div>Test content</div>
        </Card>
      );
      
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should apply default classes', () => {
      const { container } = render(
        <Card>Content</Card>
      );
      
      const card = container.firstChild;
      expect(card).toHaveClass('bg-white', 'dark:bg-gray-800', 'rounded-lg', 'shadow-md', 'p-6');
    });

    it('should merge custom className', () => {
      const { container } = render(
        <Card className="custom-class">Content</Card>
      );
      
      const card = container.firstChild;
      expect(card).toHaveClass('custom-class');
      expect(card).toHaveClass('bg-white'); // Still has default classes
    });
  });

  describe('CardHeader', () => {
    it('should render as div element', () => {
      render(
        <CardHeader>Test Header</CardHeader>
      );
      
      const header = screen.getByText('Test Header');
      expect(header).toBeInTheDocument();
    });

    it('should apply default classes', () => {
      render(
        <CardHeader>Header</CardHeader>
      );
      
      const header = screen.getByText('Header');
      expect(header).toHaveClass('mb-4');
    });

    it('should merge custom className', () => {
      render(
        <CardHeader className="text-red-500">Header</CardHeader>
      );
      
      const header = screen.getByText('Header');
      expect(header).toHaveClass('text-red-500');
      expect(header).toHaveClass('mb-4'); // Still has default classes
    });
  });

  describe('CardContent', () => {
    it('should render children correctly', () => {
      render(
        <CardContent>
          <p>Content paragraph</p>
          <button>Action button</button>
        </CardContent>
      );
      
      expect(screen.getByText('Content paragraph')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveTextContent('Action button');
    });

    it('should apply default spacing class', () => {
      const { container } = render(
        <CardContent>Content</CardContent>
      );
      
      const content = container.firstChild;
      expect(content).toHaveClass('space-y-4');
    });

    it('should merge custom className', () => {
      const { container } = render(
        <CardContent className="custom-spacing">Content</CardContent>
      );
      
      const content = container.firstChild;
      expect(content).toHaveClass('custom-spacing');
      expect(content).toHaveClass('space-y-4');
    });
  });

  describe('Card composition', () => {
    it('should work together as a complete card', () => {
      render(
        <Card>
          <CardHeader>Card Title</CardHeader>
          <CardContent>
            <p>Card body content</p>
            <button>Card action</button>
          </CardContent>
        </Card>
      );
      
      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card body content')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveTextContent('Card action');
    });
  });
});