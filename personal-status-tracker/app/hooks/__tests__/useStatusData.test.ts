import { renderHook, act } from '@testing-library/react';
import { useStatusData } from '../useStatusData';
import { ALTITUDE_CONFIG } from '@/app/types/status';

// Mock the useLocalStorage hook
jest.mock('../useLocalStorage', () => ({
  useLocalStorage: jest.fn()
}));

import { useLocalStorage } from '../useLocalStorage';

describe('useStatusData', () => {
  let mockSetStatusData: jest.Mock;
  let mockStatusData: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    
    mockSetStatusData = jest.fn();
    mockStatusData = {
      lastWaterIntake: '',
      altitude: ALTITUDE_CONFIG.DEFAULT,
      lastUpdated: ''
    };
    
    (useLocalStorage as jest.Mock).mockReturnValue([
      mockStatusData,
      mockSetStatusData,
      false, // isLoading
      null   // error
    ]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useStatusData());
    
    expect(result.current.statusData).toEqual({
      lastWaterIntake: '',
      altitude: ALTITUDE_CONFIG.DEFAULT,
      lastUpdated: ''
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should update water intake with current timestamp', () => {
    const { result } = renderHook(() => useStatusData());
    
    act(() => {
      result.current.actions.updateWaterIntake();
    });
    
    expect(mockSetStatusData).toHaveBeenCalledWith(expect.any(Function));
    
    // Get the function passed to setStatusData and call it
    const updateFunction = mockSetStatusData.mock.calls[0][0];
    const newData = updateFunction(mockStatusData);
    
    expect(newData.lastWaterIntake).toBe('2024-01-15T12:00:00.000Z');
    expect(newData.lastUpdated).toBe('2024-01-15T12:00:00.000Z');
    expect(newData.altitude).toBe(ALTITUDE_CONFIG.DEFAULT);
  });

  it('should update altitude with validation', () => {
    const { result } = renderHook(() => useStatusData());
    
    // Test valid altitude
    act(() => {
      result.current.actions.updateAltitude(7);
    });
    
    expect(mockSetStatusData).toHaveBeenCalledWith(expect.any(Function));
    
    const updateFunction = mockSetStatusData.mock.calls[0][0];
    const newData = updateFunction(mockStatusData);
    
    expect(newData.altitude).toBe(7);
    expect(newData.lastUpdated).toBe('2024-01-15T12:00:00.000Z');
  });

  it('should validate altitude values', () => {
    const { result } = renderHook(() => useStatusData());
    
    // Test altitude below minimum
    act(() => {
      result.current.actions.updateAltitude(0);
    });
    
    let updateFunction = mockSetStatusData.mock.calls[0][0];
    let newData = updateFunction(mockStatusData);
    expect(newData.altitude).toBe(ALTITUDE_CONFIG.MIN);
    
    // Test altitude above maximum
    act(() => {
      result.current.actions.updateAltitude(15);
    });
    
    updateFunction = mockSetStatusData.mock.calls[1][0];
    newData = updateFunction(mockStatusData);
    expect(newData.altitude).toBe(ALTITUDE_CONFIG.MAX);
  });

  it('should reset data to initial values', () => {
    const { result } = renderHook(() => useStatusData());
    
    act(() => {
      result.current.actions.resetData();
    });
    
    expect(mockSetStatusData).toHaveBeenCalledWith({
      lastWaterIntake: '',
      altitude: ALTITUDE_CONFIG.DEFAULT,
      lastUpdated: ''
    });
  });

  it('should pass through loading state', () => {
    (useLocalStorage as jest.Mock).mockReturnValue([
      mockStatusData,
      mockSetStatusData,
      true, // isLoading
      null
    ]);
    
    const { result } = renderHook(() => useStatusData());
    expect(result.current.isLoading).toBe(true);
  });

  it('should pass through error state', () => {
    const mockError = new Error('Storage error');
    (useLocalStorage as jest.Mock).mockReturnValue([
      mockStatusData,
      mockSetStatusData,
      false,
      mockError
    ]);
    
    const { result } = renderHook(() => useStatusData());
    expect(result.current.error).toBe(mockError);
  });

  it('should memoize the return value', () => {
    const { result, rerender } = renderHook(() => useStatusData());
    
    const firstResult = result.current;
    
    // Rerender without changing dependencies
    rerender();
    
    const secondResult = result.current;
    
    // The object reference should be the same
    expect(firstResult).toBe(secondResult);
    expect(firstResult.actions).toBe(secondResult.actions);
  });

  it('should update memoized value when dependencies change', () => {
    const { result, rerender } = renderHook(() => useStatusData());
    
    const firstResult = result.current;
    
    // Update the mock to return different data
    mockStatusData = {
      lastWaterIntake: '2024-01-15T11:00:00Z',
      altitude: 8,
      lastUpdated: '2024-01-15T11:00:00Z'
    };
    
    (useLocalStorage as jest.Mock).mockReturnValue([
      mockStatusData,
      mockSetStatusData,
      false,
      null
    ]);
    
    rerender();
    
    const secondResult = result.current;
    
    // The object reference should be different
    expect(firstResult).not.toBe(secondResult);
    expect(secondResult.statusData.altitude).toBe(8);
  });
});