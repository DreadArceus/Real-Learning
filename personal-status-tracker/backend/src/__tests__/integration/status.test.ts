import request from 'supertest';
import app from '../../index';
import { generateToken } from '../../utils/jwt';

// Mock the database to avoid creating real DB connections in tests
jest.mock('../../models/database');

// Mock the StatusService methods to return expected responses
jest.mock('../../services/StatusService', () => {
  return {
    StatusService: jest.fn().mockImplementation(() => ({
      getLatestStatus: jest.fn().mockResolvedValue({
        id: 1,
        userId: 'admin',
        lastWaterIntake: '2024-01-15T12:00:00.000Z',
        altitude: 7,
        createdAt: '2024-01-15T12:00:00.000Z'
      }),
      createStatus: jest.fn().mockResolvedValue({
        id: 1,
        userId: 'admin',
        lastWaterIntake: '2024-01-15T12:00:00.000Z',
        altitude: 7,
        createdAt: '2024-01-15T12:00:00.000Z'
      }),
      updateStatus: jest.fn().mockResolvedValue({
        id: 1,
        userId: 'admin',
        lastWaterIntake: '2024-01-15T13:00:00.000Z',
        altitude: 8,
        createdAt: '2024-01-15T13:00:00.000Z'
      }),
      getStatusHistory: jest.fn().mockResolvedValue([
        {
          id: 1,
          userId: 'admin',
          lastWaterIntake: '2024-01-15T12:00:00.000Z',
          altitude: 7,
          createdAt: '2024-01-15T12:00:00.000Z'
        }
      ]),
      getUserStats: jest.fn().mockResolvedValue({
        totalEntries: 5,
        averageAltitude: 7.5,
        lastActivityDate: '2024-01-15T12:00:00.000Z'
      }),
      deleteAllStatus: jest.fn().mockResolvedValue(undefined)
    }))
  };
});

describe('Status API Integration Tests', () => {
  const baseUrl = '/api/status';
  
  // Generate test tokens for different user types
  const adminToken = generateToken({ userId: 1, username: 'admin', role: 'admin' });
  const viewerToken = generateToken({ userId: 2, username: 'viewer', role: 'viewer' });
  const admin2Token = generateToken({ userId: 3, username: 'admin2', role: 'admin' });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/status', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get(baseUrl)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Access token required',
        code: 'UNAUTHORIZED'
      });
    });

    it('should return admin own status data without userId', async () => {
      const response = await request(app)
        .get(baseUrl)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Object)
      });
    });

    it('should allow viewer to access any admin data with userId', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ userId: '1' })
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should allow admin to specify userId (backward compatibility)', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ userId: '3' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject invalid userId format', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ userId: 'invalid@user' })
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('alphanumeric characters'),
        code: 'VALIDATION_ERROR'
      });
    });

    it('should reject userId that is too long', async () => {
      const longUserId = 'a'.repeat(51);
      const response = await request(app)
        .get(baseUrl)
        .query({ userId: longUserId })
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/status', () => {
    const validStatusData = {
      lastWaterIntake: '2024-01-15T12:00:00.000Z',
      altitude: 7
    };

    it('should require admin authentication', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send(validStatusData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject viewer attempting to create status', async () => {
      const response = await request(app)
        .post(baseUrl)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send(validStatusData)
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Admin access required',
        code: 'FORBIDDEN'
      });
    });

    it('should allow admin to create status for themselves', async () => {
      const response = await request(app)
        .post(baseUrl)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validStatusData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          lastWaterIntake: validStatusData.lastWaterIntake,
          altitude: validStatusData.altitude
        }),
        message: 'Status created successfully'
      });
    });

    it('should create status for admin user ID automatically', async () => {
      const response = await request(app)
        .post(baseUrl)
        .set('Authorization', `Bearer ${admin2Token}`)
        .send(validStatusData)
        .expect(201);

      expect(response.body.success).toBe(true);
      // The status should be created for user ID 3 (admin2Token)
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post(baseUrl)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        code: 'VALIDATION_ERROR'
      });
    });

    it('should reject invalid datetime format', async () => {
      const response = await request(app)
        .post(baseUrl)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          lastWaterIntake: 'invalid-date',
          altitude: 7
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject altitude outside valid range', async () => {
      const response = await request(app)
        .post(baseUrl)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          lastWaterIntake: '2024-01-15T12:00:00.000Z',
          altitude: 11
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject non-integer altitude', async () => {
      const response = await request(app)
        .post(baseUrl)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          lastWaterIntake: '2024-01-15T12:00:00.000Z',
          altitude: 7.5
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/status', () => {
    it('should require admin authentication', async () => {
      const response = await request(app)
        .put(baseUrl)
        .send({ altitude: 8 })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject viewer attempting to update status', async () => {
      const response = await request(app)
        .put(baseUrl)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ altitude: 8 })
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Admin access required',
        code: 'FORBIDDEN'
      });
    });

    it('should allow admin to update their own status with partial data', async () => {
      const response = await request(app)
        .put(baseUrl)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ altitude: 8 })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Status updated successfully'
      });
    });

    it('should update both fields for admin', async () => {
      const updateData = {
        lastWaterIntake: '2024-01-15T13:00:00.000Z',
        altitude: 8
      };

      const response = await request(app)
        .put(baseUrl)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject empty update', async () => {
      const response = await request(app)
        .put(baseUrl)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        code: 'VALIDATION_ERROR'
      });
    });

    it('should reject invalid altitude in update', async () => {
      const response = await request(app)
        .put(baseUrl)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ altitude: 0 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/status/history', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get(`${baseUrl}/history`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return admin own status history with default limit', async () => {
      const response = await request(app)
        .get(`${baseUrl}/history`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array)
      });
    });

    it('should allow viewer to get admin history with userId', async () => {
      const response = await request(app)
        .get(`${baseUrl}/history`)
        .query({ userId: '1' })
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array)
      });
    });

    it('should accept custom limit parameter', async () => {
      const response = await request(app)
        .get(`${baseUrl}/history`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ limit: '5' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject limit outside valid range', async () => {
      const response = await request(app)
        .get(`${baseUrl}/history`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ limit: '101' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject non-numeric limit', async () => {
      const response = await request(app)
        .get(`${baseUrl}/history`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ limit: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/status/stats', () => {
    it('should return user statistics', async () => {
      const response = await request(app)
        .get(`${baseUrl}/stats`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          totalEntries: expect.any(Number),
          averageAltitude: expect.any(Number),
          lastActivityDate: expect.any(String) || null
        })
      });
    });

    it('should accept custom userId for stats', async () => {
      const response = await request(app)
        .get(`${baseUrl}/stats`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .query({ userId: 'test_user' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/status', () => {
    it('should delete all status entries', async () => {
      const response = await request(app)
        .delete(baseUrl)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'All status entries deleted successfully'
      });
    });

    it('should require admin role for deletion', async () => {
      const response = await request(app)
        .delete(baseUrl)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Admin access required',
        code: 'FORBIDDEN'
      });
    });
  });

  describe('Error handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('not found'),
        code: 'ENDPOINT_NOT_FOUND'
      });
    });

    it('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post(baseUrl)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should include error code in all error responses', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ invalid: 'data' })
        .expect(400);

      expect(response.body).toHaveProperty('code');
      expect(response.body.success).toBe(false);
    });
  });

  describe('CORS headers', () => {
    it('should include CORS headers in responses', async () => {
      const response = await request(app)
        .get(baseUrl)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should handle preflight OPTIONS requests', async () => {
      const response = await request(app)
        .options(baseUrl)
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-methods');
    });
  });

  describe('Content-Type validation', () => {
    it('should accept JSON content type for POST requests', async () => {
      const response = await request(app)
        .post(baseUrl)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send({
          lastWaterIntake: '2024-01-15T12:00:00.000Z',
          altitude: 7
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should reject non-JSON content for POST requests', async () => {
      const response = await request(app)
        .post(baseUrl)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'text/plain')
        .send('plain text data')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});