import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateRequest } from '../../middleware/validateRequest';
import { ValidationError } from '../../errors/AppError';

// Mock Express request/response
const mockRequest = (data: any, type: 'body' | 'query' | 'params' = 'body') => ({
  [type]: data,
} as Request);

const mockResponse = () => ({} as Response);

const mockNext = jest.fn() as jest.MockedFunction<NextFunction>;

describe('validateRequest middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const testSchema = z.object({
    name: z.string().min(1),
    age: z.number().int().min(0)
  });

  describe('successful validation', () => {
    it('should validate request body and call next()', () => {
      const validData = { name: 'John', age: 25 };
      const req = mockRequest(validData);
      const res = mockResponse();
      
      const middleware = validateRequest(testSchema);
      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(req.body).toEqual(validData);
    });

    it('should validate request query parameters', () => {
      const validData = { name: 'John', age: 25 };
      const req = mockRequest(validData, 'query');
      const res = mockResponse();
      
      const middleware = validateRequest(testSchema, 'query');
      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(req.query).toEqual(validData);
    });

    it('should validate request params', () => {
      const validData = { name: 'John', age: 25 };
      const req = mockRequest(validData, 'params');
      const res = mockResponse();
      
      const middleware = validateRequest(testSchema, 'params');
      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(req.params).toEqual(validData);
    });

    it('should transform data according to schema', () => {
      const inputData = { name: 'John', age: '25' }; // age as string
      const expectedData = { name: 'John', age: 25 }; // age as number
      
      const transformSchema = z.object({
        name: z.string(),
        age: z.string().transform(Number)
      });
      
      const req = mockRequest(inputData);
      const res = mockResponse();
      
      const middleware = validateRequest(transformSchema);
      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(req.body).toEqual(expectedData);
    });
  });

  describe('validation failures', () => {
    it('should call next with ValidationError for invalid data', () => {
      const invalidData = { name: '', age: -1 }; // empty name, negative age
      const req = mockRequest(invalidData);
      const res = mockResponse();
      
      const middleware = validateRequest(testSchema);
      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const calledWith = mockNext.mock.calls[0][0] as any;
      expect(calledWith).toBeInstanceOf(ValidationError);
      expect(calledWith.message).toContain('name:');
      expect(calledWith.message).toContain('age:');
    });

    it('should format error messages properly', () => {
      const invalidData = { name: 123, age: 'not-a-number' };
      const req = mockRequest(invalidData);
      const res = mockResponse();
      
      const middleware = validateRequest(testSchema);
      middleware(req, res, mockNext);

      const error = mockNext.mock.calls[0][0] as any;
      expect(error.message).toContain('name:');
      expect(error.message).toContain('age:');
      expect(error.message).toContain('Expected string');
      expect(error.message).toContain('Expected number');
    });

    it('should handle missing required fields', () => {
      const invalidData = {}; // missing both fields
      const req = mockRequest(invalidData);
      const res = mockResponse();
      
      const middleware = validateRequest(testSchema);
      middleware(req, res, mockNext);

      const error = mockNext.mock.calls[0][0] as any;
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('name:');
      expect(error.message).toContain('age:');
    });

    it('should handle nested validation errors', () => {
      const nestedSchema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string().min(1)
          })
        })
      });

      const invalidData = { user: { profile: { name: '' } } };
      const req = mockRequest(invalidData);
      const res = mockResponse();
      
      const middleware = validateRequest(nestedSchema);
      middleware(req, res, mockNext);

      const error = mockNext.mock.calls[0][0] as any;
      expect(error.message).toContain('user.profile.name:');
    });
  });

  describe('error handling', () => {
    it('should pass through non-Zod errors', () => {
      const originalError = new Error('Unexpected error');
      
      // Mock schema.parse to throw non-Zod error
      const faultySchema = {
        parse: jest.fn().mockImplementation(() => {
          throw originalError;
        })
      } as any;

      const req = mockRequest({});
      const res = mockResponse();
      
      const middleware = validateRequest(faultySchema);
      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(originalError);
    });
  });

  describe('default behavior', () => {
    it('should default to validating body when no type specified', () => {
      const validData = { name: 'John', age: 25 };
      const req = mockRequest(validData);
      req.query = { other: 'data' };
      req.params = { other: 'data' };
      const res = mockResponse();
      
      const middleware = validateRequest(testSchema); // no type specified
      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(req.body).toEqual(validData);
      expect(req.query).toEqual({ other: 'data' }); // unchanged
      expect(req.params).toEqual({ other: 'data' }); // unchanged
    });
  });
});