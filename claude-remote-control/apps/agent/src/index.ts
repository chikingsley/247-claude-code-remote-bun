import { config } from "./config.js";
import { logger } from "./logger.js";
import { createServer } from "./server.js";

const PORT = config.agent?.port || 4678;

try {
  logger.main.info({ machine: config.machine.name }, "Starting 247 Agent");

  const server = createServer(PORT);

  logger.main.info({ port: server.port }, "Agent running");
  logger.main.info(
    { url: `ws://localhost:${server.port}` },
    "Dashboard connection URL"
  );
  logger.main.info(
    { url: `http://localhost:${server.port}/pair` },
    "Pair with dashboard at"
  );
  logger.main.info(
    "For remote access, use Tailscale Funnel, Cloudflare Tunnel, or SSH tunnel"
  );
} catch (err) {
  logger.main.error(err, "Agent startup failed");
  process.exit(1);
}
