import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface InitScriptOptions {
  sessionName: string;
  customEnvVars?: Record<string, string>;
}

/**
 * Generates a bash init script for tmux session initialization.
 * This script sets up environment variables and tmux options, then starts an interactive shell.
 */
export function generateInitScript(options: InitScriptOptions): string {
  const { sessionName, customEnvVars = {} } = options;

  // Build export statements
  const exports: string[] = [`export CLAUDE_TMUX_SESSION="${escapeForBash(sessionName)}"`];

  // Add custom env vars (filter out empty values)
  for (const [key, value] of Object.entries(customEnvVars)) {
    if (value && value.trim() !== '') {
      exports.push(`export ${key}="${escapeForBash(value)}"`);
    }
  }

  return `#!/bin/bash
# 247 Terminal Init Script - Auto-generated
# Session: ${sessionName}
# Generated: ${new Date().toISOString()}

# Environment variables
${exports.join('\n')}

# tmux configuration
tmux set-option -t "${escapeForBash(sessionName)}" history-limit 10000 2>/dev/null
tmux set-option -t "${escapeForBash(sessionName)}" mouse on 2>/dev/null

# Start interactive shell (replaces this script process)
exec bash -i
`;
}

/**
 * Escapes a string for safe use in bash double-quoted strings.
 */
function escapeForBash(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\$/g, '\\$')
    .replace(/`/g, '\\`');
}

/**
 * Writes the init script to a temporary file.
 * @returns The path to the created script file.
 */
export function writeInitScript(sessionName: string, content: string): string {
  const scriptPath = path.join(os.tmpdir(), `247-init-${sessionName}.sh`);
  fs.writeFileSync(scriptPath, content, { mode: 0o755 });
  return scriptPath;
}

/**
 * Removes the init script file.
 */
export function cleanupInitScript(sessionName: string): void {
  const scriptPath = path.join(os.tmpdir(), `247-init-${sessionName}.sh`);
  try {
    fs.unlinkSync(scriptPath);
  } catch {
    // Ignore errors (file might already be deleted)
  }
}

/**
 * Gets the path where an init script would be written.
 */
export function getInitScriptPath(sessionName: string): string {
  return path.join(os.tmpdir(), `247-init-${sessionName}.sh`);
}
