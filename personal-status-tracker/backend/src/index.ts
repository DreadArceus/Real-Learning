import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import statusRoutes from './routes/status';
import authRoutes from './routes/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { ApiResponse } from './types';
import { config, isDevelopment } from './config';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true
}));

// Logging
app.use(morgan(isDevelopment ? 'dev' : 'combined'));

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

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('Received shutdown signal, closing server...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const server = app.listen(config.PORT, () => {
  console.log(`🚀 Personal Status Tracker API running on port ${config.PORT}`);
  console.log(`📊 Health check: http://localhost:${config.PORT}/health`);
  console.log(`📈 API endpoints: http://localhost:${config.PORT}/api/status`);
  console.log(`🌍 Environment: ${config.NODE_ENV}`);
});

export default app;