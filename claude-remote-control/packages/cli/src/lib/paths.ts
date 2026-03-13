import { existsSync, mkdirSync } from "fs";
import { homedir, platform } from "os";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Get the home directory, allowing override via AGENT_247_HOME for E2E testing.
 * This enables running tests in isolated temporary directories without affecting
 * the real user's configuration or system services.
 */
export function getTestableHomedir(): string {
  return process.env.AGENT_247_HOME || homedir();
}

export interface AgentPaths {
  /** Where the agent server code is located */
  agentRoot: string;
  /** Where the CLI package is installed */
  cliRoot: string;

  /** Configuration directory (~/.247/) */
  configDir: string;

  /** Configuration file path */
  configPath: string;

  /** Data directory for SQLite */
  dataDir: string;

  /** Is this a development install? */
  isDev: boolean;

  /** Log directory */
  logDir: string;

  /** Node binary path */
  nodePath: string;

  /** PID file path */
  pidFile: string;
}

let cachedPaths: AgentPaths | null = null;

export function getAgentPaths(): AgentPaths {
  if (cachedPaths) {
    return cachedPaths;
  }

  // CLI root is 2 levels up from lib/ (dist/lib -> dist -> cli root)
  const cliRoot = resolve(__dirname, "..", "..");

  // Check if running from source (monorepo) or installed (bun global)
  // In monorepo: cliRoot is packages/cli, parent has bun.lock (bun workspace root)
  const monorepoRoot = resolve(cliRoot, "..", "..");
  const isDev = existsSync(join(monorepoRoot, "bun.lock"));

  let agentRoot: string;

  if (isDev) {
    // Development: agent is in the monorepo
    agentRoot = resolve(monorepoRoot, "apps", "agent");
  } else {
    // Production: agent code is bundled with CLI
    agentRoot = join(cliRoot, "agent");
  }

  // Use testable home directory (allows override via AGENT_247_HOME)
  const home = getTestableHomedir();

  // Configuration directory
  const configDir = join(home, ".247");

  // Log directory varies by platform
  const os = platform();
  let logDir: string;
  if (os === "darwin") {
    logDir = join(home, "Library", "Logs", "247-agent");
  } else {
    logDir = join(home, ".local", "log", "247-agent");
  }

  cachedPaths = {
    cliRoot,
    agentRoot,
    configDir,
    configPath: join(configDir, "config.json"),
    dataDir: join(configDir, "data"),
    logDir,
    pidFile: join(configDir, "agent.pid"),
    nodePath: process.execPath,
    isDev,
  };

  return cachedPaths;
}

/**
 * Ensure all required directories exist
 */
export function ensureDirectories(): void {
  const paths = getAgentPaths();

  const dirs = [paths.configDir, paths.dataDir, paths.logDir];

  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * Clear cached paths (useful for testing)
 */
export function clearPathsCache(): void {
  cachedPaths = null;
}
