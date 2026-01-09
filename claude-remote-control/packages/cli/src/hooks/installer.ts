import { existsSync, lstatSync, unlinkSync, rmSync } from 'fs';
import { join } from 'path';
import { getAgentPaths } from '../lib/paths.js';

export interface HooksStatus {
  installed: boolean;
  path: string;
  isSymlink: boolean;
}

/**
 * Get old hooks installation status.
 * Used for detecting legacy hooks that need cleanup.
 */
export function getHooksStatus(): HooksStatus {
  const paths = getAgentPaths();
  const dest = paths.hooksDestination;
  const pluginJsonPath = join(dest, '.claude-plugin', 'plugin.json');

  const installed = existsSync(pluginJsonPath);
  let isSymlink = false;

  if (installed) {
    try {
      isSymlink = lstatSync(dest).isSymbolicLink();
    } catch {
      // Not a symlink
    }
  }

  return {
    installed,
    path: dest,
    isSymlink,
  };
}

/**
 * Uninstall old hooks from ~/.claude-plugins/247-hooks/
 * Used for cleaning up the deprecated plugin-based hooks system.
 */
export function uninstallHooks(): { success: boolean; error?: string } {
  const paths = getAgentPaths();
  const dest = paths.hooksDestination;

  if (!existsSync(dest)) {
    return { success: true }; // Already uninstalled
  }

  try {
    const status = getHooksStatus();
    if (status.isSymlink) {
      unlinkSync(dest);
    } else {
      rmSync(dest, { recursive: true, force: true });
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
