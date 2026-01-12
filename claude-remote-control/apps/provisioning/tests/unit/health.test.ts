import { describe, it, expect } from 'vitest';

describe('Provisioning Service', () => {
  describe('Health Check', () => {
    it('should have a valid version', () => {
      // Basic test to ensure the test setup works
      expect('2.3.0').toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should have proper config structure', async () => {
      // Import config and verify structure
      // Note: This will use default values since env vars aren't set in test
      const { config } = await import('../../src/lib/config.js');

      expect(config).toHaveProperty('port');
      expect(config).toHaveProperty('dashboardUrl');
      expect(config).toHaveProperty('databaseUrl');
      expect(config).toHaveProperty('github');
      expect(config.github).toHaveProperty('clientId');
      expect(config.github).toHaveProperty('clientSecret');
    });
  });
});
