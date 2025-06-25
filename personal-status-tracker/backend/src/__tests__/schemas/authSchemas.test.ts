import { describe, it, expect } from '@jest/globals';
import { LoginSchema, RegisterSchema, CreateUserSchema } from '../../schemas/authSchemas';

describe('AuthSchemas', () => {
  describe('LoginSchema', () => {
    it('should validate valid login data', () => {
      const validData = {
        username: 'testuser',
        password: 'password123'
      };

      const result = LoginSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should reject empty username', () => {
      const invalidData = {
        username: '',
        password: 'password123'
      };

      const result = LoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Username is required');
      }
    });

    it('should reject empty password', () => {
      const invalidData = {
        username: 'testuser',
        password: ''
      };

      const result = LoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Password is required');
      }
    });

    it('should reject username longer than 50 characters', () => {
      const invalidData = {
        username: 'a'.repeat(51),
        password: 'password123'
      };

      const result = LoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('50');
      }
    });

    it('should reject missing username field', () => {
      const invalidData = {
        password: 'password123'
      };

      const result = LoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('username');
      }
    });

    it('should reject missing password field', () => {
      const invalidData = {
        username: 'testuser'
      };

      const result = LoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('password');
      }
    });
  });

  describe('RegisterSchema', () => {
    it('should validate valid registration data', () => {
      const validData = {
        username: 'testuser',
        password: 'password123',
        privacyPolicyAccepted: true
      };

      const result = RegisterSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should reject username shorter than 3 characters', () => {
      const invalidData = {
        username: 'ab',
        password: 'password123',
        privacyPolicyAccepted: true
      };

      const result = RegisterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Username must be at least 3 characters');
      }
    });

    it('should reject password shorter than 6 characters', () => {
      const invalidData = {
        username: 'testuser',
        password: '12345',
        privacyPolicyAccepted: true
      };

      const result = RegisterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Password must be at least 6 characters');
      }
    });

    it('should reject if privacy policy not accepted', () => {
      const invalidData = {
        username: 'testuser',
        password: 'password123',
        privacyPolicyAccepted: false
      };

      const result = RegisterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('You must accept the privacy policy to register');
      }
    });

    it('should reject username with invalid characters', () => {
      const invalidData = {
        username: 'test@user!',
        password: 'password123',
        privacyPolicyAccepted: true
      };

      const result = RegisterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Username can only contain alphanumeric characters, hyphens, and underscores');
      }
    });

    it('should accept username with valid special characters', () => {
      const validData = {
        username: 'test_user-123',
        password: 'password123',
        privacyPolicyAccepted: true
      };

      const result = RegisterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject username longer than 50 characters', () => {
      const invalidData = {
        username: 'a'.repeat(51),
        password: 'password123',
        privacyPolicyAccepted: true
      };

      const result = RegisterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('50');
      }
    });

    it('should reject missing privacy policy field', () => {
      const invalidData = {
        username: 'testuser',
        password: 'password123'
      };

      const result = RegisterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('privacyPolicyAccepted');
      }
    });
  });

  describe('CreateUserSchema', () => {
    it('should validate valid user creation data', () => {
      const validData = {
        username: 'testuser',
        password: 'password123',
        role: 'admin' as const
      };

      const result = CreateUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should default role to viewer when not provided', () => {
      const dataWithoutRole = {
        username: 'testuser',
        password: 'password123'
      };

      const result = CreateUserSchema.safeParse(dataWithoutRole);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('viewer');
      }
    });

    it('should accept admin role', () => {
      const validData = {
        username: 'adminuser',
        password: 'password123',
        role: 'admin' as const
      };

      const result = CreateUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('admin');
      }
    });

    it('should accept viewer role', () => {
      const validData = {
        username: 'vieweruser',
        password: 'password123',
        role: 'viewer' as const
      };

      const result = CreateUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('viewer');
      }
    });

    it('should reject invalid role', () => {
      const invalidData = {
        username: 'testuser',
        password: 'password123',
        role: 'superuser'
      };

      const result = CreateUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Invalid enum value');
      }
    });

    it('should apply same username validation as RegisterSchema', () => {
      const invalidData = {
        username: 'ab',
        password: 'password123',
        role: 'viewer' as const
      };

      const result = CreateUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Username must be at least 3 characters');
      }
    });

    it('should apply same password validation as RegisterSchema', () => {
      const invalidData = {
        username: 'testuser',
        password: '12345',
        role: 'viewer' as const
      };

      const result = CreateUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Password must be at least 6 characters');
      }
    });

    it('should apply same username character validation', () => {
      const invalidData = {
        username: 'test@user',
        password: 'password123',
        role: 'viewer' as const
      };

      const result = CreateUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Username can only contain alphanumeric characters, hyphens, and underscores');
      }
    });
  });
});