import { z } from 'zod';

/**
 * Production-ready configuration schema with enhanced security and monitoring
 */

const ProductionConfigSchema = z.object({
  // Core settings
  PORT: z.string().transform(Number).pipe(z.number().positive().default(3001)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  
  // Database configuration
  DATABASE_PATH: z.string().default('./data/production.db'),
  DB_CONNECTION_TIMEOUT: z.string().transform(Number).default(30000),
  DB_QUERY_TIMEOUT: z.string().transform(Number).default(10000),
  DB_BACKUP_ENABLED: z.string().transform(val => val === 'true').default('true'),
  DB_BACKUP_INTERVAL: z.string().transform(Number).default(86400000), // 24 hours
  
  // Security configuration
  JWT_SECRET: z.string().min(64), // Require strong JWT secret (64+ chars)
  JWT_EXPIRES_IN: z.string().default('24h'),
  BCRYPT_ROUNDS: z.string().transform(Number).default(14), // Higher rounds for production
  SESSION_SECRET: z.string().min(64), // Required for production
  
  // CORS and security headers
  ALLOWED_ORIGINS: z.string().default('https://yourdomain.com'),
  COOKIE_SECURE: z.string().transform(val => val === 'true').default('true'),
  COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('strict'),
  TRUST_PROXY: z.string().transform(val => val === 'true').default('true'),
  
  // Rate limiting
  API_RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default(900000), // 15 minutes
  API_RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default(100),
  
  // Authentication security
  MAX_LOGIN_ATTEMPTS: z.string().transform(Number).default(5),
  ACCOUNT_LOCKOUT_DURATION: z.string().transform(Number).default(1800000), // 30 minutes
  PASSWORD_MIN_LENGTH: z.string().transform(Number).default(12),
  REQUIRE_STRONG_PASSWORDS: z.string().transform(val => val === 'true').default('true'),
  FORCE_PASSWORD_CHANGE_DAYS: z.string().transform(Number).default(90),
  
  // Logging and monitoring
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('warn'),
  ENABLE_REQUEST_LOGGING: z.string().transform(val => val === 'true').default('true'),
  LOG_FILE_PATH: z.string().default('./logs/app.log'),
  LOG_MAX_SIZE: z.string().default('100m'),
  LOG_MAX_FILES: z.string().transform(Number).default(10),
  
  // Performance
  REQUEST_TIMEOUT: z.string().transform(Number).default(30000),
  KEEP_ALIVE_TIMEOUT: z.string().transform(Number).default(65000),
  
  // Health checks and monitoring
  HEALTH_CHECK_ENABLED: z.string().transform(val => val === 'true').default('true'),
  METRICS_ENABLED: z.string().transform(val => val === 'true').default('true'),
  PROMETHEUS_ENABLED: z.string().transform(val => val === 'true').default('false'),
  
  // Email configuration (for notifications)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),
  
  // Admin notification settings
  ADMIN_EMAIL: z.string().email().optional(),
  NOTIFY_ON_SECURITY_EVENTS: z.string().transform(val => val === 'true').default('false'),
  
  // External service URLs
  FRONTEND_URL: z.string().url().default('https://yourdomain.com'),
  API_BASE_URL: z.string().url().default('https://api.yourdomain.com'),
  
  // Feature flags
  REGISTRATION_ENABLED: z.string().transform(val => val === 'true').default('true'),
  MAINTENANCE_MODE: z.string().transform(val => val === 'true').default('false'),
  
  // SSL/TLS settings
  SSL_CERT_PATH: z.string().optional(),
  SSL_KEY_PATH: z.string().optional(),
  FORCE_HTTPS: z.string().transform(val => val === 'true').default('true'),
});

type ProductionConfig = z.infer<typeof ProductionConfigSchema>;

// Password strength validation
export const validatePasswordStrength = (password: string, config: ProductionConfig): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < config.PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${config.PASSWORD_MIN_LENGTH} characters long`);
  }
  
  if (config.REQUIRE_STRONG_PASSWORDS) {
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    // Check for common weak passwords
    const commonPasswords = [
      'password', '123456', 'qwerty', 'abc123', 'password123',
      'admin', 'letmein', 'welcome', 'monkey', '1234567890'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common, please choose a stronger password');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Environment-specific configuration loader
export function loadProductionConfig(): ProductionConfig {
  try {
    const config = ProductionConfigSchema.parse(process.env);
    
    // Validate required production settings
    if (config.NODE_ENV === 'production') {
      if (config.JWT_SECRET === 'your-secret-key-change-in-production') {
        throw new Error('JWT_SECRET must be changed from default value in production');
      }
      
      if (!config.SESSION_SECRET) {
        throw new Error('SESSION_SECRET is required in production');
      }
      
      if (config.ALLOWED_ORIGINS === 'https://yourdomain.com') {
        console.warn('Warning: ALLOWED_ORIGINS should be configured for your domain in production');
      }
    }
    
    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Production configuration validation failed:');
      error.errors.forEach(err => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

// Security recommendations for production
export const PRODUCTION_SECURITY_CHECKLIST = [
  '✓ Strong JWT secret (64+ characters)',
  '✓ Session secret configured',
  '✓ HTTPS enforced',
  '✓ Secure cookies enabled',
  '✓ CORS properly configured',
  '✓ Rate limiting enabled',
  '✓ Strong password requirements',
  '✓ Account lockout protection',
  '✓ Request logging enabled',
  '✓ Database backups configured',
  '✓ Security headers (Helmet)',
  '✓ Input sanitization',
  '✓ Error handling without info leakage',
  '✓ Health checks enabled',
  '✓ Monitoring and metrics',
];

export { ProductionConfigSchema };