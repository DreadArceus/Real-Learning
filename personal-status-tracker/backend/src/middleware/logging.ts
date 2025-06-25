import winston from 'winston';
import morgan from 'morgan';
import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import { EncryptedFileTransport } from '../utils/encryptedTransport';

/**
 * Production-ready logging configuration
 */

// Ensure logs directory exists
const logsDir = path.dirname('./logs/app.log');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Winston logger configuration
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Create logger instance
export const logger = winston.createLogger({
  level: config.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'personal-status-tracker',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // Encrypted file transport for all logs
    new EncryptedFileTransport({
      filename: './logs/app.log',
      maxsize: 100 * 1024 * 1024, // 100MB
      maxFiles: 10
    }),
    
    // Encrypted file transport for errors
    new EncryptedFileTransport({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 5
    })
  ],
  
  // Handle exceptions and rejections
  exceptionHandlers: [
    new EncryptedFileTransport({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 50 * 1024 * 1024,
      maxFiles: 3
    })
  ],
  
  rejectionHandlers: [
    new EncryptedFileTransport({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 50 * 1024 * 1024,
      maxFiles: 3
    })
  ]
});

// Morgan request logging with custom format
const morganFormat = config.NODE_ENV === 'production' 
  ? 'combined' 
  : 'dev';

// Custom token for response time in milliseconds
morgan.token('response-time-ms', (req: Request, res: Response) => {
  const responseTime = res.get('X-Response-Time');
  return responseTime ? `${responseTime}ms` : '-';
});

// Custom token for user information
morgan.token('user', (req: Request) => {
  const user = (req as any).user;
  return user ? `${user.username}(${user.role})` : 'anonymous';
});

// Custom token for request ID (if available)
morgan.token('req-id', (req: Request) => {
  return (req as any).id || '-';
});

// Morgan stream to Winston
const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  }
};

// Request logging middleware
export const requestLogger = morgan(
  ':remote-addr :user :method :url :status :res[content-length] - :response-time ms ":user-agent" :req-id',
  { 
    stream: morganStream,
    skip: (req: Request) => {
      // Skip health check endpoints in production to reduce noise
      if (config.NODE_ENV === 'production' && req.url === '/health') {
        return true;
      }
      return false;
    }
  }
);

// Security event logging
export const logSecurityEvent = (event: string, details: any, req?: Request) => {
  const securityLog = {
    event,
    timestamp: new Date().toISOString(),
    ip: req?.ip || 'unknown',
    userAgent: req?.get('User-Agent') || 'unknown',
    userId: (req as any)?.user?.userId || null,
    username: (req as any)?.user?.username || null,
    details
  };
  
  logger.warn('Security Event', securityLog);
  
  // In production, you might want to send alerts for critical security events
  if (config.NODE_ENV === 'production' && isCriticalSecurityEvent(event)) {
    // Send to monitoring service, email alerts, etc.
    console.error('CRITICAL SECURITY EVENT:', securityLog);
  }
};

// Performance logging middleware
export const performanceLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Use response finish event but avoid setting headers after they're sent
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log slow requests only (don't try to set headers)
    if (duration > 1000) { // Requests taking more than 1 second
      logger.warn('Slow Request', {
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: (req as any).user?.userId
      });
    }
  });

  // Set the response time header early in the response pipeline
  const originalJson = res.json;
  res.json = function(this: Response, body?: any) {
    const duration = Date.now() - start;
    if (!res.headersSent) {
      res.set('X-Response-Time', duration.toString());
    }
    return originalJson.call(this, body);
  };
  
  next();
};

// Error logging middleware
export const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction) => {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.userId,
    body: req.body,
    query: req.query,
    params: req.params
  };
  
  logger.error('Request Error', errorLog);
  next(error);
};

// Database operation logging
export const logDatabaseOperation = (operation: string, table: string, duration?: number, error?: Error) => {
  const logData = {
    operation,
    table,
    duration: duration ? `${duration}ms` : undefined,
    timestamp: new Date().toISOString()
  };
  
  if (error) {
    logger.error('Database Error', { ...logData, error: error.message, stack: error.stack });
  } else if (duration && duration > 1000) {
    logger.warn('Slow Database Query', logData);
  } else {
    logger.debug('Database Operation', logData);
  }
};

// Authentication event logging
export const logAuthEvent = (event: 'login_success' | 'login_failure' | 'logout' | 'registration' | 'password_change', username: string, req: Request, additionalInfo?: any) => {
  const authLog = {
    event,
    username,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    ...additionalInfo
  };
  
  logger.info('Authentication Event', authLog);
  
  // Log security events for failed logins
  if (event === 'login_failure') {
    logSecurityEvent('failed_login_attempt', { username, attempts: additionalInfo?.attempts }, req);
  }
};

// User data operation logging
export const logDataOperation = (operation: 'create' | 'read' | 'update' | 'delete', resource: string, req: Request, additionalInfo?: any) => {
  const dataLog = {
    operation,
    resource,
    userId: (req as any).user?.userId,
    username: (req as any).user?.username,
    role: (req as any).user?.role,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    ...additionalInfo
  };
  
  logger.info('Data Operation', dataLog);
};

// Helper function to determine critical security events
function isCriticalSecurityEvent(event: string): boolean {
  const criticalEvents = [
    'multiple_failed_logins',
    'suspicious_request_pattern',
    'potential_sql_injection',
    'potential_xss_attempt',
    'brute_force_detected',
    'account_lockout'
  ];
  
  return criticalEvents.includes(event);
}

// Request ID middleware for tracing
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.get('X-Request-ID') || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  (req as any).id = requestId;
  res.set('X-Request-ID', requestId);
  next();
};

// Graceful shutdown logging
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
});

// Log startup information
export const logStartup = (port: number) => {
  logger.info('Application Starting', {
    port,
    environment: config.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch
  });
};