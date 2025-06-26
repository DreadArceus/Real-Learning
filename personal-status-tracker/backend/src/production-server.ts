import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config, isProduction } from './config';
import { logger, logStartup, requestLogger, errorLogger, requestIdMiddleware, performanceLogger } from './middleware/logging';
import { helmetConfig, corsOptions, sanitizeInput, requestSizeLimit, trackRequests, requestTimeout } from './middleware/security';
import { generalLimiter, authLimiter, registrationLimiter, adminLimiter } from './middleware/rateLimiter';
import { requestMetrics, errorMetrics, healthCheck, getMetrics } from './middleware/monitoring';
import { validateCSP } from './middleware/enhancedValidation';
import { optimizedDatabase } from './models/optimizedDatabase';

// Routes
import authRoutes from './routes/auth';
import statusRoutes from './routes/status';

// Error handling
import { errorHandler } from './middleware/errorHandler';
import { AppError } from './errors/AppError';
import { DatabaseMigrator } from './scripts/migrateDatabase';

/**
 * Production-ready Express server with comprehensive security, monitoring, and performance optimizations
 */

class ProductionServer {
  private app: express.Application;
  private server: any;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Trust proxy for production deployment
    if (isProduction) {
      this.app.set('trust proxy', config.TRUST_PROXY || true);
    }

    // Request ID for tracing
    this.app.use(requestIdMiddleware);

    // Security headers
    this.app.use(helmetConfig);

    // CORS configuration
    this.app.use(cors(corsOptions));

    // Compression for better performance
    this.app.use(compression({
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        // Don't compress responses with this request header
        if (req.headers['x-no-compression']) {
          return false;
        }
        // Fallback to standard filter function
        return compression.filter(req, res);
      }
    }));

    // Request size limiting
    this.app.use(requestSizeLimit);

    // Body parsing with size limits
    this.app.use(express.json({ 
      limit: '10mb',
      strict: true,
      type: ['application/json']
    }));
    
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb',
      parameterLimit: 1000
    }));

    // Request sanitization
    this.app.use(sanitizeInput);

    // CSP validation
    this.app.use(validateCSP);

    // Request tracking and monitoring
    this.app.use(trackRequests);
    this.app.use(requestMetrics);
    this.app.use(performanceLogger);

    // Request logging (after metrics for accurate timing)
    if (config.ENABLE_REQUEST_LOGGING) {
      this.app.use(requestLogger);
    }

    // Request timeout
    this.app.use(requestTimeout(config.REQUEST_TIMEOUT || 30000));

    // Rate limiting (applied before routes)
    this.app.use('/api', generalLimiter);
  }

  private setupRoutes(): void {
    // Health check endpoint (no rate limiting)
    this.app.get('/health', healthCheck);
    this.app.get('/ping', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // Metrics endpoint (admin only, separate rate limiting)
    this.app.get('/metrics', adminLimiter, getMetrics);

    // API routes with specific rate limiting
    this.app.use('/api/auth/login', authLimiter);
    this.app.use('/api/auth/register', registrationLimiter);
    this.app.use('/api/auth/admin', adminLimiter);
    
    // Main API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/status', statusRoutes);

    // API documentation (if in development)
    if (!isProduction) {
      this.app.get('/api', (req, res) => {
        res.json({
          title: 'Personal Status Tracker API',
          version: process.env.npm_package_version || '1.0.0',
          environment: config.NODE_ENV,
          endpoints: {
            'GET /health': 'Health check',
            'GET /metrics': 'System metrics (admin only)',
            'POST /api/auth/login': 'User login',
            'POST /api/auth/register': 'User registration',
            'GET /api/auth/me': 'Current user info',
            'GET /api/status': 'Get user status',
            'POST /api/status': 'Create status entry',
            'PUT /api/status': 'Update status',
            'DELETE /api/status': 'Delete all status entries'
          }
        });
      });
    }

    // 404 handler for unknown routes
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        code: 'NOT_FOUND',
        path: req.originalUrl,
        method: req.method
      });
    });
  }

  private setupErrorHandling(): void {
    // Error metrics collection
    this.app.use(errorMetrics);

    // Error logging
    this.app.use(errorLogger);

    // Global error handler (must be last)
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Run database migrations first
      const migrator = new DatabaseMigrator();
      await migrator.migrate();
      logger.info('Database migrations completed successfully');
      
      // Wait for database to be ready
      await this.waitForDatabase();

      // Start server
      const port = config.PORT || 3001;
      
      this.server = this.app.listen(port, () => {
        logStartup(port);
        
        if (isProduction) {
          logger.info('Production server started', {
            port,
            environment: config.NODE_ENV,
            features: {
              cors: true,
              helmet: true,
              compression: true,
              rateLimiting: true,
              monitoring: true,
              logging: config.ENABLE_REQUEST_LOGGING
            }
          });
        }
      });

      // Configure server timeouts
      this.server.timeout = config.REQUEST_TIMEOUT || 30000;
      this.server.keepAliveTimeout = config.KEEP_ALIVE_TIMEOUT || 65000;
      this.server.headersTimeout = (config.KEEP_ALIVE_TIMEOUT || 65000) + 1000;

      // Setup graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('Failed to start server', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      process.exit(1);
    }
  }

  private async waitForDatabase(maxRetries = 10, retryDelay = 1000): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        // Simple database health check
        await optimizedDatabase.get('SELECT 1 as test');
        logger.info('Database connection verified');
        return;
      } catch (error) {
        logger.warn(`Database connection attempt ${i + 1}/${maxRetries} failed`, {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        if (i === maxRetries - 1) {
          throw new Error('Database connection failed after maximum retries');
        }
        
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown`);

      // Stop accepting new connections
      if (this.server) {
        this.server.close(async () => {
          logger.info('HTTP server closed');

          try {
            // Close database connections
            await optimizedDatabase.close();
            logger.info('Database connections closed');

            // Exit successfully
            process.exit(0);
          } catch (error) {
            logger.error('Error during shutdown', {
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            process.exit(1);
          }
        });

        // Force close after timeout
        setTimeout(() => {
          logger.error('Forced shutdown due to timeout');
          process.exit(1);
        }, 30000); // 30 seconds
      }
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack
      });
      
      // Try graceful shutdown, then force exit
      gracefulShutdown('uncaughtException').finally(() => {
        setTimeout(() => process.exit(1), 5000);
      });
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', {
        reason: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined
      });
      
      // For unhandled rejections, we log but don't exit
      // as they might not be fatal
    });
  }

  public getApp(): express.Application {
    return this.app;
  }

  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(resolve);
      } else {
        resolve();
      }
    });
  }
}

// Create and export server instance
const productionServer = new ProductionServer();

// Start server if this file is run directly
if (require.main === module) {
  productionServer.start().catch((error) => {
    logger.error('Failed to start production server', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    process.exit(1);
  });
}

export default productionServer.getApp();
export { productionServer };