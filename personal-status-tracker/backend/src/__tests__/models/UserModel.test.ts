import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { UserModel } from '../../models/UserModel';
import { database } from '../../models/database';
import bcrypt from 'bcryptjs';

// Mock the database
jest.mock('../../models/database');

describe('UserModel', () => {
  let userModel: UserModel;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      get: jest.fn(),
      run: jest.fn(),
      all: jest.fn()
    };

    (database.getDatabase as jest.Mock).mockReturnValue(mockDb);
    userModel = new UserModel();
    jest.clearAllMocks();
  });

  describe('findByUsername', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashedpassword',
        role: 'admin',
        createdAt: '2023-01-01T00:00:00.000Z',
        lastLogin: '2023-01-02T00:00:00.000Z',
        privacyPolicyAccepted: true,
        privacyPolicyVersion: '1.0',
        privacyPolicyAcceptedDate: '2023-01-01T00:00:00.000Z'
      };

      mockDb.get.mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, mockUser);
      });

      const result = await userModel.findByUsername('testuser');

      expect(result).toEqual(mockUser);
      expect(mockDb.get).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, username, password, role'),
        ['testuser'],
        expect.any(Function)
      );
    });

    it('should return null when user not found', async () => {
      mockDb.get.mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, null);
      });

      const result = await userModel.findByUsername('nonexistent');

      expect(result).toBeNull();
    });

    it('should reject with error when database query fails', async () => {
      const dbError = new Error('Database error');
      mockDb.get.mockImplementation((query: string, params: any[], callback: Function) => {
        callback(dbError, null);
      });

      await expect(userModel.findByUsername('testuser')).rejects.toThrow('Database error');
    });

    it('should use correct SQL query', async () => {
      mockDb.get.mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, null);
      });

      await userModel.findByUsername('testuser');

      expect(mockDb.get).toHaveBeenCalledWith(
        expect.stringContaining('WHERE username = ?'),
        ['testuser'],
        expect.any(Function)
      );
    });
  });

  describe('findById', () => {
    it('should return user when found by ID', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashedpassword',
        role: 'viewer',
        createdAt: '2023-01-01T00:00:00.000Z',
        lastLogin: null,
        privacyPolicyAccepted: true,
        privacyPolicyVersion: '1.0',
        privacyPolicyAcceptedDate: '2023-01-01T00:00:00.000Z'
      };

      mockDb.get.mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, mockUser);
      });

      const result = await userModel.findById(1);

      expect(result).toEqual(mockUser);
      expect(mockDb.get).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = ?'),
        [1],
        expect.any(Function)
      );
    });

    it('should return null when user not found by ID', async () => {
      mockDb.get.mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, null);
      });

      const result = await userModel.findById(999);

      expect(result).toBeNull();
    });

    it('should reject with error when database query fails', async () => {
      const dbError = new Error('Database error');
      mockDb.get.mockImplementation((query: string, params: any[], callback: Function) => {
        callback(dbError, null);
      });

      await expect(userModel.findById(1)).rejects.toThrow('Database error');
    });
  });

  describe('createUser', () => {
    beforeEach(() => {
      // Mock bcrypt.hash
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedpassword123' as never);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should create user with default parameters', async () => {
      mockDb.run.mockImplementation((query: string, params: any[], callback: Function) => {
        callback.call({ lastID: 1 }, null);
      });

      const result = await userModel.createUser('newuser', 'password123');

      expect(result).toMatchObject({
        id: 1,
        username: 'newuser',
        password: '', // Password should be empty in response
        role: 'viewer', // Default role
        privacyPolicyAccepted: true, // Default value
        privacyPolicyVersion: '1.0'
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        ['newuser', 'hashedpassword123', 'viewer', true, '1.0', expect.any(String)],
        expect.any(Function)
      );
    });

    it('should create user with custom role', async () => {
      mockDb.run.mockImplementation((query: string, params: any[], callback: Function) => {
        callback.call({ lastID: 2 }, null);
      });

      const result = await userModel.createUser('adminuser', 'password123', 'admin');

      expect(result.role).toBe('admin');
      expect(result.id).toBe(2);
    });

    it('should create user with custom privacy policy acceptance', async () => {
      mockDb.run.mockImplementation((query: string, params: any[], callback: Function) => {
        callback.call({ lastID: 3 }, null);
      });

      const result = await userModel.createUser('testuser', 'password123', 'viewer', false);

      expect(result.privacyPolicyAccepted).toBe(false);
    });

    it('should set timestamps correctly', async () => {
      const beforeCreate = new Date().toISOString();
      
      mockDb.run.mockImplementation((query: string, params: any[], callback: Function) => {
        callback.call({ lastID: 1 }, null);
      });

      const result = await userModel.createUser('timeuser', 'password123');
      const afterCreate = new Date().toISOString();

      expect(result.createdAt).toBeDefined();
      expect(result.privacyPolicyAcceptedDate).toBeDefined();
      expect(new Date(result.createdAt!).getTime()).toBeGreaterThanOrEqual(new Date(beforeCreate).getTime());
      expect(new Date(result.createdAt!).getTime()).toBeLessThanOrEqual(new Date(afterCreate).getTime());
    });

    it('should reject when database insert fails', async () => {
      const dbError = new Error('Database insert error');
      mockDb.run.mockImplementation((query: string, params: any[], callback: Function) => {
        callback(dbError);
      });

      await expect(userModel.createUser('failuser', 'password123')).rejects.toThrow('Database insert error');
    });

    it('should reject when password hashing fails', async () => {
      jest.spyOn(bcrypt, 'hash').mockRejectedValue(new Error('Hashing error') as never);

      await expect(userModel.createUser('hashfailuser', 'password123')).rejects.toThrow('Hashing error');
      
      expect(mockDb.run).not.toHaveBeenCalled();
    });

    it('should use 12 salt rounds for password hashing', async () => {
      mockDb.run.mockImplementation((query: string, params: any[], callback: Function) => {
        callback.call({ lastID: 1 }, null);
      });

      await userModel.createUser('saltuser', 'password123');

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
    });
  });

  describe('validatePassword', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return true for valid password', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await userModel.validatePassword('plaintext', 'hashedpassword');

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith('plaintext', 'hashedpassword');
    });

    it('should return false for invalid password', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      const result = await userModel.validatePassword('wrongpassword', 'hashedpassword');

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedpassword');
    });

    it('should handle bcrypt comparison errors', async () => {
      jest.spyOn(bcrypt, 'compare').mockRejectedValue(new Error('Bcrypt error') as never);

      await expect(userModel.validatePassword('plaintext', 'hashedpassword')).rejects.toThrow('Bcrypt error');
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      mockDb.run.mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null);
      });

      await userModel.updateLastLogin(1);

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        [1],
        expect.any(Function)
      );
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('SET last_login = CURRENT_TIMESTAMP'),
        [1],
        expect.any(Function)
      );
    });

    it('should reject when update fails', async () => {
      const dbError = new Error('Update error');
      mockDb.run.mockImplementation((query: string, params: any[], callback: Function) => {
        callback(dbError);
      });

      await expect(userModel.updateLastLogin(1)).rejects.toThrow('Update error');
    });
  });

  describe('getAllUsers', () => {
    it('should return all users without passwords', async () => {
      const mockUsers = [
        { id: 1, username: 'user1', role: 'admin', createdAt: '2023-01-01', lastLogin: '2023-01-02' },
        { id: 2, username: 'user2', role: 'viewer', createdAt: '2023-01-03', lastLogin: null }
      ];

      mockDb.all.mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, mockUsers);
      });

      const result = await userModel.getAllUsers();

      expect(result).toEqual(mockUsers);
      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, username, role, created_at'),
        [],
        expect.any(Function)
      );
      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY created_at DESC'),
        [],
        expect.any(Function)
      );
    });

    it('should return empty array when no users found', async () => {
      mockDb.all.mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, []);
      });

      const result = await userModel.getAllUsers();

      expect(result).toEqual([]);
    });

    it('should handle null result from database', async () => {
      mockDb.all.mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, null);
      });

      const result = await userModel.getAllUsers();

      expect(result).toEqual([]);
    });

    it('should reject when query fails', async () => {
      const dbError = new Error('Query error');
      mockDb.all.mockImplementation((query: string, params: any[], callback: Function) => {
        callback(dbError, null);
      });

      await expect(userModel.getAllUsers()).rejects.toThrow('Query error');
    });
  });

  describe('getAdminUsers', () => {
    it('should return only admin users', async () => {
      const mockAdmins = [
        { id: 1, username: 'admin1', role: 'admin', createdAt: '2023-01-01', lastLogin: '2023-01-02' },
        { id: 3, username: 'admin2', role: 'admin', createdAt: '2023-01-03', lastLogin: null }
      ];

      mockDb.all.mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, mockAdmins);
      });

      const result = await userModel.getAdminUsers();

      expect(result).toEqual(mockAdmins);
      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining("WHERE role = 'admin'"),
        [],
        expect.any(Function)
      );
      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY username ASC'),
        [],
        expect.any(Function)
      );
    });

    it('should return empty array when no admin users found', async () => {
      mockDb.all.mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, []);
      });

      const result = await userModel.getAdminUsers();

      expect(result).toEqual([]);
    });

    it('should reject when query fails', async () => {
      const dbError = new Error('Admin query error');
      mockDb.all.mockImplementation((query: string, params: any[], callback: Function) => {
        callback(dbError, null);
      });

      await expect(userModel.getAdminUsers()).rejects.toThrow('Admin query error');
    });
  });

  describe('deleteUser', () => {
    it('should delete user and return true when successful', async () => {
      mockDb.run.mockImplementation((query: string, params: any[], callback: Function) => {
        callback.call({ changes: 1 }, null);
      });

      const result = await userModel.deleteUser(1);

      expect(result).toBe(true);
      expect(mockDb.run).toHaveBeenCalledWith(
        'DELETE FROM users WHERE id = ?',
        [1],
        expect.any(Function)
      );
    });

    it('should return false when no user was deleted', async () => {
      mockDb.run.mockImplementation((query: string, params: any[], callback: Function) => {
        callback.call({ changes: 0 }, null);
      });

      const result = await userModel.deleteUser(999);

      expect(result).toBe(false);
    });

    it('should reject when delete fails', async () => {
      const dbError = new Error('Delete error');
      mockDb.run.mockImplementation((query: string, params: any[], callback: Function) => {
        callback(dbError);
      });

      await expect(userModel.deleteUser(1)).rejects.toThrow('Delete error');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle typical user lifecycle', async () => {
      // Create user
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedpassword' as never);
      mockDb.run.mockImplementation((query: string, params: any[], callback: Function) => {
        if (query.includes('INSERT')) {
          callback.call({ lastID: 1 }, null);
        } else if (query.includes('UPDATE')) {
          callback(null);
        }
      });

      const newUser = await userModel.createUser('lifecycle', 'password123', 'admin');
      expect(newUser.username).toBe('lifecycle');

      // Update last login
      await userModel.updateLastLogin(newUser.id!);

      // Find by username
      mockDb.get.mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, { ...newUser, password: 'hashedpassword' });
      });

      const foundUser = await userModel.findByUsername('lifecycle');
      expect(foundUser?.username).toBe('lifecycle');

      jest.restoreAllMocks();
    });
  });
});