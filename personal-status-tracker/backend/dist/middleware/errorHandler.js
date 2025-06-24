"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const AppError_1 = require("../errors/AppError");
const config_1 = require("../config");
const errorHandler = (error, req, res, next) => {
    console.error('Error occurred:', {
        message: error.message,
        stack: config_1.isDevelopment ? error.stack : undefined,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });
    // Handle operational errors (known errors)
    if (error instanceof AppError_1.AppError) {
        return res.status(error.statusCode).json({
            success: false,
            error: error.message,
            code: error.code,
            ...(config_1.isDevelopment && { stack: error.stack })
        });
    }
    // Handle database constraint errors
    if (error.message.includes('CHECK constraint failed')) {
        return res.status(400).json({
            success: false,
            error: 'Invalid data: altitude must be between 1 and 10',
            code: 'CONSTRAINT_VIOLATION'
        });
    }
    // Handle unexpected errors
    const statusCode = 500;
    const message = config_1.isDevelopment ? error.message : 'Internal server error';
    res.status(statusCode).json({
        success: false,
        error: message,
        code: 'INTERNAL_ERROR',
        ...(config_1.isDevelopment && { stack: error.stack })
    });
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: `Endpoint ${req.method} ${req.path} not found`,
        code: 'ENDPOINT_NOT_FOUND'
    });
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=errorHandler.js.map