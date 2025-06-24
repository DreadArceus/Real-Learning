"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.database = exports.Database = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../config");
const dbPath = path_1.default.resolve(config_1.config.DATABASE_PATH);
// Enable verbose mode for debugging
const sqlite = sqlite3_1.default.verbose();
class Database {
    constructor() {
        this.db = new sqlite.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            }
            else {
                console.log('Connected to SQLite database.');
                this.initializeTables();
            }
        });
    }
    initializeTables() {
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
        this.db.run(createStatusTable, (err) => {
            if (err) {
                console.error('Error creating status_entries table:', err.message);
            }
            else {
                console.log('Status entries table ready.');
            }
        });
    }
    getDatabase() {
        return this.db;
    }
    close() {
        this.db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            }
            else {
                console.log('Database connection closed.');
            }
        });
    }
}
exports.Database = Database;
// Create and export a singleton instance
exports.database = new Database();
//# sourceMappingURL=database.js.map