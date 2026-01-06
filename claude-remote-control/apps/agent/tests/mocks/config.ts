// Test configuration for agent
export const testConfig = {
  machine: {
    id: 'test-machine-id',
    name: 'Test Machine',
  },
  agent: {
    port: 4678,
    url: 'localhost:4678',
  },
  editor: {
    enabled: true,
    portRange: { start: 4680, end: 4699 },
    idleTimeout: 60000, // 1 minute for tests
  },
  projects: {
    basePath: '/tmp/test-projects',
    whitelist: ['project-a', 'project-b'],
  },
  tunnel: {
    enabled: false,
    domain: 'test.tunnel.local',
  },
  dashboard: {
    apiUrl: 'http://localhost:3001/api',
    apiKey: 'test-api-key',
  },
};

// Config with empty whitelist (allows any project)
export const testConfigNoWhitelist = {
  ...testConfig,
  projects: {
    ...testConfig.projects,
    whitelist: [],
  },
};

export default testConfig;
