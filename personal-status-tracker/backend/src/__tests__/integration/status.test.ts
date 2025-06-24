import request from 'supertest';
import app from '../../index';

// Mock the database to avoid creating real DB connections in tests
jest.mock('../../models/database');

describe('Status API Integration Tests', () => {
  const baseUrl = '/api/status';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/status', () => {
    it('should return 200 with default user status', async () => {
      const response = await request(app)
        .get(baseUrl)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Object)
      });
    });

    it('should accept custom userId parameter', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ userId: 'custom_user' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject invalid userId format', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ userId: 'invalid@user' })
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
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/status', () => {
    const validStatusData = {
      lastWaterIntake: '2024-01-15T12:00:00.000Z',
      altitude: 7
    };

    it('should create status with valid data', async () => {
      const response = await request(app)
        .post(baseUrl)
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

    it('should create status with custom userId', async () => {
      const response = await request(app)
        .post(baseUrl)
        .query({ userId: 'test_user' })
        .send(validStatusData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post(baseUrl)
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
        .send({
          lastWaterIntake: '2024-01-15T12:00:00.000Z',
          altitude: 7.5
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/status', () => {
    it('should update status with partial data', async () => {
      const response = await request(app)
        .put(baseUrl)
        .send({ altitude: 8 })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Status updated successfully'
      });
    });

    it('should update both fields', async () => {
      const updateData = {
        lastWaterIntake: '2024-01-15T13:00:00.000Z',
        altitude: 8
      };

      const response = await request(app)
        .put(baseUrl)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject empty update', async () => {
      const response = await request(app)
        .put(baseUrl)
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
        .send({ altitude: 0 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/status/history', () => {
    it('should return status history with default limit', async () => {
      const response = await request(app)
        .get(`${baseUrl}/history`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array)
      });
    });

    it('should accept custom limit parameter', async () => {
      const response = await request(app)
        .get(`${baseUrl}/history`)
        .query({ limit: '5' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject limit outside valid range', async () => {
      const response = await request(app)
        .get(`${baseUrl}/history`)
        .query({ limit: '101' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject non-numeric limit', async () => {
      const response = await request(app)
        .get(`${baseUrl}/history`)
        .query({ limit: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/status/stats', () => {
    it('should return user statistics', async () => {
      const response = await request(app)
        .get(`${baseUrl}/stats`)
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
        .query({ userId: 'test_user' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/status', () => {
    it('should delete all status entries', async () => {
      const response = await request(app)
        .delete(baseUrl)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'All status entries deleted successfully'
      });
    });

    it('should accept custom userId for deletion', async () => {
      const response = await request(app)
        .delete(baseUrl)
        .query({ userId: 'test_user' })
        .expect(200);

      expect(response.body.success).toBe(true);
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
        .set('Content-Type', 'text/plain')
        .send('plain text data')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});