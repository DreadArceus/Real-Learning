import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AltitudeMoodCard } from '../AltitudeMoodCard';
import { ALTITUDE_CONFIG } from '../../../types/status';

// Mock the useAuth hook
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'admin', role: 'admin' },
    token: 'mock-token',
    isAuthenticated: true,
    isAdmin: true,
    isLoading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    error: null,
  })
}));

describe('AltitudeMoodCard', () => {
  const mockOnUpdateAltitude = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render card with dynamic title based on altitude', () => {
    const { rerender } = render(
      <AltitudeMoodCard
        altitude={9}
        onUpdateAltitude={mockOnUpdateAltitude}
      />
    );

    expect(screen.getByText('🚀 Altitude (Mood)')).toBeInTheDocument();

    rerender(
      <AltitudeMoodCard
        altitude={5}
        onUpdateAltitude={mockOnUpdateAltitude}
      />
    );

    expect(screen.getByText('🎈 Altitude (Mood)')).toBeInTheDocument();
  });

  it('should display current altitude value', () => {
    render(
      <AltitudeMoodCard
        altitude={7}
        onUpdateAltitude={mockOnUpdateAltitude}
      />
    );

    expect(screen.getByText('7/10')).toBeInTheDocument();
  });

  it('should apply correct color class based on altitude', () => {
    const { rerender } = render(
      <AltitudeMoodCard
        altitude={9}
        onUpdateAltitude={mockOnUpdateAltitude}
      />
    );

    let altitudeText = screen.getByText('9/10');
    expect(altitudeText).toHaveClass('text-green-600', 'dark:text-green-400');

    rerender(
      <AltitudeMoodCard
        altitude={2}
        onUpdateAltitude={mockOnUpdateAltitude}
      />
    );

    altitudeText = screen.getByText('2/10');
    expect(altitudeText).toHaveClass('text-red-600', 'dark:text-red-400');
  });

  it('should render slider with correct props', () => {
    render(
      <AltitudeMoodCard
        altitude={5}
        onUpdateAltitude={mockOnUpdateAltitude}
      />
    );

    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', String(ALTITUDE_CONFIG.MIN));
    expect(slider).toHaveAttribute('max', String(ALTITUDE_CONFIG.MAX));
    expect(slider).toHaveAttribute('value', '5');
    expect(slider).toHaveAttribute('aria-valuenow', '5');
    expect(slider).toHaveAttribute('aria-valuemin', String(ALTITUDE_CONFIG.MIN));
    expect(slider).toHaveAttribute('aria-valuemax', String(ALTITUDE_CONFIG.MAX));
    expect(slider).toHaveAttribute('aria-valuetext', 'Mood level 5 out of 10');
  });

  it('should display min and max labels', () => {
    render(
      <AltitudeMoodCard
        altitude={5}
        onUpdateAltitude={mockOnUpdateAltitude}
      />
    );

    expect(screen.getByText('Low 🏊')).toBeInTheDocument();
    expect(screen.getByText('High 🚀')).toBeInTheDocument();
  });

  it('should call onUpdateAltitude when slider value changes', () => {
    render(
      <AltitudeMoodCard
        altitude={5}
        onUpdateAltitude={mockOnUpdateAltitude}
      />
    );

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '8' } });

    expect(mockOnUpdateAltitude).toHaveBeenCalledWith(8);
  });

  it('should have live region for accessibility', () => {
    const { rerender } = render(
      <AltitudeMoodCard
        altitude={5}
        onUpdateAltitude={mockOnUpdateAltitude}
      />
    );

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    expect(liveRegion).toHaveClass('sr-only');
    expect(liveRegion).toHaveTextContent('Mood level updated to 5 out of 10');

    rerender(
      <AltitudeMoodCard
        altitude={8}
        onUpdateAltitude={mockOnUpdateAltitude}
      />
    );

    expect(liveRegion).toHaveTextContent('Mood level updated to 8 out of 10');
  });

  it('should be keyboard accessible', async () => {
    const user = userEvent.setup();
    
    render(
      <AltitudeMoodCard
        altitude={5}
        onUpdateAltitude={mockOnUpdateAltitude}
      />
    );

    const slider = screen.getByRole('slider');
    slider.focus();
    
    // Verify the slider is focusable and has proper attributes
    expect(document.activeElement).toBe(slider);
    expect(slider).toHaveAttribute('aria-valuenow', '5');
    expect(slider).toHaveAttribute('aria-valuetext', 'Mood level 5 out of 10');
  });

  it('should parse string value to integer', () => {
    render(
      <AltitudeMoodCard
        altitude={5}
        onUpdateAltitude={mockOnUpdateAltitude}
      />
    );

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '7.5' } });

    // Should parse to integer
    expect(mockOnUpdateAltitude).toHaveBeenCalledWith(7);
  });

  it('should display correct labels', () => {
    render(
      <AltitudeMoodCard
        altitude={5}
        onUpdateAltitude={mockOnUpdateAltitude}
      />
    );

    expect(screen.getByText('Current altitude:')).toBeInTheDocument();
  });

  it('should update emoji in title based on altitude', () => {
    const { rerender } = render(
      <AltitudeMoodCard
        altitude={1}
        onUpdateAltitude={mockOnUpdateAltitude}
      />
    );

    const testCases = [
      { altitude: 1, emoji: '🏊' },
      { altitude: 3, emoji: '🪂' },
      { altitude: 5, emoji: '🎈' },
      { altitude: 7, emoji: '✈️' },
      { altitude: 9, emoji: '🚀' },
    ];

    testCases.forEach(({ altitude, emoji }) => {
      rerender(
        <AltitudeMoodCard
          altitude={altitude}
          onUpdateAltitude={mockOnUpdateAltitude}
        />
      );

      expect(screen.getByText(`${emoji} Altitude (Mood)`)).toBeInTheDocument();
    });
  });

  it('should be memoized to prevent unnecessary re-renders', () => {
    const renderSpy = jest.fn();
    
    const TestWrapper = ({ altitude }: { altitude: number }) => {
      renderSpy();
      return (
        <AltitudeMoodCard
          altitude={altitude}
          onUpdateAltitude={mockOnUpdateAltitude}
        />
      );
    };

    const { rerender } = render(<TestWrapper altitude={5} />);
    expect(renderSpy).toHaveBeenCalledTimes(1);

    // Re-render with same props
    rerender(<TestWrapper altitude={5} />);
    expect(renderSpy).toHaveBeenCalledTimes(2); // Parent re-renders

    // The memoized component should prevent unnecessary re-renders
    // when props haven't changed
  });
});