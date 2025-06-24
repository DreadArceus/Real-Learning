import { Request, Response, NextFunction } from 'express';
import { authenticateToken, requireAdmin } from '../../middleware/auth';
import { config } from '../../config';
import * as jwt from 'jsonwebtoken';

// Mock JWT
jest.mock('jsonwebtoken');
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let jsonSpy: jest.SpyInstance;
  let statusSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    
    jsonSpy = jest.fn();
    statusSpy = jest.fn().mockReturnThis();
    
    mockResponse = {
      status: statusSpy,
      json: jsonSpy,
    } as any;
    
    // Fix: statusSpy should return mockResponse so chaining works
    statusSpy.mockReturnValue(mockResponse);
    
    mockNext = jest.fn() as jest.MockedFunction<NextFunction>;
    
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token', () => {
      const token = 'valid.jwt.token';
      const payload = {
        userId: 1,
        username: 'testuser',
        role: 'viewer',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400 // 24 hours
      };

      mockRequest.headers = {
        authorization: `Bearer ${token}`
      };

      (mockJwt.verify as jest.Mock).mockReturnValue(payload);

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockJwt.verify).toHaveBeenCalledWith(token, config.JWT_SECRET);
      expect(mockRequest.user).toEqual(payload);
      expect(mockNext).toHaveBeenCalledWith();
      expect(statusSpy).not.toHaveBeenCalled();
    });

    it('should reject request without authorization header', () => {
      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Access token required',
        code: 'AUTH_TOKEN_REQUIRED'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject malformed authorization header', () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat'
      };

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Access token required',
        code: 'AUTH_TOKEN_REQUIRED'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid token', () => {
      const token = 'invalid.jwt.token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`
      };

      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token',
        code: 'AUTH_TOKEN_INVALID'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject expired token', () => {
      const token = 'expired.jwt.token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`
      };

      const error = new Error('jwt expired');
      error.name = 'TokenExpiredError';
      mockJwt.verify.mockImplementation(() => {
        throw error;
      });

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Token expired',
        code: 'AUTH_TOKEN_EXPIRED'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle JsonWebTokenError', () => {
      const token = 'malformed.jwt.token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`
      };

      const error = new Error('invalid signature');
      error.name = 'JsonWebTokenError';
      mockJwt.verify.mockImplementation(() => {
        throw error;
      });

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token',
        code: 'AUTH_TOKEN_INVALID'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle case-insensitive Bearer prefix', () => {
      const token = 'valid.jwt.token';
      const payload = {
        userId: 1,
        username: 'testuser',
        role: 'viewer'
      };

      mockRequest.headers = {
        authorization: `bearer ${token}` // lowercase
      };

      (mockJwt.verify as jest.Mock).mockReturnValue(payload);

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockJwt.verify).toHaveBeenCalledWith(token, config.JWT_SECRET);
      expect(mockRequest.user).toEqual(payload);
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('requireAdmin', () => {
    beforeEach(() => {
      // Set up authenticated user
      mockRequest.user = {
        userId: 1,
        username: 'testuser',
        role: 'admin'
      };
    });

    it('should allow admin users', () => {
      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(statusSpy).not.toHaveBeenCalled();
    });

    it('should reject viewer users', () => {
      mockRequest.user!.role = 'viewer';

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(403);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Admin access required',
        code: 'AUTH_INSUFFICIENT_PRIVILEGES'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject if no user in request', () => {
      mockRequest.user = undefined;

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(403);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Admin access required',
        code: 'AUTH_INSUFFICIENT_PRIVILEGES'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject if user has no role', () => {
      if (mockRequest.user) {
        delete (mockRequest.user as any).role;
      }

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(403);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Admin access required',
        code: 'AUTH_INSUFFICIENT_PRIVILEGES'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid role', () => {
      mockRequest.user!.role = 'invalid' as any;

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(403);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Admin access required',
        code: 'AUTH_INSUFFICIENT_PRIVILEGES'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('middleware chaining', () => {
    it('should work with both middlewares for admin endpoints', () => {
      const token = 'valid.jwt.token';
      const payload = {
        userId: 1,
        username: 'admin',
        role: 'admin'
      };

      mockRequest.headers = {
        authorization: `Bearer ${token}`
      };

      (mockJwt.verify as jest.Mock).mockReturnValue(payload);

      // First middleware: authenticateToken
      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual(payload);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Reset next mock for second middleware
      (mockNext as jest.Mock).mockClear();

      // Second middleware: requireAdmin
      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(statusSpy).not.toHaveBeenCalled();
    });

    it('should fail at first middleware if no token', () => {
      // First middleware: authenticateToken
      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();

      // Second middleware should not be called
      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});