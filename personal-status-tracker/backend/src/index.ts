import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import statusRoutes from './routes/status';
import authRoutes from './routes/auth';
import privacyRoutes from './routes/privacy';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { ApiResponse } from './types';
import { config, isDevelopment } from './config';
import { logger } from './middleware/logging';
import { 
  requestLogger, 
  performanceLogger, 
  errorLogger, 
  requestIdMiddleware,
  logStartup 
} from './middleware/logging';
import { logCleanupService } from './utils/logCleanup';
import { DatabaseMigrator } from './scripts/migrateDatabase';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true
}));

// Logging middleware
app.use(requestIdMiddleware);
app.use(performanceLogger);
app.use(requestLogger);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res: express.Response<ApiResponse>) => {
  res.json({
    success: true,
    message: 'Personal Status Tracker API is running',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: config.NODE_ENV
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/privacy', privacyRoutes);

// 404 handler
app.use(notFoundHandler);

// Error logging (before error handler)
app.use(errorLogger);

// Error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('Received shutdown signal, closing server...');
  logCleanupService.stop();
  if (server) {
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  } else {
    console.log('No server to close.');
    process.exit(0);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions and unhandled promise rejections
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  logger.error('Uncaught Exception', { 
    error: error.message, 
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  // Don't exit immediately, let other cleanup happen
  setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  logger.error('Unhandled Promise Rejection', { 
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
    timestamp: new Date().toISOString()
  });
  // Don't exit on unhandled rejection in development, just log it
  if (config.NODE_ENV === 'production') {
    setTimeout(() => process.exit(1), 1000);
  }
});

// Run database migrations before starting server
async function startServer() {
  try {
    // Run database migrations
    const migrator = new DatabaseMigrator();
    await migrator.migrate();
    logger.info('Database migrations completed successfully');
    
    // Start the server
    server = app.listen(config.PORT, () => {
      logStartup(config.PORT);
      logCleanupService.start();
      console.log(`🚀 Personal Status Tracker API running on port ${config.PORT}`);
      console.log(`📊 Health check: http://localhost:${config.PORT}/health`);
      console.log(`📈 API endpoints: http://localhost:${config.PORT}/api/status`);
      console.log(`🌍 Environment: ${config.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Only start server if not in test environment
let server: any;
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;