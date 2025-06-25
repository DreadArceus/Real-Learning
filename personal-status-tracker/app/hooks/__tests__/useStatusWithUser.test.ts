import { renderHook, act } from '@testing-library/react';
import { useStatusWithUser } from '../useStatusWithUser';
import { apiService } from '@/app/lib/api';
import { useAuth } from '@/app/contexts/AuthContext';

// Mock dependencies
jest.mock('@/app/lib/api');
jest.mock('@/app/contexts/AuthContext');
jest.mock('@/app/types/status', () => ({
  ALTITUDE_CONFIG: {
    MIN: 1,
    MAX: 10,
    DEFAULT: 5,
    THRESHOLDS: {
      EXCELLENT: 8,
      GOOD: 6,
      FAIR: 4
    }
  }
}));
jest.mock('@/app/lib/utils/statusHelpers', () => ({
  validateAltitude: (value: number) => Math.max(1, Math.min(10, value))
}));

const mockApiService = apiService as jest.Mocked<typeof apiService>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('useStatusWithUser', () => {
  const mockAdminUsers = [
    { id: 1, username: 'admin1', role: 'admin' as const, createdAt: '2024-01-01', lastLogin: '2024-01-15' },
    { id: 2, username: 'admin2', role: 'admin' as const, createdAt: '2024-01-02', lastLogin: '2024-01-14' }
  ];

  const mockStatusData = {
    lastWaterIntake: '2024-01-15T10:00:00Z',
    altitude: 7,
    lastUpdated: '2024-01-15T10:00:00Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiService.getLatestStatus.mockResolvedValue(mockStatusData);
    mockApiService.getAdminUsers.mockResolvedValue(mockAdminUsers);
    mockApiService.createStatus.mockResolvedValue(mockStatusData);
    mockApiService.updateStatus.mockResolvedValue(mockStatusData);
    mockApiService.deleteAllStatus.mockResolvedValue();
  });

  describe('admin user behavior', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'admin1', role: 'admin' },
        token: 'mock-token',
        isAuthenticated: true,
        isAdmin: true,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        error: null,
      });
    });

    it('should load own status data for admin users', async () => {
      const { result } = renderHook(() => useStatusWithUser());

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockApiService.getLatestStatus).toHaveBeenCalledWith(undefined);
      expect(result.current.statusData).toEqual(mockStatusData);
      expect(result.current.canEdit).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('should not load admin users for admin users', async () => {
      renderHook(() => useStatusWithUser());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockApiService.getAdminUsers).not.toHaveBeenCalled();
    });

    it('should allow admin to update water intake', async () => {
      const { result } = renderHook(() => useStatusWithUser());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.actions.updateWaterIntake();
      });

      expect(mockApiService.updateStatus).toHaveBeenCalledWith({
        lastWaterIntake: expect.any(String)
      });
    });

    it('should allow admin to update altitude', async () => {
      const { result } = renderHook(() => useStatusWithUser());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.actions.updateAltitude(8);
      });

      expect(mockApiService.updateStatus).toHaveBeenCalledWith({
        altitude: 8
      });
    });

    it('should allow admin to reset data', async () => {
      const { result } = renderHook(() => useStatusWithUser());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.actions.resetData();
      });

      expect(mockApiService.deleteAllStatus).toHaveBeenCalled();
    });
  });

  describe('viewer user behavior', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 3, username: 'viewer1', role: 'viewer' },
        token: 'mock-token',
        isAuthenticated: true,
        isAdmin: false,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        error: null,
      });
    });

    it('should load admin users for viewer users', async () => {
      const { result } = renderHook(() => useStatusWithUser());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockApiService.getAdminUsers).toHaveBeenCalled();
      expect(result.current.adminUsers).toEqual(mockAdminUsers);
    });

    it('should auto-select first admin when available', async () => {
      const { result } = renderHook(() => useStatusWithUser());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.selectedUserId).toBe('1');
    });

    it('should load selected admin status data', async () => {
      const { result } = renderHook(() => useStatusWithUser());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockApiService.getLatestStatus).toHaveBeenCalledWith('1');
      expect(result.current.statusData).toEqual(mockStatusData);
      expect(result.current.canEdit).toBe(false);
    });

    it('should not allow viewer to update data', async () => {
      const { result } = renderHook(() => useStatusWithUser());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.actions.updateWaterIntake();
      });

      expect(mockApiService.updateStatus).not.toHaveBeenCalled();
      expect(result.current.error).toBe('Only admins can update status data');
    });

    it('should allow viewer to select different admin', async () => {
      const { result } = renderHook(() => useStatusWithUser());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        result.current.actions.selectUser('2');
      });

      expect(result.current.selectedUserId).toBe('2');
    });

    it('should reload data when different admin is selected', async () => {
      const { result } = renderHook(() => useStatusWithUser());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Clear previous calls
      mockApiService.getLatestStatus.mockClear();

      await act(async () => {
        result.current.actions.selectUser('2');
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockApiService.getLatestStatus).toHaveBeenCalledWith('2');
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'admin1', role: 'admin' },
        token: 'mock-token',
        isAuthenticated: true,
        isAdmin: true,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        error: null,
      });
    });

    it('should handle API errors when loading status', async () => {
      mockApiService.getLatestStatus.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useStatusWithUser());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.error).toBe('API Error');
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle errors when updating status', async () => {
      mockApiService.updateStatus.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useStatusWithUser());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.actions.updateWaterIntake();
      });

      expect(result.current.error).toBe('Update failed');
    });
  });

  describe('data creation vs update logic', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'admin1', role: 'admin' },
        token: 'mock-token',
        isAuthenticated: true,
        isAdmin: true,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        error: null,
      });
    });

    it('should create new status when no existing data', async () => {
      mockApiService.getLatestStatus.mockResolvedValue(null);

      const { result } = renderHook(() => useStatusWithUser());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.actions.updateWaterIntake();
      });

      expect(mockApiService.createStatus).toHaveBeenCalledWith({
        lastWaterIntake: expect.any(String),
        altitude: 5, // Default altitude
        lastUpdated: expect.any(String)
      });
    });

    it('should update existing status when data exists', async () => {
      const { result } = renderHook(() => useStatusWithUser());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.actions.updateWaterIntake();
      });

      expect(mockApiService.updateStatus).toHaveBeenCalledWith({
        lastWaterIntake: expect.any(String)
      });
      expect(mockApiService.createStatus).not.toHaveBeenCalled();
    });
  });

  describe('user state changes', () => {
    it('should handle user not being available initially', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        token: null,
        isAuthenticated: false,
        isAdmin: false,
        isLoading: true,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        error: null,
      });

      const { result } = renderHook(() => useStatusWithUser());

      expect(result.current.isLoading).toBe(true);
      expect(mockApiService.getLatestStatus).not.toHaveBeenCalled();
    });
  });
});