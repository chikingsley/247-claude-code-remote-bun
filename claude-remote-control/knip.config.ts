import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  workspaces: {
    'apps/agent': {
      entry: ['src/server.ts'],
      project: ['src/**/*.ts'],
      // pino-pretty: Used at runtime via dynamic require
      // http-proxy, web-push: Used in routes
      // Test deps: supertest, execa, @types/*
      ignoreDependencies: [
        'pino-pretty',
        'http-proxy',
        'web-push',
        'supertest',
        'execa',
        '@types/http-proxy',
        '@types/supertest',
        '@types/web-push',
      ],
    },
    'apps/web': {
      entry: ['src/app/**/page.tsx', 'src/app/**/layout.tsx', 'src/app/**/route.ts'],
      project: ['src/**/*.{ts,tsx}'],
      next: true,
      // Test deps
      ignoreDependencies: ['@testing-library/dom', '@testing-library/react'],
    },
    'packages/shared': {
      project: ['src/**/*.ts'],
    },
    'packages/cli': {
      project: ['src/**/*.ts'],
      // Agent dependencies bundled into CLI
      ignoreDependencies: [
        'express',
        'ws',
        'cors',
        'http-proxy',
        'pino',
        'pino-pretty',
        'web-push',
        'fs-extra',
        '@types/fs-extra',
        '@types/web-push',
      ],
    },
  },
  ignore: ['**/*.test.ts', '**/*.spec.ts', 'tests/**', 'vitest.workspace.ts'],
  ignoreExportsUsedInFile: true,
  // Root-level dev dependencies that are tooling
  ignoreDependencies: ['husky', 'lint-staged', '@vitest/coverage-v8'],
  // Disable vitest plugin at root - each workspace has its own vitest config
  vitest: false,
};

export default config;
