import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
import { AppError } from '../errors/AppError';
import { config, isDevelopment } from '../config';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  console.error('Error occurred:', {
    message: error.message,
    stack: isDevelopment ? error.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle operational errors (known errors)
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
      ...(isDevelopment && { stack: error.stack })
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
  const message = isDevelopment ? error.message : 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: message,
    code: 'INTERNAL_ERROR',
    ...(isDevelopment && { stack: error.stack })
  });
};

export const notFoundHandler = (req: Request, res: Response<ApiResponse>) => {
  res.status(404).json({
    success: false,
    error: `Endpoint ${req.method} ${req.path} not found`,
    code: 'ENDPOINT_NOT_FOUND'
  });
};