import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import { logger } from './logging';
import { config } from '../config';

/**
 * Production-ready monitoring and metrics middleware
 */

// System metrics storage
interface SystemMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    byMethod: Record<string, number>;
    byStatus: Record<string, number>;
    byEndpoint: Record<string, number>;
  };
  performance: {
    averageResponseTime: number;
    maxResponseTime: number;
    minResponseTime: number;
    responseTimeHistory: number[];
  };
  errors: {
    total: number;
    byType: Record<string, number>;
    recent: Array<{ timestamp: number; error: string; endpoint: string }>;
  };
  database: {
    connections: number;
    queries: number;
    averageQueryTime: number;
    slowQueries: number;
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  system: {
    uptime: number;
    startTime: number;
    nodeVersion: string;
    platform: string;
  };
}

class MetricsCollector {
  private metrics: SystemMetrics;
  private readonly maxHistorySize = 1000;
  private readonly maxRecentErrors = 100;

  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byMethod: {},
        byStatus: {},
        byEndpoint: {}
      },
      performance: {
        averageResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: Number.MAX_SAFE_INTEGER,
        responseTimeHistory: []
      },
      errors: {
        total: 0,
        byType: {},
        recent: []
      },
      database: {
        connections: 0,
        queries: 0,
        averageQueryTime: 0,
        slowQueries: 0
      },
      memory: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0
      },
      system: {
        uptime: 0,
        startTime: Date.now(),
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    // Update system metrics periodically
    setInterval(() => this.updateSystemMetrics(), 30000); // Every 30 seconds
  }

  recordRequest(method: string, endpoint: string, statusCode: number, responseTime: number) {
    // Update request counters
    this.metrics.requests.total++;
    this.metrics.requests.byMethod[method] = (this.metrics.requests.byMethod[method] || 0) + 1;
    this.metrics.requests.byStatus[statusCode] = (this.metrics.requests.byStatus[statusCode] || 0) + 1;
    this.metrics.requests.byEndpoint[endpoint] = (this.metrics.requests.byEndpoint[endpoint] || 0) + 1;

    // Update success/failure counters
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }

    // Update performance metrics
    this.updatePerformanceMetrics(responseTime);
  }

  recordError(error: Error, endpoint: string) {
    this.metrics.errors.total++;
    
    const errorType = error.constructor.name;
    this.metrics.errors.byType[errorType] = (this.metrics.errors.byType[errorType] || 0) + 1;

    // Add to recent errors (with size limit)
    this.metrics.errors.recent.unshift({
      timestamp: Date.now(),
      error: error.message,
      endpoint
    });

    if (this.metrics.errors.recent.length > this.maxRecentErrors) {
      this.metrics.errors.recent.pop();
    }
  }

  recordDatabaseQuery(queryTime: number, isSlowQuery = false) {
    this.metrics.database.queries++;
    
    if (isSlowQuery) {
      this.metrics.database.slowQueries++;
    }

    // Update average query time
    const totalTime = this.metrics.database.averageQueryTime * (this.metrics.database.queries - 1) + queryTime;
    this.metrics.database.averageQueryTime = totalTime / this.metrics.database.queries;
  }

  private updatePerformanceMetrics(responseTime: number) {
    // Add to history (with size limit)
    this.metrics.performance.responseTimeHistory.unshift(responseTime);
    if (this.metrics.performance.responseTimeHistory.length > this.maxHistorySize) {
      this.metrics.performance.responseTimeHistory.pop();
    }

    // Update min/max
    this.metrics.performance.maxResponseTime = Math.max(this.metrics.performance.maxResponseTime, responseTime);
    this.metrics.performance.minResponseTime = Math.min(this.metrics.performance.minResponseTime, responseTime);

    // Update average
    const total = this.metrics.performance.responseTimeHistory.reduce((sum, time) => sum + time, 0);
    this.metrics.performance.averageResponseTime = total / this.metrics.performance.responseTimeHistory.length;
  }

  private updateSystemMetrics() {
    const memUsage = process.memoryUsage();
    this.metrics.memory = {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss
    };

    this.metrics.system.uptime = Date.now() - this.metrics.system.startTime;
  }

  getMetrics(): SystemMetrics {
    this.updateSystemMetrics();
    return { ...this.metrics };
  }

  getHealthStatus() {
    const metrics = this.getMetrics();
    const now = Date.now();
    const last5Min = now - 5 * 60 * 1000;

    // Calculate error rate in last 5 minutes
    const recentErrors = metrics.errors.recent.filter(error => error.timestamp > last5Min).length;
    const recentRequests = Math.max(1, metrics.requests.total * 0.1); // Rough estimate
    const errorRate = recentErrors / recentRequests;

    // Calculate average response time in last 100 requests
    const recentResponseTimes = metrics.performance.responseTimeHistory.slice(0, 100);
    const avgResponseTime = recentResponseTimes.length > 0 
      ? recentResponseTimes.reduce((sum, time) => sum + time, 0) / recentResponseTimes.length 
      : 0;

    // Memory usage percentage
    const memoryUsage = metrics.memory.heapUsed / metrics.memory.heapTotal;

    // Determine health status
    let status = 'healthy';
    const issues = [];

    if (errorRate > 0.05) { // More than 5% error rate
      status = 'unhealthy';
      issues.push(`High error rate: ${(errorRate * 100).toFixed(2)}%`);
    }

    if (avgResponseTime > 5000) { // More than 5 seconds average
      status = status === 'healthy' ? 'degraded' : 'unhealthy';
      issues.push(`Slow response time: ${avgResponseTime.toFixed(0)}ms`);
    }

    if (memoryUsage > 0.9) { // More than 90% memory usage
      status = status === 'healthy' ? 'degraded' : 'unhealthy';
      issues.push(`High memory usage: ${(memoryUsage * 100).toFixed(1)}%`);
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: metrics.system.uptime,
      version: process.env.npm_package_version || '1.0.0',
      issues: issues.length > 0 ? issues : undefined,
      metrics: {
        requests: {
          total: metrics.requests.total,
          errorRate: errorRate,
          averageResponseTime: avgResponseTime
        },
        memory: {
          usage: memoryUsage,
          heapUsed: Math.round(metrics.memory.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(metrics.memory.heapTotal / 1024 / 1024) // MB
        },
        database: {
          queries: metrics.database.queries,
          averageQueryTime: metrics.database.averageQueryTime,
          slowQueries: metrics.database.slowQueries
        }
      }
    };
  }

  reset() {
    // Reset all metrics to initial values
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byMethod: {},
        byStatus: {},
        byEndpoint: {}
      },
      performance: {
        averageResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: Number.MAX_SAFE_INTEGER,
        responseTimeHistory: []
      },
      errors: {
        total: 0,
        byType: {},
        recent: []
      },
      database: {
        connections: 0,
        queries: 0,
        averageQueryTime: 0,
        slowQueries: 0
      },
      memory: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0
      },
      system: {
        uptime: 0,
        startTime: Date.now(),
        nodeVersion: process.version,
        platform: process.platform
      }
    };
  }
}

// Global metrics collector instance
export const metricsCollector = new MetricsCollector();

// Request metrics middleware
export const requestMetrics = (req: Request, res: Response, next: NextFunction) => {
  const startTime = performance.now();
  
  // Capture original end function
  const originalEnd = res.end;
  const originalSend = res.send;

  // Override response methods to capture metrics
  res.end = function(this: Response, ...args: any[]) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    // Record metrics
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    metricsCollector.recordRequest(req.method, endpoint, res.statusCode, responseTime);
    
    // Log slow requests
    if (responseTime > 1000) {
      logger.warn('Slow Request', {
        method: req.method,
        url: req.originalUrl,
        responseTime: `${responseTime.toFixed(2)}ms`,
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    }
    
    // Call original end
    return originalEnd.apply(this, args as Parameters<typeof originalEnd>);
  };

  res.send = function(this: Response, body?: any) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    // Set response time header
    this.set('X-Response-Time', `${responseTime.toFixed(2)}ms`);
    
    return originalSend.call(this, body);
  };

  next();
};

// Error metrics middleware
export const errorMetrics = (error: Error, req: Request, res: Response, next: NextFunction) => {
  const endpoint = `${req.method} ${req.route?.path || req.path}`;
  metricsCollector.recordError(error, endpoint);
  next(error);
};

// Database metrics helper
export const recordDatabaseMetrics = (queryTime: number, query?: string) => {
  const isSlowQuery = queryTime > 1000; // Queries taking more than 1 second
  metricsCollector.recordDatabaseQuery(queryTime, isSlowQuery);
  
  if (isSlowQuery && query) {
    logger.warn('Slow Database Query', {
      queryTime: `${queryTime}ms`,
      query: query.substring(0, 200) // Truncate long queries
    });
  }
};

// Health check endpoint handler
export const healthCheck = (req: Request, res: Response) => {
  try {
    const health = metricsCollector.getHealthStatus();
    
    const statusCode = health.status === 'healthy' ? 200 
      : health.status === 'degraded' ? 200 
      : 503;

    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
};

// Metrics endpoint handler (admin only)
export const getMetrics = (req: Request, res: Response) => {
  try {
    const metrics = metricsCollector.getMetrics();
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get metrics', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics'
    });
  }
};

// Memory monitoring and cleanup
const monitorMemory = () => {
  const usage = process.memoryUsage();
  const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
  const memoryUsage = usage.heapUsed / usage.heapTotal;

  // Log memory usage if high
  if (memoryUsage > 0.8) {
    logger.warn('High Memory Usage', {
      heapUsed: `${heapUsedMB}MB`,
      heapTotal: `${heapTotalMB}MB`,
      usage: `${(memoryUsage * 100).toFixed(1)}%`
    });
  }

  // Force garbage collection if available and memory is very high
  if (memoryUsage > 0.95 && global.gc) {
    logger.info('Forcing garbage collection due to high memory usage');
    global.gc();
  }
};

// Start memory monitoring
setInterval(monitorMemory, 60000); // Check every minute

// Process event monitoring
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  
  metricsCollector.recordError(error, 'uncaught-exception');
  
  // Graceful shutdown
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined
  });
  
  if (reason instanceof Error) {
    metricsCollector.recordError(reason, 'unhandled-rejection');
  }
});

// Export metrics for external monitoring tools
export { metricsCollector as metrics };