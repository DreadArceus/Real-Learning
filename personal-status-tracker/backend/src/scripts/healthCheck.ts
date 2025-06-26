#!/usr/bin/env node

import { DatabaseMigrator } from './migrateDatabase';
import { config } from '../config';
import sqlite3 from 'sqlite3';
import { logger } from '../utils/jwt';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  checks: {
    database: 'pass' | 'fail';
    migrations: 'pass' | 'fail';
    schema: 'pass' | 'fail';
  };
  errors: string[];
}

class StartupHealthCheck {
  private async checkDatabase(): Promise<boolean> {
    return new Promise((resolve) => {
      const db = new sqlite3.Database(config.DATABASE_PATH || './data/status.db', (err) => {
        if (err) {
          logger.error('Database connection failed:', err);
          resolve(false);
        } else {
          db.close();
          resolve(true);
        }
      });
    });
  }

  private async checkMigrations(): Promise<boolean> {
    try {
      const migrator = new DatabaseMigrator();
      await migrator.connect();
      await migrator.createMigrationsTable();
      const appliedMigrations = await migrator.getAppliedMigrations();
      
      // Check if all expected migrations are applied
      const expectedMigrations = [1, 2]; // Update this as you add more migrations
      const missingMigrations = expectedMigrations.filter(v => !appliedMigrations.includes(v));
      
      return missingMigrations.length === 0;
    } catch (error) {
      logger.error('Migration check failed:', error);
      return false;
    }
  }

  private async checkSchema(): Promise<boolean> {
    return new Promise((resolve) => {
      const db = new sqlite3.Database(config.DATABASE_PATH || './data/status.db', (err) => {
        if (err) {
          resolve(false);
          return;
        }

        // Check if required tables exist
        const requiredTables = ['users', 'status_entries'];
        let checkedTables = 0;
        let allTablesExist = true;

        requiredTables.forEach(tableName => {
          db.get(
            "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
            [tableName],
            (err, row) => {
              if (err || !row) {
                allTablesExist = false;
              }
              checkedTables++;
              if (checkedTables === requiredTables.length) {
                db.close();
                resolve(allTablesExist);
              }
            }
          );
        });
      });
    });
  }

  async runHealthCheck(): Promise<HealthCheckResult> {
    const result: HealthCheckResult = {
      status: 'healthy',
      checks: {
        database: 'pass',
        migrations: 'pass',
        schema: 'pass'
      },
      errors: []
    };

    // Check database connectivity
    try {
      const dbHealthy = await this.checkDatabase();
      if (!dbHealthy) {
        result.checks.database = 'fail';
        result.errors.push('Database connection failed');
        result.status = 'unhealthy';
      }
    } catch (error) {
      result.checks.database = 'fail';
      result.errors.push(`Database check error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.status = 'unhealthy';
    }

    // Check migrations
    try {
      const migrationsHealthy = await this.checkMigrations();
      if (!migrationsHealthy) {
        result.checks.migrations = 'fail';
        result.errors.push('Missing required database migrations');
        result.status = 'unhealthy';
      }
    } catch (error) {
      result.checks.migrations = 'fail';
      result.errors.push(`Migration check error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.status = 'unhealthy';
    }

    // Check schema
    try {
      const schemaHealthy = await this.checkSchema();
      if (!schemaHealthy) {
        result.checks.schema = 'fail';
        result.errors.push('Required database tables missing');
        result.status = 'unhealthy';
      }
    } catch (error) {
      result.checks.schema = 'fail';
      result.errors.push(`Schema check error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.status = 'unhealthy';
    }

    return result;
  }
}

// CLI execution
if (require.main === module) {
  const healthCheck = new StartupHealthCheck();
  healthCheck.runHealthCheck()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
      if (result.status === 'unhealthy') {
        console.error('Health check failed');
        process.exit(1);
      } else {
        console.log('Health check passed');
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error('Health check error:', error.message);
      process.exit(1);
    });
}

export { StartupHealthCheck };