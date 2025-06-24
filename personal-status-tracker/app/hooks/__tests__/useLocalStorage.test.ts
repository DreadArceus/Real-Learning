import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    localStorage.clear();
    
    // Reset localStorage mock implementation
    (global.localStorage.getItem as jest.Mock).mockImplementation((key) => {
      const store: { [key: string]: string } = {};
      return store[key] || null;
    });
    
    (global.localStorage.setItem as jest.Mock).mockImplementation((key, value) => {
      const store: { [key: string]: string } = {};
      store[key] = value;
    });
  });

  it('should initialize with initial value when localStorage is empty', () => {
    (global.localStorage.getItem as jest.Mock).mockReturnValue(null);
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'));
    
    expect(result.current[0]).toBe('initial-value');
    expect(result.current[2]).toBe(false); // isLoading
    expect(result.current[3]).toBe(null); // error
  });

  it('should initialize with value from localStorage', () => {
    const storedValue = { name: 'John', age: 30 };
    (global.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(storedValue));
    
    const { result } = renderHook(() => useLocalStorage('test-key', {}));
    
    expect(result.current[0]).toEqual(storedValue);
  });

  it('should update localStorage when value is set', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    
    act(() => {
      result.current[1]('new-value');
    });
    
    expect(result.current[0]).toBe('new-value');
    expect(global.localStorage.setItem).toHaveBeenCalledWith('test-key', '"new-value"');
  });

  it('should handle function updates', () => {
    const { result } = renderHook(() => useLocalStorage('counter', 0));
    
    act(() => {
      result.current[1]((prev) => prev + 1);
    });
    
    expect(result.current[0]).toBe(1);
    expect(global.localStorage.setItem).toHaveBeenCalledWith('counter', '1');
  });

  it('should handle complex objects', () => {
    interface User {
      name: string;
      preferences: {
        theme: string;
        notifications: boolean;
      };
    }
    
    const initialUser: User = {
      name: 'Test User',
      preferences: {
        theme: 'light',
        notifications: true
      }
    };
    
    const { result } = renderHook(() => useLocalStorage<User>('user', initialUser));
    
    act(() => {
      result.current[1]({
        ...result.current[0],
        preferences: {
          ...result.current[0].preferences,
          theme: 'dark'
        }
      });
    });
    
    expect(result.current[0].preferences.theme).toBe('dark');
    expect(global.localStorage.setItem).toHaveBeenCalledWith(
      'user',
      JSON.stringify({
        name: 'Test User',
        preferences: {
          theme: 'dark',
          notifications: true
        }
      })
    );
  });

  it('should handle localStorage errors gracefully', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    (global.localStorage.getItem as jest.Mock).mockImplementation(() => {
      throw new Error('Storage error');
    });
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    
    expect(result.current[0]).toBe('default');
    expect(result.current[3]).toBeInstanceOf(Error);
    expect(result.current[3]?.message).toBe('Storage error');
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });

  it('should handle JSON parse errors', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    (global.localStorage.getItem as jest.Mock).mockReturnValue('invalid-json');
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    
    expect(result.current[0]).toBe('default');
    expect(result.current[3]).toBeInstanceOf(Error);
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });

  it('should handle setItem errors', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    (global.localStorage.setItem as jest.Mock).mockImplementation(() => {
      throw new Error('Storage full');
    });
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    
    act(() => {
      result.current[1]('new-value');
    });
    
    expect(result.current[0]).toBe('new-value'); // State still updates
    expect(result.current[3]).toBeInstanceOf(Error);
    expect(result.current[3]?.message).toBe('Storage full');
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });

  it('should work in SSR environment', () => {
    // Test SSR by checking initial value when localStorage is empty
    (global.localStorage.getItem as jest.Mock).mockReturnValue(null);
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'ssr-value'));
    
    expect(result.current[0]).toBe('ssr-value');
    expect(result.current[2]).toBe(false); // isLoading should be false after mount
  });
});