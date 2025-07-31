// tests/setup.js - Global test setup and utilities

// Suppress console.log during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   error: jest.fn(),
//   warn: jest.fn(),
// };

// Global test utilities
global.testUtils = {
  /**
   * Create a mock keyword object
   */
  createMockKeyword: (overrides = {}) => ({
    id: 1,
    keyword: 'test keyword',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
    ...overrides
  }),

  /**
   * Create a mock paginated result
   */
  createMockPaginatedResult: (items = [], overrides = {}) => ({
    keywords: items,
    total: items.length,
    page: 1,
    limit: 20,
    pages: Math.ceil(items.length / 20),
    ...overrides
  }),

  /**
   * Create a mock database error
   */
  createMockDbError: (message = 'Database error') => {
    const error = new Error(message);
    error.code = 'SQLITE_CONSTRAINT_UNIQUE';
    return error;
  }
};

// Set timezone for consistent date testing
process.env.TZ = 'UTC';

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});