import { Hono } from 'hono';
import { auth } from '../auth.js';

export const authRoutes = new Hono();

// Better Auth handles these routes automatically:
// GET /signin/github - Redirect to GitHub OAuth
// GET /callback/github - Handle callback
// GET /session - Get current session
// POST /signout - Sign out

// Mount Better Auth handler
authRoutes.on(['GET', 'POST'], '/*', (c) => {
  return auth.handler(c.req.raw);
});
