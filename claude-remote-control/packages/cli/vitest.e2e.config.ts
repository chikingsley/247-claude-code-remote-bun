import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/e2e/**/*.test.ts'],
    // E2E tests need more time
    testTimeout: 60000,
    hookTimeout: 30000,
    // Run E2E tests sequentially to avoid port conflicts
    sequence: {
      concurrent: false,
    },
    // Retry failed tests once (flaky network/process issues)
    retry: 1,
  },
});
