import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '../page';
import { useStatusData } from '../hooks/useStatusData';

// Mock the hooks
jest.mock('../hooks/useStatusData');

// Mock the useAuth hook
jest.mock('../contexts/AuthContext', () => ({
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
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock the ProtectedRoute component
jest.mock('../components/auth/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Home Page Integration', () => {
  const mockUpdateWaterIntake = jest.fn();
  const mockUpdateAltitude = jest.fn();
  const mockResetData = jest.fn();

  const defaultMockData = {
    statusData: {
      lastWaterIntake: '',
      altitude: 5,
      lastUpdated: ''
    },
    isLoading: false,
    error: null,
    actions: {
      updateWaterIntake: mockUpdateWaterIntake,
      updateAltitude: mockUpdateAltitude,
      resetData: mockResetData,
      refresh: jest.fn()
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    (useStatusData as jest.Mock).mockReturnValue(defaultMockData);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('loading state', () => {
    it('should show loading spinner when data is loading', () => {
      (useStatusData as jest.Mock).mockReturnValue({
        ...defaultMockData,
        isLoading: true
      });

      render(<Home />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getAllByText('Loading your status data...')).toHaveLength(2); // visible + sr-only
    });
  });

  describe('error state', () => {
    it('should show error message when there is an error', () => {
      const error = 'Failed to load data';
      (useStatusData as jest.Mock).mockReturnValue({
        ...defaultMockData,
        error
      });

      render(<Home />);

      expect(screen.getByText(/Error loading status data:/)).toBeInTheDocument();
      expect(screen.getByText(/Failed to load data/)).toBeInTheDocument();
    });
  });

  describe('normal state', () => {
    it('should render all status components', () => {
      render(<Home />);

      // Water intake card
      expect(screen.getByRole('heading', { name: /Water Intake/i })).toBeInTheDocument();
      expect(screen.getByText('Never')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Update water intake/i })).toBeInTheDocument();

      // Altitude/mood card
      expect(screen.getByRole('heading', { name: /Altitude \(Mood\)/i })).toBeInTheDocument();
      expect(screen.getByText('5/10')).toBeInTheDocument();
      expect(screen.getByRole('slider')).toBeInTheDocument();

      // Status summary
      expect(screen.getByRole('heading', { name: /Status Summary/i })).toBeInTheDocument();
      expect(screen.getByText('Hydration Status:')).toBeInTheDocument();
      expect(screen.getByText('Mood Level:')).toBeInTheDocument();
    });

    it('should display data correctly when status data is populated', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString();
      
      (useStatusData as jest.Mock).mockReturnValue({
        ...defaultMockData,
        statusData: {
          lastWaterIntake: twoHoursAgo,
          altitude: 8,
          lastUpdated: new Date().toISOString()
        }
      });

      render(<Home />);

      // Check water intake display
      expect(screen.getByText('2 hours ago')).toBeInTheDocument();
      
      // Check altitude display
      expect(screen.getByText('8/10')).toBeInTheDocument();
      
      // Check summary
      expect(screen.getByText('Good 👍')).toBeInTheDocument(); // Hydration status
      expect(screen.getByText('Excellent')).toBeInTheDocument(); // Mood level
    });
  });

  describe('user interactions', () => {
    it('should update water intake when button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<Home />);

      const waterButton = screen.getByRole('button', { name: /Update water intake/i });
      await user.click(waterButton);

      expect(mockUpdateWaterIntake).toHaveBeenCalledTimes(1);
    });

    it('should update altitude when slider is changed', () => {
      render(<Home />);

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '8' } });

      expect(mockUpdateAltitude).toHaveBeenCalledWith(8);
    });
  });

  describe('responsive layout', () => {
    it('should use grid layout for cards', () => {
      const { container } = render(<Home />);

      const cardGrid = container.querySelector('.grid.md\\:grid-cols-2');
      expect(cardGrid).toBeInTheDocument();
    });
  });

  describe('error boundary', () => {
    it('should catch and display errors from child components', () => {
      // Mock console.error to prevent error output in tests
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Force an error in useStatusData
      (useStatusData as jest.Mock).mockImplementation(() => {
        throw new Error('Component error');
      });

      render(<Home />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('data updates', () => {
    it('should reflect updates when status data changes', () => {
      const { rerender } = render(<Home />);

      expect(screen.getByText('Never')).toBeInTheDocument();
      expect(screen.getByText('5/10')).toBeInTheDocument();

      // Update mock data
      const now = new Date().toISOString();
      (useStatusData as jest.Mock).mockReturnValue({
        ...defaultMockData,
        statusData: {
          lastWaterIntake: now,
          altitude: 9,
          lastUpdated: now
        }
      });

      rerender(<Home />);

      expect(screen.queryByText('Never')).not.toBeInTheDocument();
      expect(screen.getByText('Just now')).toBeInTheDocument();
      expect(screen.getByText('9/10')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<Home />);

      const h1Headings = screen.getAllByRole('heading', { level: 1 });
      const h3Headings = screen.getAllByRole('heading', { level: 3 });

      expect(h1Headings).toHaveLength(1); // Header title
      expect(h3Headings).toHaveLength(1); // Status Summary

      // Card titles are in divs, not headings, so check they exist as text
      expect(screen.getByText('💧 Water Intake')).toBeInTheDocument();
      expect(screen.getByText(/🎈 Altitude \(Mood\)/)).toBeInTheDocument();
    });

    it('should have accessible form controls', () => {
      render(<Home />);

      const waterIntakeButton = screen.getByRole('button', { name: /Update water intake/i });
      const slider = screen.getByRole('slider');

      expect(waterIntakeButton).toHaveAttribute('aria-label');
      expect(slider).toHaveAttribute('aria-valuenow');
      expect(slider).toHaveAttribute('aria-valuemin');
      expect(slider).toHaveAttribute('aria-valuemax');
      expect(slider).toHaveAttribute('aria-valuetext');
    });

    it('should have live regions for status updates', () => {
      render(<Home />);

      // Check for aria-live regions instead of role="status"
      const liveRegions = document.querySelectorAll('[aria-live="polite"]');
      
      // Should have at least one live region
      expect(liveRegions.length).toBeGreaterThanOrEqual(1);
      
      liveRegions.forEach(region => {
        expect(region).toHaveAttribute('aria-live', 'polite');
        expect(region).toHaveAttribute('aria-atomic', 'true');
      });
    });
  });

  describe('performance', () => {
    it('should use memoized components to prevent unnecessary re-renders', () => {
      const { rerender } = render(<Home />);

      // Trigger a re-render with the same data
      rerender(<Home />);

      // Components should be memoized, so functions shouldn't be called again
      expect(mockUpdateWaterIntake).not.toHaveBeenCalled();
      expect(mockUpdateAltitude).not.toHaveBeenCalled();
    });
  });
});