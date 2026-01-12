import { Hono } from 'hono';
import { logger } from '../lib/logger.js';

export const githubRoutes = new Hono();

// GET /api/github/repos - List user's GitHub repos
githubRoutes.get('/repos', async (c) => {
  // TODO: Implement in Phase 6
  return c.json({ repos: [] });
});

// POST /api/github/clone - Clone repo to agent
githubRoutes.post('/clone', async (c) => {
  // TODO: Implement in Phase 6
  logger.info('GitHub clone requested');
  return c.json({ error: 'Not implemented yet' }, 501);
});
