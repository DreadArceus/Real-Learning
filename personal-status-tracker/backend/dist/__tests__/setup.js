"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = './data/test.db';
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
//# sourceMappingURL=setup.js.map