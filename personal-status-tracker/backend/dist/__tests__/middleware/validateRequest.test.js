"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const validateRequest_1 = require("../../middleware/validateRequest");
const AppError_1 = require("../../errors/AppError");
// Mock Express request/response
const mockRequest = (data, type = 'body') => ({
    [type]: data,
});
const mockResponse = () => ({});
const mockNext = jest.fn();
describe('validateRequest middleware', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    const testSchema = zod_1.z.object({
        name: zod_1.z.string().min(1),
        age: zod_1.z.number().int().min(0)
    });
    describe('successful validation', () => {
        it('should validate request body and call next()', () => {
            const validData = { name: 'John', age: 25 };
            const req = mockRequest(validData);
            const res = mockResponse();
            const middleware = (0, validateRequest_1.validateRequest)(testSchema);
            middleware(req, res, mockNext);
            expect(mockNext).toHaveBeenCalledWith();
            expect(mockNext).toHaveBeenCalledTimes(1);
            expect(req.body).toEqual(validData);
        });
        it('should validate request query parameters', () => {
            const validData = { name: 'John', age: 25 };
            const req = mockRequest(validData, 'query');
            const res = mockResponse();
            const middleware = (0, validateRequest_1.validateRequest)(testSchema, 'query');
            middleware(req, res, mockNext);
            expect(mockNext).toHaveBeenCalledWith();
            expect(req.query).toEqual(validData);
        });
        it('should validate request params', () => {
            const validData = { name: 'John', age: 25 };
            const req = mockRequest(validData, 'params');
            const res = mockResponse();
            const middleware = (0, validateRequest_1.validateRequest)(testSchema, 'params');
            middleware(req, res, mockNext);
            expect(mockNext).toHaveBeenCalledWith();
            expect(req.params).toEqual(validData);
        });
        it('should transform data according to schema', () => {
            const inputData = { name: 'John', age: '25' }; // age as string
            const expectedData = { name: 'John', age: 25 }; // age as number
            const transformSchema = zod_1.z.object({
                name: zod_1.z.string(),
                age: zod_1.z.string().transform(Number)
            });
            const req = mockRequest(inputData);
            const res = mockResponse();
            const middleware = (0, validateRequest_1.validateRequest)(transformSchema);
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
            const middleware = (0, validateRequest_1.validateRequest)(testSchema);
            middleware(req, res, mockNext);
            expect(mockNext).toHaveBeenCalledTimes(1);
            const calledWith = mockNext.mock.calls[0][0];
            expect(calledWith).toBeInstanceOf(AppError_1.ValidationError);
            expect(calledWith.message).toContain('name:');
            expect(calledWith.message).toContain('age:');
        });
        it('should format error messages properly', () => {
            const invalidData = { name: 123, age: 'not-a-number' };
            const req = mockRequest(invalidData);
            const res = mockResponse();
            const middleware = (0, validateRequest_1.validateRequest)(testSchema);
            middleware(req, res, mockNext);
            const error = mockNext.mock.calls[0][0];
            expect(error.message).toContain('name:');
            expect(error.message).toContain('age:');
            expect(error.message).toContain('Expected string');
            expect(error.message).toContain('Expected number');
        });
        it('should handle missing required fields', () => {
            const invalidData = {}; // missing both fields
            const req = mockRequest(invalidData);
            const res = mockResponse();
            const middleware = (0, validateRequest_1.validateRequest)(testSchema);
            middleware(req, res, mockNext);
            const error = mockNext.mock.calls[0][0];
            expect(error).toBeInstanceOf(AppError_1.ValidationError);
            expect(error.message).toContain('name:');
            expect(error.message).toContain('age:');
        });
        it('should handle nested validation errors', () => {
            const nestedSchema = zod_1.z.object({
                user: zod_1.z.object({
                    profile: zod_1.z.object({
                        name: zod_1.z.string().min(1)
                    })
                })
            });
            const invalidData = { user: { profile: { name: '' } } };
            const req = mockRequest(invalidData);
            const res = mockResponse();
            const middleware = (0, validateRequest_1.validateRequest)(nestedSchema);
            middleware(req, res, mockNext);
            const error = mockNext.mock.calls[0][0];
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
            };
            const req = mockRequest({});
            const res = mockResponse();
            const middleware = (0, validateRequest_1.validateRequest)(faultySchema);
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
            const middleware = (0, validateRequest_1.validateRequest)(testSchema); // no type specified
            middleware(req, res, mockNext);
            expect(mockNext).toHaveBeenCalledWith();
            expect(req.body).toEqual(validData);
            expect(req.query).toEqual({ other: 'data' }); // unchanged
            expect(req.params).toEqual({ other: 'data' }); // unchanged
        });
    });
});
//# sourceMappingURL=validateRequest.test.js.map