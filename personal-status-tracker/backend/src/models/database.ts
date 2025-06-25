import sqlite3 from 'sqlite3';
import path from 'path';
import { config } from '../config';

const dbPath = path.resolve(config.DATABASE_PATH);

// Enable verbose mode for debugging
const sqlite = sqlite3.verbose();

export class Database {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite.Database(dbPath, (err) => {
      if (err) {
        throw new Error(`Database connection failed: ${err.message}`);
      } else {
        this.initializeTables();
      }
    });
  }

  private initializeTables(): void {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'viewer')),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_login TEXT
      )
    `;

    const createStatusTable = `
      CREATE TABLE IF NOT EXISTS status_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT DEFAULT 'default_user',
        last_water_intake TEXT NOT NULL,
        altitude INTEGER NOT NULL CHECK (altitude >= 1 AND altitude <= 10),
        last_updated TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create users table first
    this.db.run(createUsersTable, (err) => {
      if (err) {
        throw new Error(`Users table creation failed: ${err.message}`);
      }
    });

    // Create status entries table
    this.db.run(createStatusTable, (err) => {
      if (err) {
        throw new Error(`Status table creation failed: ${err.message}`);
      }
    });
  }

  public getDatabase(): sqlite3.Database {
    return this.db;
  }

  public close(): void {
    this.db.close((err) => {
      if (err) {
        throw new Error(`Database close failed: ${err.message}`);
      }
    });
  }
}

// Create and export a singleton instance
export const database = new Database();