/**
 * Setup file for E2E tests
 * Configures test environment before running tests
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Increase timeout for async operations
jest.setTimeout(30000);

// Global beforeAll hook
beforeAll(async () => {
  // Wait for database connection if needed
  console.log('🧪 E2E Test Suite Starting...');
});

// Global afterAll hook
afterAll(async () => {
  console.log('🧪 E2E Test Suite Complete');
});

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection in tests:', error);
});
