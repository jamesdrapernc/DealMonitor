// jest.config.js - Jest testing configuration

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // ✅ Updated: Custom test file patterns to match your naming convention
  testMatch: [
    '**/tests/**/*Test.js',           // Your preferred pattern: keywordServiceTest.js
    '**/tests/**/*.test.js',          // Standard pattern: KeywordService.test.js
    '**/__tests__/**/*.js',           // Files in __tests__ folders
    '**/?(*.)+(spec|test).js'         // Standard spec/test patterns
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/database/migrations/**',
    '!src/app.js',
    '!src/config/**'
  ],

  // Coverage directory
  coverageDirectory: 'coverage',

  // Coverage reporters
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,

  // Test timeout (30 seconds)
  testTimeout: 30000
};