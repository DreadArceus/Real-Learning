import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { config } from '../config';
import { logger } from './logging';

/**
 * Rate limiting middleware for different endpoints
 */

// General API rate limiter
export const generalLimiter = rateLimit({
  windowMs: config.API_RATE_LIMIT_WINDOW_MS,
  max: config.API_RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use IP address as the key
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(config.API_RATE_LIMIT_WINDOW_MS / 1000)
    });
  }
});

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Combine IP and username for more specific limiting
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const username = req.body?.username || '';
    return `${ip}:${username}`;
  },
  handler: (req: Request, res: Response) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}, Username: ${req.body?.username}`);
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts, please try again later',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: 15 * 60 // 15 minutes in seconds
    });
  }
});

// Lenient rate limiter for registration
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registrations per hour per IP
  message: {
    success: false,
    error: 'Too many registration attempts, please try again later',
    code: 'REGISTRATION_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    logger.warn(`Registration rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many registration attempts, please try again later',
      code: 'REGISTRATION_RATE_LIMIT_EXCEEDED',
      retryAfter: 60 * 60 // 1 hour in seconds
    });
  }
});

// Very strict rate limiter for admin endpoints
export const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 requests per 5 minutes
  message: {
    success: false,
    error: 'Too many admin requests, please try again later',
    code: 'ADMIN_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use user ID if available, fallback to IP
    const userId = req.user?.userId || '';
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return userId ? `user:${userId}` : `ip:${ip}`;
  },
  handler: (req: Request, res: Response) => {
    logger.warn(`Admin rate limit exceeded for User: ${req.user?.userId || 'N/A'}, IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many admin requests, please try again later',
      code: 'ADMIN_RATE_LIMIT_EXCEEDED',
      retryAfter: 5 * 60 // 5 minutes in seconds
    });
  }
});

// Progressive rate limiter that increases restrictions for repeat offenders
const progressiveTracker = new Map<string, { violations: number; lastViolation: number }>();

export const progressiveLimiter = (baseMax: number, windowMs: number) => {
  return rateLimit({
    windowMs,
    max: (req: Request) => {
      const key = req.ip || req.connection.remoteAddress || 'unknown';
      const tracker = progressiveTracker.get(key);
      
      if (!tracker) {
        return baseMax;
      }
      
      // Reduce limit based on violations
      const reductionFactor = Math.min(tracker.violations * 0.2, 0.8); // Max 80% reduction
      const adjustedMax = Math.ceil(baseMax * (1 - reductionFactor));
      
      return Math.max(adjustedMax, Math.ceil(baseMax * 0.2)); // Minimum 20% of base
    },
    keyGenerator: (req: Request) => req.ip || req.connection.remoteAddress || 'unknown',
    handler: (req: Request, res: Response) => {
      const key = req.ip || req.connection.remoteAddress || 'unknown';
      const now = Date.now();
      
      // Track violations
      if (!progressiveTracker.has(key)) {
        progressiveTracker.set(key, { violations: 1, lastViolation: now });
      } else {
        const tracker = progressiveTracker.get(key)!;
        tracker.violations++;
        tracker.lastViolation = now;
      }
      
      logger.warn(`Progressive rate limit exceeded for IP: ${key}, Violations: ${progressiveTracker.get(key)?.violations}`);
      
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Repeated violations will result in longer restrictions.',
        code: 'PROGRESSIVE_RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Clean up progressive tracker periodically
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [key, tracker] of progressiveTracker.entries()) {
    if (now - tracker.lastViolation > maxAge) {
      progressiveTracker.delete(key);
    }
  }
}, 60 * 60 * 1000); // Run cleanup every hour