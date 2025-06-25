import sqlite3 from 'sqlite3';
import { Database as SQLiteDatabase } from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import { logger } from '../middleware/logging';
import { recordDatabaseMetrics } from '../middleware/monitoring';

/**
 * Production-ready database connection with optimization and monitoring
 */

interface DatabaseConfig {
  path: string;
  timeout: number;
  maxConnections: number;
  enableWAL: boolean;
  enableForeignKeys: boolean;
  cacheSize: number;
  journalMode: string;
  synchronous: string;
  tempStore: string;
}

class OptimizedDatabase {
  private db!: SQLiteDatabase;
  private config: DatabaseConfig;
  private connectionPool: SQLiteDatabase[] = [];
  private isInitialized = false;
  private queryCount = 0;
  private backupInterval?: NodeJS.Timeout;

  constructor() {
    this.config = {
      path: config.DATABASE_PATH,
      timeout: config.DB_CONNECTION_TIMEOUT || 30000,
      maxConnections: 10,
      enableWAL: true,
      enableForeignKeys: true,
      cacheSize: 20000, // 20MB cache
      journalMode: 'WAL',
      synchronous: 'NORMAL',
      tempStore: 'MEMORY'
    };

    this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    try {
      // Ensure directory exists
      const dbDir = path.dirname(this.config.path);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Create main database connection
      this.db = await this.createConnection(this.config.path);
      
      // Apply performance optimizations
      await this.applyOptimizations();
      
      // Initialize schema
      await this.initializeSchema();
      
      // Setup backup if enabled
      if (config.DB_BACKUP_ENABLED) {
        this.setupBackup();
      }
      
      this.isInitialized = true;
      logger.info('Database initialized successfully', {
        path: this.config.path,
        walEnabled: this.config.enableWAL,
        cacheSize: this.config.cacheSize
      });
      
    } catch (error) {
      logger.error('Failed to initialize database', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: this.config.path
      });
      throw error;
    }
  }

  private createConnection(dbPath: string): Promise<SQLiteDatabase> {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(db);
        }
      });
      
      // Set busy timeout
      db.configure('busyTimeout', this.config.timeout);
    });
  }

  private async applyOptimizations(): Promise<void> {
    const optimizations = [
      // Enable WAL mode for better concurrency
      `PRAGMA journal_mode = ${this.config.journalMode}`,
      
      // Set synchronous mode for better performance
      `PRAGMA synchronous = ${this.config.synchronous}`,
      
      // Enable foreign key constraints
      `PRAGMA foreign_keys = ${this.config.enableForeignKeys ? 'ON' : 'OFF'}`,
      
      // Set cache size (negative value means KB)
      `PRAGMA cache_size = -${this.config.cacheSize}`,
      
      // Store temporary tables in memory
      `PRAGMA temp_store = ${this.config.tempStore}`,
      
      // Optimize for faster writes
      'PRAGMA locking_mode = NORMAL',
      
      // Auto-vacuum to keep database compact
      'PRAGMA auto_vacuum = INCREMENTAL',
      
      // Analyze query planner statistics
      'PRAGMA optimize'
    ];

    for (const pragma of optimizations) {
      await this.exec(pragma);
    }
  }

  private async initializeSchema(): Promise<void> {
    const schemaQueries = [
      // Users table with indexes
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'viewer')),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_login TEXT,
        failed_login_attempts INTEGER DEFAULT 0,
        locked_until TEXT,
        password_changed_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      
      'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
      'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
      'CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login)',
      
      // Status entries table with indexes
      `CREATE TABLE IF NOT EXISTS status_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        last_water_intake TEXT NOT NULL,
        altitude INTEGER NOT NULL CHECK (altitude BETWEEN 1 AND 10),
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      
      'CREATE INDEX IF NOT EXISTS idx_status_user_id ON status_entries(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_status_created_at ON status_entries(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_status_updated_at ON status_entries(updated_at)',
      'CREATE INDEX IF NOT EXISTS idx_status_composite ON status_entries(user_id, created_at)',
      
      // Audit log table for security
      `CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        table_name TEXT,
        record_id TEXT,
        old_values TEXT,
        new_values TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
      )`,
      
      'CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_log(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action)',
      'CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_log(created_at)',
      
      // Sessions table for better session management
      `CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        data TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_accessed TEXT DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT,
        user_agent TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      
      'CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)',
      
      // Create triggers for updated_at timestamp
      `CREATE TRIGGER IF NOT EXISTS update_status_updated_at 
       AFTER UPDATE ON status_entries
       BEGIN
         UPDATE status_entries SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
       END`,
      
      // Create trigger for audit logging
      `CREATE TRIGGER IF NOT EXISTS audit_users_update
       AFTER UPDATE ON users
       BEGIN
         INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, new_values)
         VALUES (NEW.id, 'UPDATE', 'users', NEW.id, 
                json_object('username', OLD.username, 'role', OLD.role),
                json_object('username', NEW.username, 'role', NEW.role));
       END`
    ];

    for (const query of schemaQueries) {
      await this.exec(query);
    }
  }

  private setupBackup(): void {
    const backupInterval = config.DB_BACKUP_INTERVAL || 86400000; // 24 hours
    
    this.backupInterval = setInterval(async () => {
      try {
        await this.createBackup();
      } catch (error) {
        logger.error('Database backup failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }, backupInterval);
    
    logger.info('Database backup scheduled', {
      interval: `${backupInterval / 1000 / 60 / 60} hours`
    });
  }

  private async createBackup(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${this.config.path}.backup.${timestamp}`;
    
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.exec(`VACUUM INTO '${backupPath}'`, (err) => {
          if (err) {
            reject(err);
          } else {
            logger.info('Database backup created', { path: backupPath });
            
            // Clean up old backups (keep last 7 days)
            this.cleanupOldBackups();
            resolve();
          }
        });
      });
    });
  }

  private cleanupOldBackups(): void {
    try {
      const dbDir = path.dirname(this.config.path);
      const files = fs.readdirSync(dbDir);
      const backupFiles = files
        .filter(file => file.includes('.backup.'))
        .map(file => ({
          name: file,
          path: path.join(dbDir, file),
          stat: fs.statSync(path.join(dbDir, file))
        }))
        .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime());

      // Keep only the 7 most recent backups
      const filesToDelete = backupFiles.slice(7);
      
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
        logger.info('Old backup deleted', { path: file.path });
      }
    } catch (error) {
      logger.warn('Failed to cleanup old backups', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Enhanced query methods with monitoring
  async get<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    return this.executeQuery('get', sql, params);
  }

  async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return this.executeQuery('all', sql, params);
  }

  async run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    return this.executeQuery('run', sql, params);
  }

  async exec(sql: string): Promise<void> {
    return this.executeQuery('exec', sql);
  }

  private async executeQuery<T>(method: string, sql: string, params?: any[]): Promise<T> {
    if (!this.isInitialized) {
      throw new Error('Database not initialized');
    }

    const startTime = Date.now();
    this.queryCount++;

    return new Promise((resolve, reject) => {
      const callback = (err: Error | null, result?: any) => {
        const duration = Date.now() - startTime;
        recordDatabaseMetrics(duration, sql);

        if (err) {
          logger.error('Database query failed', {
            sql: sql.substring(0, 200),
            params,
            error: err.message,
            duration: `${duration}ms`
          });
          reject(err);
        } else {
          if (duration > 1000) {
            logger.warn('Slow database query', {
              sql: sql.substring(0, 200),
              duration: `${duration}ms`,
              params
            });
          }
          resolve(result);
        }
      };

      try {
        switch (method) {
          case 'get':
            this.db.get(sql, params || [], callback);
            break;
          case 'all':
            this.db.all(sql, params || [], callback);
            break;
          case 'run':
            this.db.run(sql, params || [], function(err) {
              callback(err, { lastID: this.lastID, changes: this.changes });
            });
            break;
          case 'exec':
            this.db.exec(sql, callback);
            break;
          default:
            reject(new Error(`Unknown query method: ${method}`));
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        recordDatabaseMetrics(duration, sql);
        reject(error);
      }
    });
  }

  // Transaction support
  async transaction<T>(callback: (db: OptimizedDatabase) => Promise<T>): Promise<T> {
    await this.exec('BEGIN TRANSACTION');
    
    try {
      const result = await callback(this);
      await this.exec('COMMIT');
      return result;
    } catch (error) {
      await this.exec('ROLLBACK');
      throw error;
    }
  }

  // Database maintenance
  async optimize(): Promise<void> {
    logger.info('Starting database optimization');
    
    await this.exec('PRAGMA optimize');
    await this.exec('PRAGMA incremental_vacuum(1000)');
    await this.exec('ANALYZE');
    
    logger.info('Database optimization completed');
  }

  // Get database statistics
  getStats() {
    return {
      queryCount: this.queryCount,
      isInitialized: this.isInitialized,
      path: this.config.path,
      config: { ...this.config }
    };
  }

  // Graceful shutdown
  async close(): Promise<void> {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }

    // Close connection pool
    for (const conn of this.connectionPool) {
      await new Promise<void>((resolve) => {
        conn.close(() => resolve());
      });
    }

    // Close main connection
    await new Promise<void>((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          logger.info('Database connection closed');
          resolve();
        }
      });
    });
  }
}

// Create and export optimized database instance
export const optimizedDatabase = new OptimizedDatabase();

// Export for backward compatibility
export const database = {
  getDatabase: () => optimizedDatabase
};