import { AppError, ValidationError, NotFoundError, DatabaseError } from '../../errors/AppError';

describe('AppError', () => {
  describe('AppError base class', () => {
    it('should create error with default values', () => {
      const error = new AppError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(Error);
    });

    it('should create error with custom values', () => {
      const error = new AppError('Custom error', 404, 'CUSTOM_ERROR', false);
      
      expect(error.message).toBe('Custom error');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('CUSTOM_ERROR');
      expect(error.isOperational).toBe(false);
    });

    it('should capture stack trace', () => {
      const error = new AppError('Test error');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError.test.ts');
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with default code', () => {
      const error = new ValidationError('Invalid input');
      
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should create validation error with field-specific code', () => {
      const error = new ValidationError('Invalid email format', 'email');
      
      expect(error.message).toBe('Invalid email format');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR_EMAIL');
      expect(error.isOperational).toBe(true);
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error', () => {
      const error = new NotFoundError('User');
      
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should work with different resource names', () => {
      const error = new NotFoundError('Status entry');
      expect(error.message).toBe('Status entry not found');
    });
  });

  describe('DatabaseError', () => {
    it('should create database error without original error', () => {
      const error = new DatabaseError('Database connection failed');
      
      expect(error.message).toBe('Database connection failed');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('DATABASE_ERROR');
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should create database error with original error', () => {
      const originalError = new Error('SQLITE_BUSY: database is locked');
      const error = new DatabaseError('Failed to insert record', originalError);
      
      expect(error.message).toBe('Failed to insert record');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('DATABASE_ERROR');
      expect(error.stack).toBe(originalError.stack);
    });

    it('should preserve original error stack trace', () => {
      const originalError = new Error('Original error');
      const originalStack = originalError.stack;
      
      const error = new DatabaseError('Wrapped error', originalError);
      expect(error.stack).toBe(originalStack);
    });
  });
});