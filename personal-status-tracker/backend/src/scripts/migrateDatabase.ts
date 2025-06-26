#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import { logger } from '../utils/jwt';

interface Migration {
  version: number;
  description: string;
  up: string[];
  down: string[];
}

const migrations: Migration[] = [
  {
    version: 1,
    description: "Add privacy policy fields to users table",
    up: [
      "ALTER TABLE users ADD COLUMN privacy_policy_accepted BOOLEAN DEFAULT 0",
      "ALTER TABLE users ADD COLUMN privacy_policy_version TEXT DEFAULT '1.0'",
      "ALTER TABLE users ADD COLUMN privacy_policy_accepted_date TEXT"
    ],
    down: [
      "ALTER TABLE users DROP COLUMN privacy_policy_accepted",
      "ALTER TABLE users DROP COLUMN privacy_policy_version", 
      "ALTER TABLE users DROP COLUMN privacy_policy_accepted_date"
    ]
  },
  {
    version: 2,
    description: "Make last_water_intake nullable in status_entries",
    up: [
      `CREATE TABLE status_entries_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT DEFAULT 'default_user',
        last_water_intake TEXT,
        altitude INTEGER NOT NULL CHECK (altitude >= 1 AND altitude <= 10),
        last_updated TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      "INSERT INTO status_entries_new SELECT * FROM status_entries",
      "DROP TABLE status_entries",
      "ALTER TABLE status_entries_new RENAME TO status_entries"
    ],
    down: [
      `CREATE TABLE status_entries_old (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT DEFAULT 'default_user',
        last_water_intake TEXT NOT NULL,
        altitude INTEGER NOT NULL CHECK (altitude >= 1 AND altitude <= 10),
        last_updated TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      "INSERT INTO status_entries_old SELECT * FROM status_entries WHERE last_water_intake IS NOT NULL",
      "DROP TABLE status_entries",
      "ALTER TABLE status_entries_old RENAME TO status_entries"
    ]
  }
];

class DatabaseMigrator {
  private db: sqlite3.Database;
  private dbPath: string;

  constructor() {
    this.dbPath = config.DATABASE_PATH || './data/status.db';
    
    // Ensure directory exists
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async createMigrationsTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version INTEGER UNIQUE NOT NULL,
        description TEXT NOT NULL,
        applied_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    return new Promise((resolve, reject) => {
      this.db.run(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async getAppliedMigrations(): Promise<number[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        "SELECT version FROM migrations ORDER BY version",
        (err, rows: any[]) => {
          if (err) reject(err);
          else resolve(rows.map(row => row.version));
        }
      );
    });
  }

  async runMigration(migration: Migration): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run("BEGIN TRANSACTION");
        
        // Run all migration statements
        let completed = 0;
        const statements = migration.up;
        
        if (statements.length === 0) {
          this.db.run("COMMIT", (err) => {
            if (err) reject(err);
            else resolve();
          });
          return;
        }

        statements.forEach((statement, index) => {
          this.db.run(statement, (err) => {
            if (err) {
              this.db.run("ROLLBACK");
              reject(new Error(`Migration ${migration.version} failed at statement ${index + 1}: ${err.message}`));
              return;
            }
            
            completed++;
            if (completed === statements.length) {
              // Record migration as applied
              this.db.run(
                "INSERT INTO migrations (version, description) VALUES (?, ?)",
                [migration.version, migration.description],
                (err) => {
                  if (err) {
                    this.db.run("ROLLBACK");
                    reject(err);
                  } else {
                    this.db.run("COMMIT", (err) => {
                      if (err) reject(err);
                      else resolve();
                    });
                  }
                }
              );
            }
          });
        });
      });
    });
  }

  async migrate(): Promise<void> {
    try {
      await this.connect();
      await this.createMigrationsTable();
      
      const appliedMigrations = await this.getAppliedMigrations();
      const pendingMigrations = migrations.filter(m => !appliedMigrations.includes(m.version));
      
      if (pendingMigrations.length === 0) {
        logger.info('No pending migrations');
        return;
      }

      logger.info(`Running ${pendingMigrations.length} migrations`);
      
      for (const migration of pendingMigrations.sort((a, b) => a.version - b.version)) {
        logger.info(`Applying migration ${migration.version}: ${migration.description}`);
        await this.runMigration(migration);
        logger.info(`Migration ${migration.version} completed successfully`);
      }
      
      logger.info('All migrations completed successfully');
      
    } catch (error) {
      logger.error('Migration failed:', error);
      throw error;
    } finally {
      if (this.db) {
        this.db.close();
      }
    }
  }

  async checkColumnExists(tableName: string, columnName: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.get(
        `PRAGMA table_info(${tableName})`,
        (err, rows: any) => {
          if (err) {
            reject(err);
          } else {
            // Get all columns
            this.db.all(
              `PRAGMA table_info(${tableName})`,
              (err, columns: any[]) => {
                if (err) {
                  reject(err);
                } else {
                  const columnExists = columns.some(col => col.name === columnName);
                  resolve(columnExists);
                }
              }
            );
          }
        }
      );
    });
  }
}

// CLI execution
if (require.main === module) {
  const migrator = new DatabaseMigrator();
  migrator.migrate()
    .then(() => {
      console.log('Migrations completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error.message);
      process.exit(1);
    });
}

export { DatabaseMigrator, migrations };