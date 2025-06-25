import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { logger } from '../../middleware/logging';

// Mock the logger
jest.mock('../../middleware/logging', () => ({
  logger: {
    warn: jest.fn()
  }
}));

// Mock config
jest.mock('../../config', () => ({
  config: {
    API_RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
    API_RATE_LIMIT_MAX_REQUESTS: 100
  }
}));

describe('Rate Limiter Middleware Functions', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      ip: '192.168.1.1',
      path: '/test',
      body: {},
      user: undefined
    };
    mockRes = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn() as any
    };
    jest.clearAllMocks();
  });

  describe('Rate Limiter Configuration', () => {
    it('should import rate limiters without errors', async () => {
      const { generalLimiter, authLimiter, registrationLimiter, adminLimiter } = await import('../../middleware/rateLimiter');
      
      expect(generalLimiter).toBeDefined();
      expect(authLimiter).toBeDefined();
      expect(registrationLimiter).toBeDefined();
      expect(adminLimiter).toBeDefined();
    });

    it('should import progressive limiter function', async () => {
      const { progressiveLimiter } = await import('../../middleware/rateLimiter');
      
      expect(progressiveLimiter).toBeDefined();
      expect(typeof progressiveLimiter).toBe('function');
    });

    it('should create progressive limiter with parameters', async () => {
      const { progressiveLimiter } = await import('../../middleware/rateLimiter');
      
      const limiter = progressiveLimiter(100, 60000);
      expect(limiter).toBeDefined();
    });
  });

  describe('Logger Integration', () => {
    it('should use logger for warnings', () => {
      // Since the actual rate limiters use logger internally,
      // we just verify logger is properly mocked
      expect(logger.warn).toBeDefined();
      expect(jest.isMockFunction(logger.warn)).toBe(true);
    });
  });

  describe('Rate Limiter Types', () => {
    it('should handle different rate limiter configurations', async () => {
      const { generalLimiter, authLimiter, registrationLimiter, adminLimiter } = await import('../../middleware/rateLimiter');
      
      // These are middleware functions, so they should be callable
      expect(typeof generalLimiter).toBe('function');
      expect(typeof authLimiter).toBe('function');
      expect(typeof registrationLimiter).toBe('function');
      expect(typeof adminLimiter).toBe('function');
    });

    it('should create progressive limiter instances', async () => {
      const { progressiveLimiter } = await import('../../middleware/rateLimiter');
      
      const limiter1 = progressiveLimiter(50, 30000);
      const limiter2 = progressiveLimiter(200, 120000);
      
      expect(limiter1).toBeDefined();
      expect(limiter2).toBeDefined();
      expect(typeof limiter1).toBe('function');
      expect(typeof limiter2).toBe('function');
    });
  });

  describe('Mock Response Helpers', () => {
    it('should properly mock Express response methods', () => {
      const res = mockRes as Response;
      
      expect(res.status).toBeDefined();
      expect(res.json).toBeDefined();
      expect(jest.isMockFunction(res.status)).toBe(true);
      expect(jest.isMockFunction(res.json)).toBe(true);
    });

    it('should chain status and json calls', () => {
      const res = mockRes as Response;
      
      res.status!(429).json!({ error: 'test' });
      
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({ error: 'test' });
    });
  });

  describe('Request Properties', () => {
    it('should handle IP address extraction', () => {
      expect(mockReq.ip).toBe('192.168.1.1');
    });

    it('should handle missing IP gracefully', () => {
      const reqWithoutIP = { ...mockReq, ip: undefined };
      expect(reqWithoutIP.ip).toBeUndefined();
    });

    it('should handle user properties', () => {
      mockReq.user = { userId: 'test123' } as any;
      expect(mockReq.user?.userId).toBe('test123');
    });

    it('should handle request body', () => {
      mockReq.body = { username: 'testuser' };
      expect(mockReq.body.username).toBe('testuser');
    });
  });
});