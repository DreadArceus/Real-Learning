import request from 'supertest';
import app from '../../index';
import { UserModel } from '../../models/UserModel';
import { database } from '../../models/database';

describe('Authentication Integration Tests', () => {
  let db: any;
  let userModel: UserModel;

  beforeAll(async () => {
    // Use test database
    process.env.NODE_ENV = 'test';
    db = database.getDatabase();
    userModel = new UserModel();
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

  describe('POST /api/auth/register', () => {
    it('should register a new viewer user successfully', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123'
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
      expect(response.body.data.password).toBeUndefined(); // Should not return password
      expect(response.body.message).toBe('Account created successfully');
    });

    it('should not allow duplicate usernames', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123'
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
        .send({ password: 'password123' })
        .expect(400);

      // Missing password
      await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser' })
        .expect(400);

      // Empty username
      await request(app)
        .post('/api/auth/register')
        .send({ username: '', password: 'password123' })
        .expect(400);

      // Empty password
      await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', password: '' })
        .expect(400);
    });

    it('should validate username length', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'ab', password: 'password123' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate password length', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', password: '123' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await userModel.createUser('testuser', 'password123', 'viewer');
      await userModel.createUser('admin', 'adminpass', 'admin');
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
      await userModel.createUser('testuser', 'password123', 'viewer');
      
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
      await userModel.createUser('admin', 'adminpass', 'admin');
      
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
      await userModel.createUser('viewer', 'viewerpass', 'viewer');
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
      await userModel.createUser('admin', 'adminpass', 'admin');
      await userModel.createUser('viewer1', 'pass1', 'viewer');
      await userModel.createUser('viewer2', 'pass2', 'viewer');
      
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
      const admin = await userModel.createUser('admin', 'adminpass', 'admin');
      const viewer = await userModel.createUser('viewer', 'viewerpass', 'viewer');
      
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