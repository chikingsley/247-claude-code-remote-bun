import { Hono } from 'hono';
import { logger } from '../lib/logger.js';

export const flyioRoutes = new Hono();

// POST /api/flyio/token - Save Fly.io API token
flyioRoutes.post('/token', async (c) => {
  // TODO: Implement in Phase 3
  logger.info('Fly.io token save requested');
  return c.json({ error: 'Not implemented yet' }, 501);
});

// GET /api/flyio/status - Check if Fly.io is connected
flyioRoutes.get('/status', async (c) => {
  // TODO: Implement in Phase 3
  return c.json({ connected: false });
});

// DELETE /api/flyio/token - Disconnect Fly.io
flyioRoutes.delete('/token', async (c) => {
  // TODO: Implement in Phase 3
  return c.json({ error: 'Not implemented yet' }, 501);
});

// GET /api/flyio/orgs - List available orgs
flyioRoutes.get('/orgs', async (c) => {
  // TODO: Implement in Phase 3
  return c.json({ orgs: [] });
});
