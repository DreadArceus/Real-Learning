// Set test environment variables BEFORE importing config
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = './data/test.db';
process.env.PORT = '3001';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.API_RATE_LIMIT_WINDOW_MS = '900000';
process.env.API_RATE_LIMIT_MAX_REQUESTS = '100';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '24h';
process.env.LOG_LEVEL = 'error';

import { config } from '../config';

// Global test setup
beforeAll(() => {
  // Any global setup needed before all tests
});

afterAll(() => {
  // Any global cleanup needed after all tests
});

// Increase timeout for database operations
jest.setTimeout(10000);

// Dummy test to satisfy Jest requirement
describe('Test Setup', () => {
  it('should configure test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});