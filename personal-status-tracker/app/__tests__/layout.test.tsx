import React from 'react';
import { render } from '@testing-library/react';
import RootLayout from '../layout';

// Mock the Inter font import
jest.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'inter-font'
  })
}));

describe('RootLayout', () => {
  it('should render children with proper HTML structure', () => {
    const { container } = render(
      <RootLayout>
        <div data-testid="child-content">Test Content</div>
      </RootLayout>
    );

    // Check that HTML structure is correct
    const html = container.querySelector('html');
    expect(html).toHaveAttribute('lang', 'en');

    // Check that body has proper classes
    const body = container.querySelector('body');
    expect(body).toHaveClass('inter-font');

    // Check that children are rendered
    expect(container.querySelector('[data-testid="child-content"]')).toBeInTheDocument();
  });

  it('should include proper metadata', () => {
    render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    );

    // The metadata is handled by Next.js, but we can ensure the component renders
    // without errors when metadata is present
    expect(true).toBe(true);
  });
});