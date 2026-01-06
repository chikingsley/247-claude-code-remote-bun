import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'apps/agent',
  'apps/web',
  'packages/shared',
]);
