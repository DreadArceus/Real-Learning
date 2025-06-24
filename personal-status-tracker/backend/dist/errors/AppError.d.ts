export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code: string;
    readonly isOperational: boolean;
    constructor(message: string, statusCode?: number, code?: string, isOperational?: boolean);
}
export declare class ValidationError extends AppError {
    constructor(message: string, field?: string);
}
export declare class NotFoundError extends AppError {
    constructor(resource: string);
}
export declare class DatabaseError extends AppError {
    constructor(message: string, originalError?: Error);
}
//# sourceMappingURL=AppError.d.ts.map