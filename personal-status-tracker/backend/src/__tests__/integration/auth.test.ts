import request from 'supertest';
import app from '../../index';
import { UserModel } from '../../models/UserModel';
import { TestHelpers } from '../utils/testHelpers';

describe('Authentication Integration Tests', () => {
  let userModel: UserModel;

  beforeAll(async () => {
    userModel = TestHelpers.userModel;
  });

  beforeEach(async () => {
    await TestHelpers.cleanupUsers();
  });

  afterAll(async () => {
    await TestHelpers.closeDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new viewer user successfully', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123',
        privacyPolicyAccepted: true
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe(userData.username);
      expect(response.body.data.role).toBe('viewer');
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.createdAt).toBeDefined();
      expect(response.body.data.privacyPolicyAccepted).toBe(true);
      expect(response.body.data.password).toBeUndefined(); // Should not return password
      expect(response.body.message).toBe('Account created successfully');
    });

    it('should not allow duplicate usernames', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123',
        privacyPolicyAccepted: true
      };

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Second registration with same username
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });

    it('should validate required fields', async () => {
      // Missing username
      await request(app)
        .post('/api/auth/register')
        .send({ password: 'password123', privacyPolicyAccepted: true })
        .expect(400);

      // Missing password
      await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', privacyPolicyAccepted: true })
        .expect(400);

      // Missing privacy policy acceptance
      await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', password: 'password123' })
        .expect(400);

      // Privacy policy not accepted
      await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', password: 'password123', privacyPolicyAccepted: false })
        .expect(400);

      // Empty username
      await request(app)
        .post('/api/auth/register')
        .send({ username: '', password: 'password123', privacyPolicyAccepted: true })
        .expect(400);

      // Empty password
      await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', password: '', privacyPolicyAccepted: true })
        .expect(400);
    });

    it('should validate username length', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'ab', password: 'password123', privacyPolicyAccepted: true })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate password length', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', password: '123', privacyPolicyAccepted: true })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await userModel.createUser('testuser', 'password123', 'viewer', true);
      await userModel.createUser('admin', 'adminpass', 'admin', true);
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'password123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.username).toBe('testuser');
      expect(response.body.data.user.role).toBe('viewer');
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.message).toBe('Login successful');
    });

    it('should login admin user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'adminpass' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('admin');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'wrongpassword' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nonexistent', password: 'password123' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should validate required fields', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' })
        .expect(400);

      await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser' })
        .expect(400);
    });

    it('should update last login timestamp', async () => {
      const userBefore = await userModel.findByUsername('testuser');
      expect(userBefore?.lastLogin).toBeNull();

      await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'password123' })
        .expect(200);

      const userAfter = await userModel.findByUsername('testuser');
      expect(userAfter?.lastLogin).toBeDefined();
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken: string;

    beforeEach(async () => {
      await userModel.createUser('testuser', 'password123', 'viewer', true);
      
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'password123' });
      
      authToken = loginResponse.body.data.token;
    });

    it('should return current user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('testuser');
      expect(response.body.data.role).toBe('viewer');
      expect(response.body.data.password).toBeUndefined();
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid token');
    });
  });

  describe('POST /api/auth/admin/register', () => {
    let adminToken: string;

    beforeEach(async () => {
      await userModel.createUser('admin', 'adminpass', 'admin', true);
      
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'adminpass' });
      
      adminToken = loginResponse.body.data.token;
    });

    it('should allow admin to create users with any role', async () => {
      const userData = {
        username: 'newadmin',
        password: 'password123',
        role: 'admin'
      };

      const response = await request(app)
        .post('/api/auth/admin/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe(userData.username);
      expect(response.body.data.role).toBe('admin');
    });

    it('should reject non-admin users', async () => {
      // Create a viewer user and get their token
      await userModel.createUser('viewer', 'viewerpass', 'viewer', true);
      const viewerLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: 'viewer', password: 'viewerpass' });
      
      const viewerToken = viewerLogin.body.data.token;

      const response = await request(app)
        .post('/api/auth/admin/register')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          username: 'newuser',
          password: 'password123',
          role: 'viewer'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Admin access required');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/auth/admin/register')
        .send({
          username: 'newuser',
          password: 'password123',
          role: 'viewer'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/users', () => {
    let adminToken: string;

    beforeEach(async () => {
      await userModel.createUser('admin', 'adminpass', 'admin', true);
      await userModel.createUser('viewer1', 'pass1', 'viewer', true);
      await userModel.createUser('viewer2', 'pass2', 'viewer', true);
      
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'adminpass' });
      
      adminToken = loginResponse.body.data.token;
    });

    it('should return all users for admin', async () => {
      const response = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data.every((user: any) => !user.password)).toBe(true);
    });

    it('should reject non-admin users', async () => {
      const viewerLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: 'viewer1', password: 'pass1' });
      
      const viewerToken = viewerLogin.body.data.token;

      const response = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/auth/users/:id', () => {
    let adminToken: string;
    let adminId: number;
    let viewerId: number;

    beforeEach(async () => {
      const admin = await userModel.createUser('admin', 'adminpass', 'admin', true);
      const viewer = await userModel.createUser('viewer', 'viewerpass', 'viewer', true);
      
      adminId = admin.id!;
      viewerId = viewer.id!;
      
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'adminpass' });
      
      adminToken = loginResponse.body.data.token;
    });

    it('should allow admin to delete other users', async () => {
      const response = await request(app)
        .delete(`/api/auth/users/${viewerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User deleted successfully');
    });

    it('should not allow admin to delete themselves', async () => {
      const response = await request(app)
        .delete(`/api/auth/users/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Cannot delete your own account');
    });

    it('should reject non-admin users', async () => {
      const viewerLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: 'viewer', password: 'viewerpass' });
      
      const viewerToken = viewerLogin.body.data.token;

      const response = await request(app)
        .delete(`/api/auth/users/${adminId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/admins', () => {
    let authToken: string;

    beforeEach(async () => {
      // Create some admin and viewer users
      await userModel.createUser('admin1', 'password123', 'admin', true);
      await userModel.createUser('admin2', 'password123', 'admin', true);
      await userModel.createUser('viewer1', 'password123', 'viewer', true);
      
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ username: 'viewer1', password: 'password123' });
      
      authToken = loginResponse.body.data.token;
    });

    it('should return list of admin users for authenticated users', async () => {
      const response = await request(app)
        .get('/api/auth/admins')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data).toHaveLength(2);
      
      // Check that only admin users are returned
      response.body.data.forEach((user: any) => {
        expect(user.role).toBe('admin');
        expect(user.password).toBeUndefined();
      });
      
      // Check specific admin usernames
      const usernames = response.body.data.map((user: any) => user.username);
      expect(usernames).toContain('admin1');
      expect(usernames).toContain('admin2');
      expect(usernames).not.toContain('viewer1');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/auth/admins')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });

    it('should work for both admin and viewer users', async () => {
      // Create an admin user and get their token
      const adminLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin1', password: 'password123' });
      
      const adminToken = adminLoginResponse.body.data.token;

      const response = await request(app)
        .get('/api/auth/admins')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should return empty array when no admin users exist', async () => {
      // Delete all admin users
      await new Promise<void>((resolve, reject) => {
        TestHelpers.db.run("DELETE FROM users WHERE role = 'admin'", (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const response = await request(app)
        .get('/api/auth/admins')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should return success message', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logout successful');
    });
  });
});