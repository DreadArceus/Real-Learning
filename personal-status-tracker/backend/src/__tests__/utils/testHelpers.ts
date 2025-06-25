import { database } from '../../models/database';
import { UserModel } from '../../models/UserModel';
import { StatusModel } from '../../models/StatusModel';

export class TestHelpers {
  static db = database.getDatabase();
  static userModel = new UserModel();
  static statusModel = new StatusModel();

  /**
   * Clean up users table before tests
   */
  static async cleanupUsers(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      TestHelpers.db.run('DELETE FROM users', (err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Clean up status_entries table before tests
   */
  static async cleanupStatus(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      TestHelpers.db.run('DELETE FROM status_entries', (err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Clean up all test tables
   */
  static async cleanupDatabase(): Promise<void> {
    await TestHelpers.cleanupUsers();
    await TestHelpers.cleanupStatus();
  }

  /**
   * Close database connection
   */
  static async closeDatabase(): Promise<void> {
    return new Promise<void>((resolve) => {
      TestHelpers.db.close(() => resolve());
    });
  }

  /**
   * Create test user with default privacy policy acceptance
   */
  static async createTestUser(
    username: string = 'testuser',
    password: string = 'password123',
    role: 'admin' | 'viewer' = 'viewer',
    privacyPolicyAccepted: boolean = true
  ) {
    return TestHelpers.userModel.createUser(username, password, role, privacyPolicyAccepted);
  }

  /**
   * Create test admin user
   */
  static async createTestAdmin(
    username: string = 'admin',
    password: string = 'adminpass'
  ) {
    return TestHelpers.createTestUser(username, password, 'admin', true);
  }

  /**
   * Create test status entry
   */
  static async createTestStatus(
    userId: string,
    lastWaterIntake: string | null = new Date().toISOString(),
    altitude: number | null = 5
  ) {
    return TestHelpers.statusModel.createStatus({
      lastWaterIntake,
      altitude
    }, userId);
  }
}