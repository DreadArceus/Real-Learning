"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseError = exports.NotFoundError = exports.ValidationError = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message, field) {
        super(message, 400, field ? `VALIDATION_ERROR_${field.toUpperCase()}` : 'VALIDATION_ERROR');
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends AppError {
    constructor(resource) {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}
exports.NotFoundError = NotFoundError;
class DatabaseError extends AppError {
    constructor(message, originalError) {
        super(message, 500, 'DATABASE_ERROR');
        if (originalError) {
            this.stack = originalError.stack;
        }
    }
}
exports.DatabaseError = DatabaseError;
//# sourceMappingURL=AppError.js.map