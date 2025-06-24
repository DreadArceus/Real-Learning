import { database } from './database';
import { User } from '../types';
import bcrypt from 'bcryptjs';

export class UserModel {
  private db = database.getDatabase();

  public async findByUsername(username: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT id, username, password, role, created_at as createdAt, last_login as lastLogin
        FROM users 
        WHERE username = ?
      `;

      this.db.get(query, [username], (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  public async findById(id: number): Promise<User | null> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT id, username, password, role, created_at as createdAt, last_login as lastLogin
        FROM users 
        WHERE id = ?
      `;

      this.db.get(query, [id], (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  public async createUser(username: string, password: string, role: 'admin' | 'viewer' = 'viewer'): Promise<User> {
    return new Promise(async (resolve, reject) => {
      try {
        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const query = `
          INSERT INTO users (username, password, role)
          VALUES (?, ?, ?)
        `;

        this.db.run(query, [username, hashedPassword, role], function(err) {
          if (err) {
            reject(err);
          } else {
            // Return the created user without password
            const newUser: User = {
              id: this.lastID,
              username,
              password: '', // Don't return the password
              role,
              createdAt: new Date().toISOString()
            };
            resolve(newUser);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  public async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  public async updateLastLogin(userId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE users 
        SET last_login = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;

      this.db.run(query, [userId], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  public async getAllUsers(): Promise<Omit<User, 'password'>[]> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT id, username, role, created_at as createdAt, last_login as lastLogin
        FROM users 
        ORDER BY created_at DESC
      `;

      this.db.all(query, [], (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  public async deleteUser(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM users WHERE id = ?`;

      this.db.run(query, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }
}