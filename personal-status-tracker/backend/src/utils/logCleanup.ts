import fs from 'fs';
import path from 'path';
import { logger } from '../middleware/logging';

const LOG_RETENTION_DAYS = 30;
const CLEANUP_INTERVAL_HOURS = 24;

export class LogCleanupService {
  private cleanupInterval: NodeJS.Timeout | null = null;

  start(): void {
    // Run cleanup immediately
    this.cleanup();
    
    // Schedule recurring cleanup
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, CLEANUP_INTERVAL_HOURS * 60 * 60 * 1000); // Convert hours to milliseconds

    logger.info('Log cleanup service started', {
      retentionDays: LOG_RETENTION_DAYS,
      cleanupIntervalHours: CLEANUP_INTERVAL_HOURS
    });
  }

  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info('Log cleanup service stopped');
    }
  }

  private cleanup(): void {
    const logsDir = './logs';
    
    if (!fs.existsSync(logsDir)) {
      return;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - LOG_RETENTION_DAYS);

    try {
      const files = fs.readdirSync(logsDir);
      let deletedCount = 0;
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.join(logsDir, file);
        const stats = fs.statSync(filePath);

        // Only process encrypted log files and regular log files
        if (file.endsWith('.enc') || file.endsWith('.log')) {
          if (stats.mtime < cutoffDate) {
            try {
              totalSize += stats.size;
              fs.unlinkSync(filePath);
              deletedCount++;
              
              logger.info('Deleted old log file', {
                filename: file,
                ageInDays: Math.floor((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24)),
                sizeInBytes: stats.size
              });
            } catch (error) {
              logger.error('Failed to delete old log file', {
                filename: file,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
            }
          }
        }
      }

      if (deletedCount > 0) {
        logger.info('Log cleanup completed', {
          deletedFiles: deletedCount,
          totalSizeFreed: totalSize,
          retentionDays: LOG_RETENTION_DAYS
        });
      } else {
        logger.debug('Log cleanup completed - no files to delete');
      }

    } catch (error) {
      logger.error('Log cleanup failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        logsDirectory: logsDir
      });
    }
  }

  // Manual cleanup method for testing or admin use
  public manualCleanup(): void {
    logger.info('Manual log cleanup initiated');
    this.cleanup();
  }

  // Get cleanup status
  public getStatus(): {
    isRunning: boolean;
    retentionDays: number;
    cleanupIntervalHours: number;
    nextCleanup?: Date;
  } {
    const nextCleanup = this.cleanupInterval 
      ? new Date(Date.now() + CLEANUP_INTERVAL_HOURS * 60 * 60 * 1000)
      : undefined;

    return {
      isRunning: this.cleanupInterval !== null,
      retentionDays: LOG_RETENTION_DAYS,
      cleanupIntervalHours: CLEANUP_INTERVAL_HOURS,
      nextCleanup
    };
  }
}

// Export singleton instance
export const logCleanupService = new LogCleanupService();