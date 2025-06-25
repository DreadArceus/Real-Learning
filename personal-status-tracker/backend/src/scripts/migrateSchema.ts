import { database } from '../models/database';

const db = database.getDatabase();

// Migration to allow null values in status_entries
db.serialize(() => {
  // Create new table with null-friendly schema
  db.run(`
    CREATE TABLE status_entries_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT DEFAULT 'default_user',
      last_water_intake TEXT,
      altitude INTEGER CHECK (altitude IS NULL OR (altitude >= 1 AND altitude <= 10)),
      last_updated TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Copy existing data
  db.run(`
    INSERT INTO status_entries_new (id, user_id, last_water_intake, altitude, last_updated, created_at)
    SELECT id, user_id, last_water_intake, altitude, last_updated, created_at
    FROM status_entries
  `);

  // Drop old table and rename new one
  db.run(`DROP TABLE status_entries`);
  db.run(`ALTER TABLE status_entries_new RENAME TO status_entries`);

  console.log('Schema migration completed successfully');
});

db.close();