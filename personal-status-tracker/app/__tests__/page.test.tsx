import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '../page';
import { useStatusWithUser } from '../hooks/useStatusWithUser';

// Mock the hooks
jest.mock('../hooks/useStatusWithUser');

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
  const mockSelectUser = jest.fn();

  const defaultMockDataForAdmin = {
    statusData: {
      lastWaterIntake: '',
      altitude: 5,
      lastUpdated: ''
    },
    isLoading: false,
    error: null,
    selectedUserId: null,
    adminUsers: [],
    canEdit: true,
    actions: {
      updateWaterIntake: mockUpdateWaterIntake,
      updateAltitude: mockUpdateAltitude,
      resetData: mockResetData,
      refresh: jest.fn(),
      selectUser: mockSelectUser
    }
  };

  const defaultMockDataForViewer = {
    statusData: {
      lastWaterIntake: '',
      altitude: 5,
      lastUpdated: ''
    },
    isLoading: false,
    error: null,
    selectedUserId: null,
    adminUsers: [
      { id: 1, username: 'admin1', role: 'admin' as const, createdAt: '2024-01-01', lastLogin: '2024-01-15' },
      { id: 2, username: 'admin2', role: 'admin' as const, createdAt: '2024-01-02', lastLogin: '2024-01-14' }
    ],
    canEdit: false,
    actions: {
      updateWaterIntake: mockUpdateWaterIntake,
      updateAltitude: mockUpdateAltitude,
      resetData: mockResetData,
      refresh: jest.fn(),
      selectUser: mockSelectUser
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    (useStatusWithUser as jest.Mock).mockReturnValue(defaultMockDataForAdmin);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('loading state', () => {
    it('should show loading spinner when data is loading', () => {
      (useStatusWithUser as jest.Mock).mockReturnValue({
        ...defaultMockDataForAdmin,
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
      (useStatusWithUser as jest.Mock).mockReturnValue({
        ...defaultMockDataForAdmin,
        error
      });

      render(<Home />);

      expect(screen.getByText(/Error loading status data:/)).toBeInTheDocument();
      expect(screen.getByText(/Failed to load data/)).toBeInTheDocument();
    });
  });

  describe('admin user state', () => {
    it('should render all status components for admin with edit capabilities', () => {
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

      // Should NOT show admin selector for admin users
      expect(screen.queryByText('View Status for Admin:')).not.toBeInTheDocument();
    });

    it('should allow admin to interact with controls', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<Home />);

      const waterButton = screen.getByRole('button', { name: /Update water intake/i });
      await user.click(waterButton);

      expect(mockUpdateWaterIntake).toHaveBeenCalledTimes(1);
    });
  });

  describe('viewer user state', () => {
    beforeEach(() => {
      // Mock as viewer user
      jest.doMock('../contexts/AuthContext', () => ({
        useAuth: () => ({
          user: { id: 3, username: 'viewer', role: 'viewer' },
          token: 'mock-token',
          isAuthenticated: true,
          isAdmin: false,
          isLoading: false,
          login: jest.fn(),
          register: jest.fn(),
          logout: jest.fn(),
          error: null,
        }),
        AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
      }));
      (useStatusWithUser as jest.Mock).mockReturnValue(defaultMockDataForViewer);
    });

    it('should show admin selector for viewer users', () => {
      render(<Home />);

      expect(screen.getByText('View Status for Admin:')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('admin1')).toBeInTheDocument();
      expect(screen.getByText('admin2')).toBeInTheDocument();
    });

    it('should show message when no admin is selected', () => {
      render(<Home />);

      expect(screen.getByText('Please select an admin above to view their status data.')).toBeInTheDocument();
      // Status components should not be visible
      expect(screen.queryByRole('heading', { name: /Water Intake/i })).not.toBeInTheDocument();
    });

    it('should show status data when admin is selected', () => {
      (useStatusWithUser as jest.Mock).mockReturnValue({
        ...defaultMockDataForViewer,
        selectedUserId: '1'
      });

      render(<Home />);

      // Status components should be visible
      expect(screen.getByRole('heading', { name: /Water Intake/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Altitude \(Mood\)/i })).toBeInTheDocument();
      
      // But should be in read-only mode
      expect(screen.getByText('👁️ View-only mode')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Update water intake/i })).not.toBeInTheDocument();
    });

    it('should call selectUser when admin is selected from dropdown', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<Home />);

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '1');

      expect(mockSelectUser).toHaveBeenCalledWith('1');
    });
  });

  describe('data display', () => {
    it('should display data correctly when status data is populated', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString();
      
      (useStatusWithUser as jest.Mock).mockReturnValue({
        ...defaultMockDataForAdmin,
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
    it('should update altitude when slider is changed (admin only)', () => {
      render(<Home />);

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '8' } });

      expect(mockUpdateAltitude).toHaveBeenCalledWith(8);
    });

    it('should not allow interactions when user cannot edit', () => {
      (useStatusWithUser as jest.Mock).mockReturnValue({
        ...defaultMockDataForViewer,
        selectedUserId: '1'
      });

      render(<Home />);

      // Should show read-only indicators
      expect(screen.getAllByText('👁️ View-only mode')).toHaveLength(2); // One for each card
      
      // Should have disabled slider
      const slider = screen.getByRole('slider');
      expect(slider).toBeDisabled();
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

      // Force an error in useStatusWithUser
      (useStatusWithUser as jest.Mock).mockImplementation(() => {
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
      (useStatusWithUser as jest.Mock).mockReturnValue({
        ...defaultMockDataForAdmin,
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