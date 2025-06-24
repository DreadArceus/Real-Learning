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
        console.error('Error opening database:', err.message);
      } else {
        console.log('Connected to SQLite database.');
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
        console.error('Error creating users table:', err.message);
      } else {
        console.log('Users table ready.');
      }
    });

    // Create status entries table
    this.db.run(createStatusTable, (err) => {
      if (err) {
        console.error('Error creating status_entries table:', err.message);
      } else {
        console.log('Status entries table ready.');
      }
    });
  }

  public getDatabase(): sqlite3.Database {
    return this.db;
  }

  public close(): void {
    this.db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed.');
      }
    });
  }
}

// Create and export a singleton instance
export const database = new Database();