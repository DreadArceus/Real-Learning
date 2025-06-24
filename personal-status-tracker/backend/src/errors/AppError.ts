export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(
      message,
      400,
      field ? `VALIDATION_ERROR_${field.toUpperCase()}` : 'VALIDATION_ERROR'
    );
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(
      `${resource} not found`,
      404,
      'NOT_FOUND'
    );
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(
      message,
      500,
      'DATABASE_ERROR'
    );
    
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}