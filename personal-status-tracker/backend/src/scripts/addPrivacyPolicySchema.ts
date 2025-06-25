import { database } from '../models/database';

const db = database.getDatabase();

// Add privacy policy acceptance columns to users table
db.serialize(() => {
  // Add privacy policy acceptance columns
  db.run(`
    ALTER TABLE users ADD COLUMN privacy_policy_accepted BOOLEAN DEFAULT 0;
  `);
  
  db.run(`
    ALTER TABLE users ADD COLUMN privacy_policy_version TEXT DEFAULT '1.0';
  `);
  
  db.run(`
    ALTER TABLE users ADD COLUMN privacy_policy_accepted_date TEXT;
  `);

  // Update existing users to have accepted privacy policy (for backwards compatibility)
  db.run(`
    UPDATE users 
    SET privacy_policy_accepted = 1, 
        privacy_policy_version = '1.0',
        privacy_policy_accepted_date = CURRENT_TIMESTAMP
    WHERE privacy_policy_accepted IS NULL OR privacy_policy_accepted = 0;
  `);

  console.log('Privacy policy schema migration completed successfully');
});

db.close();