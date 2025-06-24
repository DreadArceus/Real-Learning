import { z } from 'zod';
import {
  CreateStatusSchema,
  UpdateStatusSchema,
  UserIdSchema,
  LimitSchema
} from '../../schemas/statusSchemas';

describe('Status Schemas', () => {
  describe('CreateStatusSchema', () => {
    it('should validate valid create status data', () => {
      const validData = {
        lastWaterIntake: '2024-01-15T12:00:00.000Z',
        altitude: 7
      };

      const result = CreateStatusSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should reject invalid datetime format', () => {
      const invalidData = {
        lastWaterIntake: 'invalid-date',
        altitude: 7
      };

      expect(() => CreateStatusSchema.parse(invalidData)).toThrow();
    });

    it('should reject altitude below minimum', () => {
      const invalidData = {
        lastWaterIntake: '2024-01-15T12:00:00.000Z',
        altitude: 0
      };

      expect(() => CreateStatusSchema.parse(invalidData)).toThrow();
    });

    it('should reject altitude above maximum', () => {
      const invalidData = {
        lastWaterIntake: '2024-01-15T12:00:00.000Z',
        altitude: 11
      };

      expect(() => CreateStatusSchema.parse(invalidData)).toThrow();
    });

    it('should reject non-integer altitude', () => {
      const invalidData = {
        lastWaterIntake: '2024-01-15T12:00:00.000Z',
        altitude: 7.5
      };

      expect(() => CreateStatusSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing required fields', () => {
      expect(() => CreateStatusSchema.parse({})).toThrow();
      expect(() => CreateStatusSchema.parse({ lastWaterIntake: '2024-01-15T12:00:00.000Z' })).toThrow();
      expect(() => CreateStatusSchema.parse({ altitude: 7 })).toThrow();
    });
  });

  describe('UpdateStatusSchema', () => {
    it('should validate partial update with lastWaterIntake only', () => {
      const validData = {
        lastWaterIntake: '2024-01-15T13:00:00.000Z'
      };

      const result = UpdateStatusSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate partial update with altitude only', () => {
      const validData = {
        altitude: 8
      };

      const result = UpdateStatusSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate update with both fields', () => {
      const validData = {
        lastWaterIntake: '2024-01-15T13:00:00.000Z',
        altitude: 8
      };

      const result = UpdateStatusSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should reject empty update object', () => {
      expect(() => UpdateStatusSchema.parse({})).toThrow();
    });

    it('should reject invalid datetime in update', () => {
      const invalidData = {
        lastWaterIntake: 'not-a-date'
      };

      expect(() => UpdateStatusSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid altitude in update', () => {
      const invalidData = {
        altitude: 15
      };

      expect(() => UpdateStatusSchema.parse(invalidData)).toThrow();
    });
  });

  describe('UserIdSchema', () => {
    it('should validate valid user IDs', () => {
      const validIds = ['user123', 'test-user', 'user_name', 'a', '123'];
      
      validIds.forEach(id => {
        expect(UserIdSchema.parse(id)).toBe(id);
      });
    });

    it('should reject empty user ID', () => {
      expect(() => UserIdSchema.parse('')).toThrow();
    });

    it('should reject user ID that is too long', () => {
      const longId = 'a'.repeat(51);
      expect(() => UserIdSchema.parse(longId)).toThrow();
    });

    it('should reject user ID with invalid characters', () => {
      const invalidIds = ['user@123', 'user 123', 'user#123', 'user.123'];
      
      invalidIds.forEach(id => {
        expect(() => UserIdSchema.parse(id)).toThrow();
      });
    });

    it('should provide helpful error message for invalid characters', () => {
      try {
        UserIdSchema.parse('user@123');
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError);
        const zodError = error as z.ZodError;
        expect(zodError.errors[0].message).toContain('alphanumeric characters');
      }
    });
  });

  describe('LimitSchema', () => {
    it('should validate valid limits', () => {
      const validLimits = [1, 10, 50, 100];
      
      validLimits.forEach(limit => {
        expect(LimitSchema.parse(limit)).toBe(limit);
      });
    });

    it('should reject limit below minimum', () => {
      expect(() => LimitSchema.parse(0)).toThrow();
      expect(() => LimitSchema.parse(-1)).toThrow();
    });

    it('should reject limit above maximum', () => {
      expect(() => LimitSchema.parse(101)).toThrow();
      expect(() => LimitSchema.parse(1000)).toThrow();
    });

    it('should reject non-integer limits', () => {
      expect(() => LimitSchema.parse(10.5)).toThrow();
      expect(() => LimitSchema.parse(NaN)).toThrow();
    });
  });
});