import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';
import { homedir, platform } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface AgentPaths {
  /** Where the CLI package is installed */
  cliRoot: string;

  /** Where the agent server code is located */
  agentRoot: string;

  /** Where the hooks package source is located */
  hooksSource: string;

  /** Where hooks should be installed for Claude Code */
  hooksDestination: string;

  /** Configuration directory (~/.247/) */
  configDir: string;

  /** Configuration file path */
  configPath: string;

  /** Data directory for SQLite */
  dataDir: string;

  /** Log directory */
  logDir: string;

  /** PID file path */
  pidFile: string;

  /** Node binary path */
  nodePath: string;

  /** Is this a development install? */
  isDev: boolean;
}

let cachedPaths: AgentPaths | null = null;

export function getAgentPaths(): AgentPaths {
  if (cachedPaths) return cachedPaths;

  // CLI root is 2 levels up from lib/ (dist/lib -> dist -> cli root)
  const cliRoot = resolve(__dirname, '..', '..');

  // Check if running from source (monorepo) or installed (npm global)
  // In monorepo: cliRoot is packages/cli, parent has pnpm-workspace.yaml
  const monorepoRoot = resolve(cliRoot, '..', '..');
  const isDev = existsSync(join(monorepoRoot, 'pnpm-workspace.yaml'));

  let agentRoot: string;
  let hooksSource: string;

  if (isDev) {
    // Development: agent and hooks are in the monorepo
    agentRoot = resolve(monorepoRoot, 'apps', 'agent');
    hooksSource = resolve(monorepoRoot, 'packages', 'hooks');
  } else {
    // Production: agent code is bundled with CLI
    agentRoot = join(cliRoot, 'agent');
    hooksSource = join(cliRoot, 'hooks');
  }

  // Configuration directory
  const configDir = join(homedir(), '.247');

  // Log directory varies by platform
  const os = platform();
  let logDir: string;
  if (os === 'darwin') {
    logDir = join(homedir(), 'Library', 'Logs', '247-agent');
  } else {
    logDir = join(homedir(), '.local', 'log', '247-agent');
  }

  cachedPaths = {
    cliRoot,
    agentRoot,
    hooksSource,
    hooksDestination: join(homedir(), '.claude-plugins', '247-hooks'),
    configDir,
    configPath: join(configDir, 'config.json'),
    dataDir: join(configDir, 'data'),
    logDir,
    pidFile: join(configDir, 'agent.pid'),
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

  const dirs = [
    paths.configDir,
    paths.dataDir,
    paths.logDir,
  ];

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
