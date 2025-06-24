"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errorHandler_1 = require("../../middleware/errorHandler");
const AppError_1 = require("../../errors/AppError");
// Mock config
jest.mock('../../config', () => ({
    config: {
        NODE_ENV: 'test'
    },
    isDevelopment: false
}));
describe('Error Handler Middleware', () => {
    let mockRequest;
    let mockResponse;
    let mockNext;
    let jsonSpy;
    let statusSpy;
    beforeEach(() => {
        jest.clearAllMocks();
        jsonSpy = jest.fn();
        statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
        mockRequest = {
            url: '/api/test',
            method: 'GET'
        };
        mockResponse = {
            status: statusSpy,
            json: jsonSpy
        };
        mockNext = jest.fn();
        // Mock console.error to avoid noise in tests
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    describe('errorHandler', () => {
        describe('AppError handling', () => {
            it('should handle ValidationError correctly', () => {
                const error = new AppError_1.ValidationError('Invalid input', 'email');
                (0, errorHandler_1.errorHandler)(error, mockRequest, mockResponse, mockNext);
                expect(statusSpy).toHaveBeenCalledWith(400);
                expect(jsonSpy).toHaveBeenCalledWith({
                    success: false,
                    error: 'Invalid input',
                    code: 'VALIDATION_ERROR_EMAIL'
                });
            });
            it('should handle NotFoundError correctly', () => {
                const error = new AppError_1.NotFoundError('User');
                (0, errorHandler_1.errorHandler)(error, mockRequest, mockResponse, mockNext);
                expect(statusSpy).toHaveBeenCalledWith(404);
                expect(jsonSpy).toHaveBeenCalledWith({
                    success: false,
                    error: 'User not found',
                    code: 'NOT_FOUND'
                });
            });
            it('should handle DatabaseError correctly', () => {
                const error = new AppError_1.DatabaseError('Connection failed');
                (0, errorHandler_1.errorHandler)(error, mockRequest, mockResponse, mockNext);
                expect(statusSpy).toHaveBeenCalledWith(500);
                expect(jsonSpy).toHaveBeenCalledWith({
                    success: false,
                    error: 'Connection failed',
                    code: 'DATABASE_ERROR'
                });
            });
            it('should handle custom AppError correctly', () => {
                const error = new AppError_1.AppError('Custom error', 418, 'CUSTOM_ERROR');
                (0, errorHandler_1.errorHandler)(error, mockRequest, mockResponse, mockNext);
                expect(statusSpy).toHaveBeenCalledWith(418);
                expect(jsonSpy).toHaveBeenCalledWith({
                    success: false,
                    error: 'Custom error',
                    code: 'CUSTOM_ERROR'
                });
            });
        });
        describe('Database constraint error handling', () => {
            it('should handle CHECK constraint failures', () => {
                const error = new Error('CHECK constraint failed: altitude');
                (0, errorHandler_1.errorHandler)(error, mockRequest, mockResponse, mockNext);
                expect(statusSpy).toHaveBeenCalledWith(400);
                expect(jsonSpy).toHaveBeenCalledWith({
                    success: false,
                    error: 'Invalid data: altitude must be between 1 and 10',
                    code: 'CONSTRAINT_VIOLATION'
                });
            });
        });
        describe('Generic error handling', () => {
            it('should handle generic errors with safe message in production', () => {
                const error = new Error('Sensitive internal error');
                (0, errorHandler_1.errorHandler)(error, mockRequest, mockResponse, mockNext);
                expect(statusSpy).toHaveBeenCalledWith(500);
                expect(jsonSpy).toHaveBeenCalledWith({
                    success: false,
                    error: 'Internal server error',
                    code: 'INTERNAL_ERROR'
                });
            });
            it('should include detailed message in development mode', () => {
                // Mock development mode
                jest.doMock('../../config', () => ({
                    config: { NODE_ENV: 'development' },
                    isDevelopment: true
                }));
                const { errorHandler: devErrorHandler } = require('../../middleware/errorHandler');
                const error = new Error('Detailed error message');
                devErrorHandler(error, mockRequest, mockResponse, mockNext);
                expect(statusSpy).toHaveBeenCalledWith(500);
                expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
                    success: false,
                    error: 'Detailed error message',
                    code: 'INTERNAL_ERROR',
                    stack: expect.any(String)
                }));
            });
        });
        describe('Logging', () => {
            it('should log error details', () => {
                const error = new Error('Test error');
                const consoleSpy = jest.spyOn(console, 'error');
                (0, errorHandler_1.errorHandler)(error, mockRequest, mockResponse, mockNext);
                expect(consoleSpy).toHaveBeenCalledWith('Error occurred:', {
                    message: 'Test error',
                    stack: undefined,
                    url: '/api/test',
                    method: 'GET',
                    timestamp: expect.any(String)
                });
            });
            it('should include stack trace in development', () => {
                jest.doMock('../../config', () => ({
                    config: { NODE_ENV: 'development' },
                    isDevelopment: true
                }));
                const { errorHandler: devErrorHandler } = require('../../middleware/errorHandler');
                const error = new Error('Test error');
                const consoleSpy = jest.spyOn(console, 'error');
                devErrorHandler(error, mockRequest, mockResponse, mockNext);
                expect(consoleSpy).toHaveBeenCalledWith('Error occurred:', expect.objectContaining({
                    stack: expect.any(String)
                }));
            });
        });
        describe('Stack trace inclusion', () => {
            it('should include stack trace for AppError in development', () => {
                jest.doMock('../../config', () => ({
                    config: { NODE_ENV: 'development' },
                    isDevelopment: true
                }));
                const { errorHandler: devErrorHandler } = require('../../middleware/errorHandler');
                const error = new AppError_1.ValidationError('Test validation error');
                devErrorHandler(error, mockRequest, mockResponse, mockNext);
                expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
                    stack: expect.any(String)
                }));
            });
            it('should not include stack trace in production', () => {
                const error = new AppError_1.ValidationError('Test validation error');
                (0, errorHandler_1.errorHandler)(error, mockRequest, mockResponse, mockNext);
                expect(jsonSpy).toHaveBeenCalledWith(expect.not.objectContaining({
                    stack: expect.anything()
                }));
            });
        });
    });
    describe('notFoundHandler', () => {
        it('should return 404 with endpoint details', () => {
            mockRequest = {
                ...mockRequest,
                method: 'POST',
                path: '/api/nonexistent'
            };
            (0, errorHandler_1.notFoundHandler)(mockRequest, mockResponse);
            expect(statusSpy).toHaveBeenCalledWith(404);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: false,
                error: 'Endpoint POST /api/nonexistent not found',
                code: 'ENDPOINT_NOT_FOUND'
            });
        });
        it('should handle different HTTP methods', () => {
            mockRequest = {
                ...mockRequest,
                method: 'DELETE',
                path: '/api/test'
            };
            (0, errorHandler_1.notFoundHandler)(mockRequest, mockResponse);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: false,
                error: 'Endpoint DELETE /api/test not found',
                code: 'ENDPOINT_NOT_FOUND'
            });
        });
        it('should handle undefined path gracefully', () => {
            mockRequest = {
                ...mockRequest,
                method: 'GET',
                path: undefined
            };
            (0, errorHandler_1.notFoundHandler)(mockRequest, mockResponse);
            expect(statusSpy).toHaveBeenCalledWith(404);
            expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                code: 'ENDPOINT_NOT_FOUND'
            }));
        });
    });
});
//# sourceMappingURL=errorHandler.test.js.map