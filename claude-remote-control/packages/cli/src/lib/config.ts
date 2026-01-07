import { existsSync, readFileSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';
import { getAgentPaths, ensureDirectories } from './paths.js';

export interface AgentConfig {
  machine: {
    id: string;
    name: string;
  };
  agent: {
    port: number;
  };
  projects: {
    basePath: string;
    whitelist: string[];
  };
  editor?: {
    enabled: boolean;
    portRange: { start: number; end: number };
    idleTimeout: number;
  };
}

const DEFAULT_CONFIG: AgentConfig = {
  machine: {
    id: '',
    name: '',
  },
  agent: {
    port: 4678,
  },
  projects: {
    basePath: '~/Dev',
    whitelist: [],
  },
  editor: {
    enabled: false,
    portRange: { start: 4680, end: 4699 },
    idleTimeout: 1800000,
  },
};

/**
 * Load configuration from ~/.247/config.json
 */
export function loadConfig(): AgentConfig | null {
  const paths = getAgentPaths();

  if (!existsSync(paths.configPath)) {
    return null;
  }

  try {
    const content = readFileSync(paths.configPath, 'utf-8');
    const config = JSON.parse(content) as AgentConfig;

    // Apply environment overrides
    if (process.env.AGENT_247_PORT) {
      config.agent.port = parseInt(process.env.AGENT_247_PORT, 10);
    }
    if (process.env.AGENT_247_PROJECTS) {
      config.projects.basePath = process.env.AGENT_247_PROJECTS;
    }

    return config;
  } catch (err) {
    console.error(`Failed to load config: ${(err as Error).message}`);
    return null;
  }
}

/**
 * Save configuration to ~/.247/config.json
 */
export function saveConfig(config: AgentConfig): void {
  const paths = getAgentPaths();
  ensureDirectories();

  const content = JSON.stringify(config, null, 2);
  writeFileSync(paths.configPath, content, 'utf-8');
}

/**
 * Create a new configuration with defaults
 */
export function createConfig(options: {
  machineName: string;
  port?: number;
  projectsPath?: string;
}): AgentConfig {
  return {
    ...DEFAULT_CONFIG,
    machine: {
      id: randomUUID(),
      name: options.machineName,
    },
    agent: {
      port: options.port ?? DEFAULT_CONFIG.agent.port,
    },
    projects: {
      basePath: options.projectsPath ?? DEFAULT_CONFIG.projects.basePath,
      whitelist: [],
    },
  };
}

/**
 * Check if configuration exists
 */
export function configExists(): boolean {
  const paths = getAgentPaths();
  return existsSync(paths.configPath);
}

/**
 * Get default configuration
 */
export function getDefaultConfig(): AgentConfig {
  return { ...DEFAULT_CONFIG };
}
