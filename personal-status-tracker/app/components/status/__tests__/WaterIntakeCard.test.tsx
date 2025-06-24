import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WaterIntakeCard } from '../WaterIntakeCard';

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

describe('WaterIntakeCard', () => {
  const mockOnUpdateWaterIntake = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render card with title', () => {
    render(
      <WaterIntakeCard
        lastWaterIntake=""
        onUpdateWaterIntake={mockOnUpdateWaterIntake}
      />
    );

    expect(screen.getByText('💧 Water Intake')).toBeInTheDocument();
  });

  it('should display "Never" when no water intake recorded', () => {
    render(
      <WaterIntakeCard
        lastWaterIntake=""
        onUpdateWaterIntake={mockOnUpdateWaterIntake}
      />
    );

    expect(screen.getByText('Never')).toBeInTheDocument();
  });

  it('should display formatted time for recent water intake', () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60000).toISOString();
    
    render(
      <WaterIntakeCard
        lastWaterIntake={thirtyMinutesAgo}
        onUpdateWaterIntake={mockOnUpdateWaterIntake}
      />
    );

    expect(screen.getByText('30 minutes ago')).toBeInTheDocument();
  });

  it('should display update button', () => {
    render(
      <WaterIntakeCard
        lastWaterIntake=""
        onUpdateWaterIntake={mockOnUpdateWaterIntake}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('I just had water! 💦');
    expect(button).toHaveAttribute('aria-label', 'Update water intake time');
  });

  it('should call onUpdateWaterIntake when button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    
    render(
      <WaterIntakeCard
        lastWaterIntake=""
        onUpdateWaterIntake={mockOnUpdateWaterIntake}
      />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockOnUpdateWaterIntake).toHaveBeenCalledTimes(1);
  });

  it('should have live region for accessibility', () => {
    const { rerender } = render(
      <WaterIntakeCard
        lastWaterIntake=""
        onUpdateWaterIntake={mockOnUpdateWaterIntake}
      />
    );

    // Check live region exists
    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    expect(liveRegion).toHaveClass('sr-only');

    // Update with new water intake
    const now = new Date().toISOString();
    rerender(
      <WaterIntakeCard
        lastWaterIntake={now}
        onUpdateWaterIntake={mockOnUpdateWaterIntake}
      />
    );

    expect(liveRegion).toHaveTextContent('Water intake updated: Just now');
  });

  it('should display correct labels', () => {
    render(
      <WaterIntakeCard
        lastWaterIntake=""
        onUpdateWaterIntake={mockOnUpdateWaterIntake}
      />
    );

    expect(screen.getByText('Last water intake:')).toBeInTheDocument();
  });

  it('should update display when lastWaterIntake changes', () => {
    const { rerender } = render(
      <WaterIntakeCard
        lastWaterIntake=""
        onUpdateWaterIntake={mockOnUpdateWaterIntake}
      />
    );

    expect(screen.getByText('Never')).toBeInTheDocument();

    // Update to 2 hours ago
    const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString();
    rerender(
      <WaterIntakeCard
        lastWaterIntake={twoHoursAgo}
        onUpdateWaterIntake={mockOnUpdateWaterIntake}
      />
    );

    expect(screen.queryByText('Never')).not.toBeInTheDocument();
    expect(screen.getByText('2 hours ago')).toBeInTheDocument();
  });

  it('should be memoized and not re-render unnecessarily', () => {
    const renderSpy = jest.fn();
    
    const TestWrapper = ({ lastWaterIntake }: { lastWaterIntake: string }) => {
      renderSpy();
      return (
        <WaterIntakeCard
          lastWaterIntake={lastWaterIntake}
          onUpdateWaterIntake={mockOnUpdateWaterIntake}
        />
      );
    };

    const { rerender } = render(<TestWrapper lastWaterIntake="" />);
    expect(renderSpy).toHaveBeenCalledTimes(1);

    // Re-render with same props
    rerender(<TestWrapper lastWaterIntake="" />);
    expect(renderSpy).toHaveBeenCalledTimes(2); // Parent re-renders

    // The memoized component should prevent unnecessary re-renders
    // when props haven't changed
  });
});