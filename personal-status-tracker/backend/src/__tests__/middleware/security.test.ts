import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { corsOptions, sanitizeInput, requestSizeLimit, trackRequests } from '../../middleware/security';
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
    ALLOWED_ORIGINS: 'http://localhost:3000,http://localhost:3002'
  }
}));

describe('Security Middleware', () => {
  let mockReq: any;
  let mockRes: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn() as any,
      on: jest.fn() as any
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  describe('corsOptions', () => {
    it('should allow requests with no origin', (done) => {
      corsOptions.origin(undefined, (err, allow) => {
        expect(err).toBeNull();
        expect(allow).toBe(true);
        done();
      });
    });

    it('should allow requests from allowed origins', (done) => {
      corsOptions.origin('http://localhost:3000', (err, allow) => {
        expect(err).toBeNull();
        expect(allow).toBe(true);
        done();
      });
    });

    it('should allow requests from second allowed origin', (done) => {
      corsOptions.origin('http://localhost:3002', (err, allow) => {
        expect(err).toBeNull();
        expect(allow).toBe(true);
        done();
      });
    });

    it('should reject requests from disallowed origins', (done) => {
      corsOptions.origin('http://malicious-site.com', (err, allow) => {
        expect(err).toBeInstanceOf(Error);
        expect(err?.message).toBe('Not allowed by CORS');
        expect(allow).toBeUndefined();
        done();
      });
    });

    it('should have correct CORS configuration', () => {
      expect(corsOptions.credentials).toBe(true);
      expect(corsOptions.methods).toEqual(['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);
      expect(corsOptions.allowedHeaders).toEqual(['Content-Type', 'Authorization', 'X-Requested-With']);
      expect(corsOptions.exposedHeaders).toEqual(['X-Total-Count']);
      expect(corsOptions.maxAge).toBe(86400);
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize script tags from request body', () => {
      mockReq.body = {
        username: 'test<script>alert("xss")</script>user',
        message: 'Hello world'
      };

      sanitizeInput(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockReq.body.username).toBe('testuser');
      expect(mockReq.body.message).toBe('Hello world');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should sanitize javascript: protocol from strings', () => {
      mockReq.body = {
        url: 'javascript:alert("xss")',
        link: 'https://example.com'
      };

      sanitizeInput(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockReq.body.url).toBe('alert("xss")');
      expect(mockReq.body.link).toBe('https://example.com');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should sanitize event handlers from strings', () => {
      mockReq.body = {
        input: 'test onclick="alert()" value',
        normal: 'normal text'
      };

      sanitizeInput(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockReq.body.input).toBe('test "alert()" value'); // onclick= is removed
      expect(mockReq.body.normal).toBe('normal text');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should sanitize nested objects', () => {
      mockReq.body = {
        user: {
          name: 'test<script>alert("xss")</script>',
          profile: {
            bio: 'Hello javascript:alert("test") world'
          }
        }
      };

      sanitizeInput(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockReq.body.user.name).toBe('test');
      expect(mockReq.body.user.profile.bio).toBe('Hello alert("test") world'); // javascript: is removed
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should sanitize arrays', () => {
      mockReq.body = {
        tags: ['tag1', '<script>alert("xss")</script>', 'tag3']
      };

      sanitizeInput(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockReq.body.tags).toEqual(['tag1', '', 'tag3']);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should sanitize query parameters', () => {
      mockReq.query = {
        search: '<script>alert("xss")</script>test',
        filter: 'normal'
      };

      sanitizeInput(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockReq.query.search).toBe('test');
      expect(mockReq.query.filter).toBe('normal');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should sanitize route parameters', () => {
      mockReq.params = {
        id: '123<script>alert("xss")</script>',
        slug: 'normal-slug'
      };

      sanitizeInput(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockReq.params.id).toBe('123');
      expect(mockReq.params.slug).toBe('normal-slug');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should handle non-string values correctly', () => {
      mockReq.body = {
        number: 123,
        boolean: true,
        nullValue: null,
        undefinedValue: undefined
      };

      sanitizeInput(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockReq.body.number).toBe(123);
      expect(mockReq.body.boolean).toBe(true);
      expect(mockReq.body.nullValue).toBeNull();
      expect(mockReq.body.undefinedValue).toBeUndefined();
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should trim whitespace from strings', () => {
      mockReq.body = {
        username: '  testuser  ',
        email: '\temail@example.com\n'
      };

      sanitizeInput(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockReq.body.username).toBe('testuser');
      expect(mockReq.body.email).toBe('email@example.com');
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('requestSizeLimit', () => {
    it('should allow requests under size limit', () => {
      mockReq.headers = {
        'content-length': '1000000' // 1MB
      };

      requestSizeLimit(mockReq as Request, mockRes as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject requests over size limit', () => {
      mockReq.headers = {
        'content-length': '11000000' // 11MB (over 10MB limit)
      };

      requestSizeLimit(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(413);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Request entity too large',
        code: 'REQUEST_TOO_LARGE'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should handle missing content-length header', () => {
      mockReq.headers = {};

      requestSizeLimit(mockReq as Request, mockRes as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle invalid content-length header', () => {
      mockReq.headers = {
        'content-length': 'invalid'
      };

      requestSizeLimit(mockReq as Request, mockRes as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('trackRequests', () => {
    beforeEach(() => {
      // Clear any existing tracking data
      jest.clearAllMocks();
    });

    it('should track requests from new IP', () => {
      mockReq.ip = '192.168.1.1';

      trackRequests(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockReq.rateInfo).toEqual({
        limit: 1000,
        current: 1,
        remaining: 999,
        resetTime: expect.any(Date)
      });
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should increment count for existing IP', () => {
      mockReq.ip = '192.168.1.2';

      // First request
      trackRequests(mockReq as Request, mockRes as Response, nextFunction);
      
      // Second request
      trackRequests(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockReq.rateInfo?.current).toBe(2);
      expect(mockReq.rateInfo?.remaining).toBe(998);
    });

    it('should log warning for high request rates', () => {
      mockReq.ip = '192.168.1.3';

      // Simulate many requests (mock the internal tracker)
      for (let i = 0; i < 1001; i++) {
        trackRequests(mockReq as Request, mockRes as Response, nextFunction);
      }

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('High request rate detected from IP: 192.168.1.3')
      );
    });

    it('should handle missing IP address', () => {
      mockReq.ip = undefined;
      mockReq.connection = {} as any;

      trackRequests(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockReq.rateInfo).toBeDefined();
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should use connection remote address as fallback', () => {
      mockReq.ip = undefined;
      mockReq.connection = { remoteAddress: '10.0.0.1' } as any;

      trackRequests(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockReq.rateInfo).toBeDefined();
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('Security Middleware Integration', () => {
    it('should import all security middleware functions', async () => {
      const securityModule = await import('../../middleware/security');
      
      expect(securityModule.corsOptions).toBeDefined();
      expect(securityModule.sanitizeInput).toBeDefined();
      expect(securityModule.requestSizeLimit).toBeDefined();
      expect(securityModule.trackRequests).toBeDefined();
      expect(securityModule.requestTimeout).toBeDefined();
    });

    it('should handle helmet configuration import', async () => {
      const securityModule = await import('../../middleware/security');
      
      expect(securityModule.helmetConfig).toBeDefined();
    });
  });
});