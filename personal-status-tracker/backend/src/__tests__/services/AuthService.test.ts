import { AuthService } from '../../services/AuthService';
import { UserModel } from '../../models/UserModel';
import { database } from '../../models/database';
import { AppError } from '../../utils/errors';
import * as jwt from 'jsonwebtoken';

// Mock the config
jest.mock('../../config', () => ({
  config: {
    JWT_SECRET: 'test-jwt-secret',
    JWT_EXPIRES_IN: '24h',
    BCRYPT_ROUNDS: 10
  }
}));

describe('AuthService', () => {
  let authService: AuthService;
  let userModel: UserModel;
  let db: any;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    db = database.getDatabase();
    userModel = new UserModel();
    authService = new AuthService();
  });

  beforeEach(async () => {
    // Clean up users table before each test
    await new Promise<void>((resolve, reject) => {
      db.run('DELETE FROM users', (err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      db.close(() => resolve());
    });
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const user = await authService.createUser('testuser', 'password123', 'viewer');

      expect(user.username).toBe('testuser');
      expect(user.role).toBe('viewer');
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeDefined();
      expect(user.password).toBeUndefined(); // Should not return password

      // Verify user exists in database
      const dbUser = await userModel.findByUsername('testuser');
      expect(dbUser).toBeTruthy();
      expect(dbUser?.role).toBe('viewer');
    });

    it('should hash the password before saving', async () => {
      await authService.createUser('testuser', 'password123', 'viewer');

      const dbUser = await userModel.findByUsername('testuser');
      expect(dbUser?.password).not.toBe('password123');
      expect(dbUser?.password.length).toBeGreaterThan(20); // bcrypt hashes are longer
    });

    it('should throw error for duplicate username', async () => {
      await authService.createUser('testuser', 'password123', 'viewer');

      await expect(
        authService.createUser('testuser', 'different-password', 'admin')
      ).rejects.toThrow(AppError);
    });

    it('should create admin users', async () => {
      const user = await authService.createUser('admin', 'adminpass', 'admin');

      expect(user.role).toBe('admin');
    });

    it('should reject invalid roles', async () => {
      await expect(
        authService.createUser('testuser', 'password123', 'invalid' as any)
      ).rejects.toThrow();
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await authService.createUser('testuser', 'password123', 'viewer');
      await authService.createUser('admin', 'adminpass', 'admin');
    });

    it('should login with valid credentials', async () => {
      const result = await authService.login({
        username: 'testuser',
        password: 'password123'
      });

      expect(result.token).toBeDefined();
      expect(result.user.username).toBe('testuser');
      expect(result.user.role).toBe('viewer');
      expect(result.user.password).toBeUndefined();

      // Verify token is valid JWT
      const decoded = jwt.verify(result.token, 'test-jwt-secret') as any;
      expect(decoded.username).toBe('testuser');
      expect(decoded.role).toBe('viewer');
      expect(decoded.userId).toBe(result.user.id);
    });

    it('should login admin user', async () => {
      const result = await authService.login({
        username: 'admin',
        password: 'adminpass'
      });

      expect(result.user.role).toBe('admin');
    });

    it('should throw error for invalid username', async () => {
      await expect(
        authService.login({
          username: 'nonexistent',
          password: 'password123'
        })
      ).rejects.toThrow(AppError);
    });

    it('should throw error for invalid password', async () => {
      await expect(
        authService.login({
          username: 'testuser',
          password: 'wrongpassword'
        })
      ).rejects.toThrow(AppError);
    });

    it('should update lastLogin timestamp', async () => {
      const userBefore = await userModel.findByUsername('testuser');
      expect(userBefore?.lastLogin).toBeNull();

      await authService.login({
        username: 'testuser',
        password: 'password123'
      });

      const userAfter = await userModel.findByUsername('testuser');
      expect(userAfter?.lastLogin).toBeTruthy();
    });

    it('should throw AppError with specific code for invalid credentials', async () => {
      try {
        await authService.login({
          username: 'testuser',
          password: 'wrongpassword'
        });
        fail('Expected AppError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).message).toBe('Invalid credentials');
        expect((error as AppError).statusCode).toBe(401);
      }
    });
  });

  describe('getUserById', () => {
    let userId: number;

    beforeEach(async () => {
      const user = await authService.createUser('testuser', 'password123', 'viewer');
      userId = user.id!;
    });

    it('should return user by id', async () => {
      const user = await authService.getUserById(userId);

      expect(user.id).toBe(userId);
      expect(user.username).toBe('testuser');
      expect(user.role).toBe('viewer');
      expect(user.password).toBeUndefined();
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        authService.getUserById(99999)
      ).rejects.toThrow(AppError);
    });
  });

  describe('getAllUsers', () => {
    beforeEach(async () => {
      await authService.createUser('user1', 'pass1', 'viewer');
      await authService.createUser('user2', 'pass2', 'viewer');
      await authService.createUser('admin', 'adminpass', 'admin');
    });

    it('should return all users without passwords', async () => {
      const users = await authService.getAllUsers();

      expect(users).toHaveLength(3);
      expect(users.every(user => !user.password)).toBe(true);
      expect(users.map(user => user.username)).toEqual(
        expect.arrayContaining(['user1', 'user2', 'admin'])
      );
    });

    it('should return empty array if no users', async () => {
      // Clear all users
      await new Promise<void>((resolve, reject) => {
        db.run('DELETE FROM users', (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const users = await authService.getAllUsers();
      expect(users).toHaveLength(0);
    });
  });

  describe('deleteUser', () => {
    let userId: number;

    beforeEach(async () => {
      const user = await authService.createUser('testuser', 'password123', 'viewer');
      userId = user.id!;
    });

    it('should delete user successfully', async () => {
      await authService.deleteUser(userId);

      const user = await userModel.findById(userId);
      expect(user).toBeNull();
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        authService.deleteUser(99999)
      ).rejects.toThrow(AppError);
    });
  });

  describe('validatePassword', () => {
    let hashedPassword: string;

    beforeEach(async () => {
      const user = await authService.createUser('testuser', 'password123', 'viewer');
      const dbUser = await userModel.findByUsername('testuser');
      hashedPassword = dbUser!.password;
    });

    it('should return true for correct password', async () => {
      const isValid = await (authService as any).validatePassword('password123', hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const isValid = await (authService as any).validatePassword('wrongpassword', hashedPassword);
      expect(isValid).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate valid JWT token', () => {
      const payload = {
        userId: 1,
        username: 'testuser',
        role: 'viewer'
      };

      const token = (authService as any).generateToken(payload);
      expect(token).toBeDefined();

      const decoded = jwt.verify(token, 'test-jwt-secret') as any;
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.username).toBe(payload.username);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });
  });
});