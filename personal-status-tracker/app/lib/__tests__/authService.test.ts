import { authService } from '../authService';

// Mock js-cookie
jest.mock('js-cookie', () => ({
  set: jest.fn(),
  get: jest.fn(),
  remove: jest.fn()
}));

import Cookies from 'js-cookie';

const mockCookies = Cookies as jest.Mocked<typeof Cookies>;

// Mock fetch
global.fetch = jest.fn();

describe('authService', () => {
  const API_URL = 'http://localhost:3001';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_API_URL = API_URL;
  });

  describe('login', () => {
    it('should login successfully and store token and user', async () => {
      const credentials = { username: 'admin', password: 'password' };
      const mockResponse = {
        success: true,
        data: {
          token: 'mock-token',
          user: { id: 1, username: 'admin', role: 'admin' }
        }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await authService.login(credentials);

      expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      expect(mockCookies.set).toHaveBeenCalledWith('auth_token', 'mock-token', {
        expires: 7,
        secure: false,
        sameSite: 'strict'
      });
      
      expect(result).toEqual({
        user: mockResponse.data.user,
        token: 'mock-token'
      });
    });

    it('should handle login failure', async () => {
      const credentials = { username: 'admin', password: 'wrong' };
      const mockResponse = {
        success: false,
        error: 'Invalid credentials'
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve(mockResponse)
      });

      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
    });

    it('should handle network errors', async () => {
      const credentials = { username: 'admin', password: 'password' };

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(authService.login(credentials)).rejects.toThrow('Network error');
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const userData = { username: 'newuser', password: 'password' };
      const mockResponse = {
        success: true,
        data: { id: 1, username: 'newuser', role: 'viewer' }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await authService.register(userData);

      expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle registration failure', async () => {
      const userData = { username: 'existinguser', password: 'password' };
      const mockResponse = {
        success: false,
        error: 'Username already exists'
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve(mockResponse)
      });

      await expect(authService.register(userData)).rejects.toThrow('Username already exists');
    });
  });

  describe('logout', () => {
    it('should clear stored auth data', async () => {
      mockCookies.get.mockReturnValue('mock-token');
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      await authService.logout();

      expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      });

      expect(mockCookies.remove).toHaveBeenCalledWith('auth_token');
    });

    it('should remove token even if logout request fails', async () => {
      mockCookies.get.mockReturnValue('mock-token');
      
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await authService.logout();

      expect(mockCookies.remove).toHaveBeenCalledWith('auth_token');
    });
  });

  describe('getToken', () => {
    it('should return stored token', () => {
      mockCookies.get.mockReturnValue('stored-token');

      const token = authService.getToken();

      expect(mockCookies.get).toHaveBeenCalledWith('auth_token');
      expect(token).toBe('stored-token');
    });

    it('should return null if no token stored', () => {
      mockCookies.get.mockReturnValue(undefined);

      const token = authService.getToken();

      expect(token).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return user data when valid token', async () => {
      const mockUser = { id: 1, username: 'admin', role: 'admin' };
      mockCookies.get.mockReturnValue('valid-token');

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockUser })
      });

      const user = await authService.getCurrentUser();

      expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      expect(user).toEqual(mockUser);
    });

    it('should return null if no token', async () => {
      mockCookies.get.mockReturnValue(null);

      const user = await authService.getCurrentUser();

      expect(user).toBeNull();
    });

    it('should handle invalid token response', async () => {
      mockCookies.get.mockReturnValue('invalid-token');

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401
      });

      const user = await authService.getCurrentUser();

      expect(user).toBeNull();
      expect(mockCookies.remove).toHaveBeenCalledWith('auth_token');
    });

    it('should handle network errors', async () => {
      mockCookies.get.mockReturnValue('valid-token');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const user = await authService.getCurrentUser();

      expect(user).toBeNull();
      expect(mockCookies.remove).toHaveBeenCalledWith('auth_token');
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('isTokenValid', () => {
    it('should return true for valid JWT token', () => {
      // Create a mock JWT token with future expiration
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const payload = { exp: futureTime };
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;
      
      mockCookies.get.mockReturnValue(token);

      const isValid = authService.isTokenValid();

      expect(isValid).toBe(true);
    });

    it('should return false for expired JWT token', () => {
      // Create a mock JWT token with past expiration
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const payload = { exp: pastTime };
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;
      
      mockCookies.get.mockReturnValue(token);

      const isValid = authService.isTokenValid();

      expect(isValid).toBe(false);
    });

    it('should return false when no token', () => {
      mockCookies.get.mockReturnValue(null);

      const isValid = authService.isTokenValid();

      expect(isValid).toBe(false);
    });

    it('should return false for invalid JWT format', () => {
      mockCookies.get.mockReturnValue('invalid-token');

      const isValid = authService.isTokenValid();

      expect(isValid).toBe(false);
    });
  });
});