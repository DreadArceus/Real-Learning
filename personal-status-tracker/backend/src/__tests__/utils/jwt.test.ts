import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { generateToken, verifyToken, decodeToken } from '../../utils/jwt';
import { AuthTokenPayload } from '../../types';

// Mock the config
jest.mock('../../config', () => ({
  config: {
    JWT_SECRET: 'test-secret-key'
  }
}));

describe('JWT Utils', () => {
  const mockPayload: AuthTokenPayload = {
    userId: 123,
    username: 'testuser',
    role: 'admin'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockPayload);
      
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts separated by dots
      
      // Verify the token can be decoded back to the original payload
      const decoded = jwt.verify(token, 'test-secret-key') as any;
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.username).toBe(mockPayload.username);
      expect(decoded.role).toBe(mockPayload.role);
    });

    it('should include expiration time in token', () => {
      const token = generateToken(mockPayload);
      const decoded = jwt.verify(token, 'test-secret-key') as any;
      
      expect(decoded.exp).toBeDefined();
      expect(typeof decoded.exp).toBe('number');
    });

    it('should handle payload with additional properties', () => {
      const extendedPayload = {
        ...mockPayload,
        customField: 'customValue'
      } as any;

      const token = generateToken(extendedPayload);
      const decoded = jwt.verify(token, 'test-secret-key') as any;
      
      expect(decoded.customField).toBe('customValue');
    });

    it('should handle payload serialization correctly', () => {
      const payloadWithDate = {
        ...mockPayload,
        createdAt: new Date('2023-01-01T00:00:00.000Z')
      } as any;

      const token = generateToken(payloadWithDate);
      const decoded = jwt.verify(token, 'test-secret-key') as any;
      
      // Date should be serialized as string
      expect(decoded.createdAt).toBe('2023-01-01T00:00:00.000Z');
    });

    it('should generate different tokens for different payloads', () => {
      const payload1 = { ...mockPayload, userId: 1 };
      const payload2 = { ...mockPayload, userId: 2 };

      const token1 = generateToken(payload1);
      const token2 = generateToken(payload2);

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should verify and return payload for valid token', () => {
      const token = jwt.sign(mockPayload, 'test-secret-key', { expiresIn: '1h' });
      
      const result = verifyToken(token);
      
      expect(result.userId).toBe(mockPayload.userId);
      expect(result.username).toBe(mockPayload.username);
      expect(result.role).toBe(mockPayload.role);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => verifyToken(invalidToken)).toThrow('Invalid or expired token');
    });

    it('should throw error for token with wrong secret', () => {
      const token = jwt.sign(mockPayload, 'wrong-secret', { expiresIn: '1h' });
      
      expect(() => verifyToken(token)).toThrow('Invalid or expired token');
    });

    it('should throw error for expired token', () => {
      const expiredToken = jwt.sign(mockPayload, 'test-secret-key', { expiresIn: '-1h' });
      
      expect(() => verifyToken(expiredToken)).toThrow('Invalid or expired token');
    });

    it('should throw error for malformed token', () => {
      const malformedToken = 'not.a.valid.jwt.token';
      
      expect(() => verifyToken(malformedToken)).toThrow('Invalid or expired token');
    });

    it('should handle token without algorithm specified', () => {
      const token = jwt.sign(mockPayload, 'test-secret-key');
      
      const result = verifyToken(token);
      expect(result.userId).toBe(mockPayload.userId);
    });

    it('should preserve all payload properties', () => {
      const extendedPayload = {
        ...mockPayload,
        permissions: ['read', 'write'],
        metadata: { source: 'test' }
      } as any;

      const token = jwt.sign(extendedPayload, 'test-secret-key', { expiresIn: '1h' });
      const result = verifyToken(token) as any;
      
      expect(result.permissions).toEqual(['read', 'write']);
      expect(result.metadata).toEqual({ source: 'test' });
    });
  });

  describe('decodeToken', () => {
    it('should decode valid token without verification', () => {
      const token = jwt.sign(mockPayload, 'test-secret-key', { expiresIn: '1h' });
      
      const result = decodeToken(token);
      
      expect(result).not.toBeNull();
      expect(result?.userId).toBe(mockPayload.userId);
      expect(result?.username).toBe(mockPayload.username);
      expect(result?.role).toBe(mockPayload.role);
    });

    it('should decode token even with wrong secret', () => {
      const token = jwt.sign(mockPayload, 'different-secret', { expiresIn: '1h' });
      
      const result = decodeToken(token);
      
      expect(result).not.toBeNull();
      expect(result?.userId).toBe(mockPayload.userId);
    });

    it('should decode expired token', () => {
      const expiredToken = jwt.sign(mockPayload, 'test-secret-key', { expiresIn: '-1h' });
      
      const result = decodeToken(expiredToken);
      
      expect(result).not.toBeNull();
      expect(result?.userId).toBe(mockPayload.userId);
    });

    it('should return null for malformed token', () => {
      const malformedToken = 'not.a.valid.jwt';
      
      const result = decodeToken(malformedToken);
      
      expect(result).toBeNull();
    });

    it('should return null for completely invalid token', () => {
      const invalidToken = 'invalid-token';
      
      const result = decodeToken(invalidToken);
      
      expect(result).toBeNull();
    });

    it('should include JWT metadata (iat, exp) in decoded payload', () => {
      const token = jwt.sign(mockPayload, 'test-secret-key', { expiresIn: '1h' });
      
      const result = decodeToken(token) as any;
      
      expect(result?.iat).toBeDefined(); // issued at
      expect(result?.exp).toBeDefined(); // expires at
      expect(typeof result?.iat).toBe('number');
      expect(typeof result?.exp).toBe('number');
    });

    it('should preserve all custom payload properties', () => {
      const customPayload = {
        ...mockPayload,
        customData: { nested: { value: 'test' } },
        array: [1, 2, 3]
      } as any;

      const token = jwt.sign(customPayload, 'test-secret-key');
      const result = decodeToken(token) as any;
      
      expect(result?.customData).toEqual({ nested: { value: 'test' } });
      expect(result?.array).toEqual([1, 2, 3]);
    });

    it('should handle empty payload', () => {
      const emptyPayload = {};
      const token = jwt.sign(emptyPayload, 'test-secret-key');
      
      const result = decodeToken(token);
      
      expect(result).not.toBeNull();
      expect(typeof result).toBe('object');
    });
  });

  describe('Integration tests', () => {
    it('should work end-to-end: generate, verify, decode', () => {
      // Generate token
      const token = generateToken(mockPayload);
      
      // Verify token
      const verified = verifyToken(token);
      expect(verified.userId).toBe(mockPayload.userId);
      
      // Decode token
      const decoded = decodeToken(token);
      expect(decoded?.userId).toBe(mockPayload.userId);
    });

    it('should handle viewer role', () => {
      const viewerPayload: AuthTokenPayload = {
        userId: 456,
        username: 'vieweruser',
        role: 'viewer'
      };

      const token = generateToken(viewerPayload);
      const verified = verifyToken(token);
      
      expect(verified.role).toBe('viewer');
    });

    it('should handle admin role', () => {
      const adminPayload: AuthTokenPayload = {
        userId: 789,
        username: 'adminuser',
        role: 'admin'
      };

      const token = generateToken(adminPayload);
      const verified = verifyToken(token);
      
      expect(verified.role).toBe('admin');
    });
  });
});