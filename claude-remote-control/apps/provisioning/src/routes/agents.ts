import { Hono } from 'hono';
import { logger } from '../lib/logger.js';

export const agentsRoutes = new Hono();

// GET /api/agents - List user's agents
agentsRoutes.get('/', async (c) => {
  // TODO: Implement in Phase 4
  return c.json({ agents: [] });
});

// POST /api/agents - Deploy new agent
agentsRoutes.post('/', async (c) => {
  // TODO: Implement in Phase 4
  logger.info('Agent deployment requested');
  return c.json({ error: 'Not implemented yet' }, 501);
});

// GET /api/agents/:id - Get agent status
agentsRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  // TODO: Implement in Phase 4
  return c.json({ error: `Agent ${id} not found` }, 404);
});

// DELETE /api/agents/:id - Destroy agent
agentsRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  logger.info({ agentId: id }, 'Agent deletion requested');
  // TODO: Implement in Phase 4
  return c.json({ error: 'Not implemented yet' }, 501);
});

// POST /api/agents/:id/start - Start stopped agent
agentsRoutes.post('/:id/start', async (c) => {
  const id = c.req.param('id');
  logger.info({ agentId: id }, 'Agent start requested');
  // TODO: Implement in Phase 4
  return c.json({ error: 'Not implemented yet' }, 501);
});

// POST /api/agents/:id/stop - Stop running agent
agentsRoutes.post('/:id/stop', async (c) => {
  const id = c.req.param('id');
  logger.info({ agentId: id }, 'Agent stop requested');
  // TODO: Implement in Phase 4
  return c.json({ error: 'Not implemented yet' }, 501);
});
