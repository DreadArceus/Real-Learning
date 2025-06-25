import { AuthService } from '../../services/AuthService';
import { UserModel } from '../../models/UserModel';
import { AppError } from '../../errors/AppError';
import { TestHelpers } from '../utils/testHelpers';
import * as jwt from 'jsonwebtoken';

describe('AuthService', () => {
  let authService: AuthService;
  let userModel: UserModel;

  beforeAll(async () => {
    userModel = TestHelpers.userModel;
    authService = new AuthService();
  });

  beforeEach(async () => {
    await TestHelpers.cleanupUsers();
  });

  afterAll(async () => {
    await TestHelpers.closeDatabase();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const user = await authService.createUser('testuser', 'password123', 'viewer', true);

      expect(user.username).toBe('testuser');
      expect(user.role).toBe('viewer');
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeDefined();
      expect(user.privacyPolicyAccepted).toBe(true);
      expect('password' in user).toBe(false); // Should not return password

      // Verify user exists in database
      const dbUser = await userModel.findByUsername('testuser');
      expect(dbUser).toBeTruthy();
      expect(dbUser?.role).toBe('viewer');
      expect(dbUser?.privacyPolicyAccepted).toBeTruthy(); // SQLite returns 1 for true
    });

    it('should hash the password before saving', async () => {
      await authService.createUser('testuser', 'password123', 'viewer', true);

      const dbUser = await userModel.findByUsername('testuser');
      expect(dbUser?.password).not.toBe('password123');
      expect(dbUser?.password.length).toBeGreaterThan(20); // bcrypt hashes are longer
    });

    it('should throw error for duplicate username', async () => {
      await authService.createUser('testuser', 'password123', 'viewer', true);

      await expect(
        authService.createUser('testuser', 'different-password', 'admin', true)
      ).rejects.toThrow(AppError);
    });

    it('should create admin users', async () => {
      const user = await authService.createUser('admin', 'adminpass', 'admin', true);

      expect(user.role).toBe('admin');
    });

    it('should reject invalid roles', async () => {
      await expect(
        authService.createUser('testuser', 'password123', 'invalid' as any, true)
      ).rejects.toThrow();
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await authService.createUser('testuser', 'password123', 'viewer', true);
      await authService.createUser('admin', 'adminpass', 'admin', true);
    });

    it('should login with valid credentials', async () => {
      const result = await authService.login({
        username: 'testuser',
        password: 'password123'
      });

      expect(result.token).toBeDefined();
      expect(result.user.username).toBe('testuser');
      expect(result.user.role).toBe('viewer');
      expect('password' in result.user).toBe(false);

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
        expect((error as AppError).message).toBe('Invalid username or password');
        expect((error as AppError).statusCode).toBe(400);
      }
    });
  });

  describe('getUserById', () => {
    let userId: number;

    beforeEach(async () => {
      const user = await authService.createUser('testuser', 'password123', 'viewer', true);
      userId = user.id!;
    });

    it('should return user by id', async () => {
      const user = await authService.getUserById(userId);

      expect(user.id).toBe(userId);
      expect(user.username).toBe('testuser');
      expect(user.role).toBe('viewer');
      expect('password' in user).toBe(false);
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        authService.getUserById(99999)
      ).rejects.toThrow(AppError);
    });
  });

  describe('getAllUsers', () => {
    beforeEach(async () => {
      await authService.createUser('user1', 'pass1', 'viewer', true);
      await authService.createUser('user2', 'pass2', 'viewer', true);
      await authService.createUser('admin', 'adminpass', 'admin', true);
    });

    it('should return all users without passwords', async () => {
      const users = await authService.getAllUsers();

      expect(users).toHaveLength(3);
      expect(users.every(user => !('password' in user))).toBe(true);
      expect(users.map(user => user.username)).toEqual(
        expect.arrayContaining(['user1', 'user2', 'admin'])
      );
    });

    it('should return empty array if no users', async () => {
      // Clear all users
      await TestHelpers.cleanupUsers();

      const users = await authService.getAllUsers();
      expect(users).toHaveLength(0);
    });
  });

  describe('deleteUser', () => {
    let userId: number;

    beforeEach(async () => {
      const user = await authService.createUser('testuser', 'password123', 'viewer', true);
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

});