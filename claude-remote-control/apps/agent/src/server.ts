/**
 * Main server entry point — Bun.serve() with native WebSocket support.
 * Routes and handlers are split into separate modules for maintainability.
 */

import { execSync } from "child_process";
import { closeDatabase, initDatabase } from "./db/index.js";
import * as sessionsDb from "./db/sessions.js";
import { handleCORS, json, matchRoute, type Route, route } from "./router.js";

// Routes
import {
  hooksRoutes,
  pairRoutes,
  projectRoutes,
  sessionRoutes,
} from "./routes/index.js";

// WebSocket
import {
  prepareTerminalUpgrade,
  type WSData,
  websocketHandlers,
} from "./websocket-handlers.js";

// Utility to get active tmux sessions
function getActiveTmuxSessions(): Set<string> {
  try {
    const output = execSync(
      'tmux list-sessions -F "#{session_name}" 2>/dev/null',
      { encoding: "utf-8" }
    );
    return new Set(
      output
        .trim()
        .split("\n")
        .filter((s: string) => s)
    );
  } catch {
    return new Set();
  }
}

// Build route table once
const routes: Route[] = [
  route("GET", "/health", () => json({ status: "ok", timestamp: Date.now() })),
  ...projectRoutes(),
  ...sessionRoutes(),
  ...pairRoutes(),
  ...hooksRoutes(),
];

export function createServer(port = 0) {
  // Initialize SQLite database
  initDatabase();

  // Reconcile sessions with active tmux sessions
  const activeTmuxSessions = getActiveTmuxSessions();
  sessionsDb.reconcileWithTmux(activeTmuxSessions);

  // Load existing sessions
  const dbSessions = sessionsDb.getAllSessions();
  console.log(`[DB] Loaded ${dbSessions.length} sessions from database`);

  const server = Bun.serve<WSData>({
    port,

    fetch(req, server) {
      const url = new URL(req.url);

      // CORS preflight
      if (req.method === "OPTIONS") {
        return handleCORS();
      }

      // WebSocket upgrade: /terminal
      if (url.pathname === "/terminal") {
        const data = prepareTerminalUpgrade(url);
        if (!data) {
          return new Response("Forbidden", { status: 403 });
        }
        const ok = server.upgrade(req, { data });
        if (ok) {
          return undefined;
        }
        return new Response("WebSocket upgrade failed", { status: 400 });
      }

      // WebSocket upgrade: /sessions
      if (url.pathname === "/sessions") {
        const data: WSData = { type: "sessions", url };
        const ok = server.upgrade(req, { data });
        if (ok) {
          return undefined;
        }
        return new Response("WebSocket upgrade failed", { status: 400 });
      }

      // HTTP route matching
      const match = matchRoute(routes, req, url);
      if (match) {
        return match.handler(req, url, match.params);
      }

      return json({ error: "Not found" }, 404);
    },

    websocket: websocketHandlers,
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log("[Server] Shutting down...");
    closeDatabase();
    server.stop();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  return server;
}
