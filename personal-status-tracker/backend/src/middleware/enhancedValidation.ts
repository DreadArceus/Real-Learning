import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import validator from 'validator';

/**
 * Enhanced validation and sanitization middleware for production
 */

// String sanitization function
function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Remove HTML tags and potentially dangerous characters
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  return sanitized;
}

// Check for suspicious content
function containsSuspiciousContent(input: string): boolean {
  const suspiciousPatterns = [
    // SQL injection patterns
    /('|(\\')|(;)|(\|\|)|(--)|(\+)/i,
    /(exec|execute|select|union|insert|update|delete|drop|create|alter|declare)/i,
    
    // XSS patterns
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/i,
    /on\w+\s*=/i,
    
    // Command injection patterns
    /(\||&|;|\$\(|\`)/,
    /(rm\s|del\s|format\s|shutdown\s)/i,
    
    // Directory traversal
    /\.\.[\/\\]/,
    
    // Other suspicious patterns
    /\${.*}/,
    /<%.*%>/,
    /\{\{.*\}\}/
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(input));
}

// Common validation schemas
export const commonSchemas = {
  id: z.string().regex(/^\d+$/, 'ID must be a positive integer').transform(Number),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .transform(val => val.toLowerCase().trim()),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters')
    .refine(
      (password) => {
        // Check for at least one uppercase, lowercase, number, and special character
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
        
        return hasUppercase && hasLowercase && hasNumber && hasSpecial;
      },
      'Password must contain at least one uppercase letter, lowercase letter, number, and special character'
    ),
  
  email: z.string()
    .email('Invalid email format')
    .max(254, 'Email must be at most 254 characters')
    .transform(val => val.toLowerCase().trim()),
  
  role: z.enum(['admin', 'viewer'], {
    errorMap: () => ({ message: 'Role must be either admin or viewer' })
  }),
  
  // Generic string with length and content validation
  safeString: (minLength = 1, maxLength = 255) => 
    z.string()
      .min(minLength)
      .max(maxLength)
      .transform(val => sanitizeString(val))
      .refine(val => !containsSuspiciousContent(val), 'Invalid content detected'),
  
  // ISO date string validation
  dateString: z.string()
    .refine(val => validator.isISO8601(val), 'Invalid date format')
    .transform(val => new Date(val).toISOString()),
  
  // Numeric ranges
  altitude: z.number()
    .int('Altitude must be an integer')
    .min(1, 'Altitude must be at least 1')
    .max(10, 'Altitude must be at most 10'),
  
  // Pagination parameters
  limit: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 10)
    .refine(val => val >= 1 && val <= 100, 'Limit must be between 1 and 100'),
  
  offset: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 0)
    .refine(val => val >= 0, 'Offset must be non-negative'),
};

// Enhanced validation schemas for different endpoints
export const validationSchemas = {
  // Authentication schemas
  login: z.object({
    username: commonSchemas.username,
    password: z.string().min(1, 'Password is required').max(128)
  }),
  
  register: z.object({
    username: commonSchemas.username,
    password: commonSchemas.password,
    confirmPassword: z.string().optional()
  }).refine(
    data => !data.confirmPassword || data.password === data.confirmPassword,
    { message: 'Passwords do not match', path: ['confirmPassword'] }
  ),
  
  adminCreateUser: z.object({
    username: commonSchemas.username,
    password: commonSchemas.password,
    role: commonSchemas.role
  }),
  
  // Status schemas
  createStatus: z.object({
    lastWaterIntake: commonSchemas.dateString,
    altitude: commonSchemas.altitude,
    notes: commonSchemas.safeString(0, 500).optional()
  }),
  
  updateStatus: z.object({
    lastWaterIntake: commonSchemas.dateString.optional(),
    altitude: commonSchemas.altitude.optional(),
    notes: commonSchemas.safeString(0, 500).optional()
  }).refine(
    data => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  ),
  
  // Query parameter schemas
  statusQuery: z.object({
    userId: commonSchemas.safeString(1, 50).optional(),
    limit: commonSchemas.limit,
    offset: commonSchemas.offset,
    startDate: commonSchemas.dateString.optional(),
    endDate: commonSchemas.dateString.optional()
  }).refine(
    data => !data.startDate || !data.endDate || new Date(data.startDate) <= new Date(data.endDate),
    'Start date must be before or equal to end date'
  ),
};

// Enhanced validation middleware factory
export function validateRequest<T extends z.ZodSchema>(
  schema: T,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[source];
      
      // Pre-validation sanitization
      const sanitizedData = sanitizeRequestData(data);
      
      // Validate with Zod
      const validatedData = await schema.parseAsync(sanitizedData);
      
      // Update request with validated data
      req[source] = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validationErrors
        });
      }
      
      next(error);
    }
  };
}

// Deep sanitization of request data
function sanitizeRequestData(data: any): any {
  if (typeof data === 'string') {
    return sanitizeString(data);
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeRequestData);
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        // Sanitize key names too
        const sanitizedKey = sanitizeString(key);
        if (sanitizedKey && !containsSuspiciousContent(sanitizedKey)) {
          sanitized[sanitizedKey] = sanitizeRequestData(data[key]);
        }
      }
    }
    return sanitized;
  }
  
  return data;
}

// Content Security Policy validation
export const validateCSP = (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.get('User-Agent') || '';
  
  // Block requests from known bad user agents
  const blockedUserAgents = [
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /openvas/i,
    /nmap/i
  ];
  
  if (blockedUserAgents.some(pattern => pattern.test(userAgent))) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      code: 'BLOCKED_USER_AGENT'
    });
  }
  
  next();
};

// Export all validation schemas
export { validationSchemas as schemas };