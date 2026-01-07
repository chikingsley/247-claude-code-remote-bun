import { existsSync, mkdirSync, copyFileSync, symlinkSync, unlinkSync, readFileSync, readdirSync, lstatSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { getAgentPaths } from '../lib/paths.js';

export interface HooksInstallResult {
  success: boolean;
  installed: boolean;
  updated: boolean;
  path: string;
  error?: string;
}

export interface HooksStatus {
  installed: boolean;
  path: string;
  isSymlink: boolean;
  sourceVersion?: string;
  installedVersion?: string;
  needsUpdate: boolean;
}

/**
 * Get hooks installation status
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

  let sourceVersion: string | undefined;
  let installedVersion: string | undefined;

  // Read source version
  const sourcePluginJson = join(paths.hooksSource, '.claude-plugin', 'plugin.json');
  if (existsSync(sourcePluginJson)) {
    try {
      const data = JSON.parse(readFileSync(sourcePluginJson, 'utf-8'));
      sourceVersion = data.version;
    } catch {
      // Ignore parse errors
    }
  }

  // Read installed version
  if (installed) {
    try {
      const data = JSON.parse(readFileSync(pluginJsonPath, 'utf-8'));
      installedVersion = data.version;
    } catch {
      // Ignore parse errors
    }
  }

  return {
    installed,
    path: dest,
    isSymlink,
    sourceVersion,
    installedVersion,
    needsUpdate: installed && sourceVersion !== installedVersion,
  };
}

/**
 * Install hooks to ~/.claude-plugins/247-hooks/
 * In dev mode: creates a symlink
 * In prod mode: copies files
 */
export function installHooks(options: { force?: boolean; useSymlink?: boolean } = {}): HooksInstallResult {
  const paths = getAgentPaths();
  const source = paths.hooksSource;
  const dest = paths.hooksDestination;

  // Verify source exists
  if (!existsSync(source)) {
    return {
      success: false,
      installed: false,
      updated: false,
      path: dest,
      error: `Hooks source not found at ${source}`,
    };
  }

  // Create parent directory if needed
  const parentDir = dirname(dest);
  if (!existsSync(parentDir)) {
    mkdirSync(parentDir, { recursive: true });
  }

  const status = getHooksStatus();
  const alreadyInstalled = status.installed;

  // Skip if already up to date (unless force)
  if (alreadyInstalled && !options.force && !status.needsUpdate) {
    return {
      success: true,
      installed: false,
      updated: false,
      path: dest,
    };
  }

  // Remove existing if updating or force
  if (existsSync(dest)) {
    try {
      if (status.isSymlink) {
        unlinkSync(dest);
      } else {
        rmSync(dest, { recursive: true, force: true });
      }
    } catch (err) {
      return {
        success: false,
        installed: false,
        updated: false,
        path: dest,
        error: `Failed to remove existing: ${(err as Error).message}`,
      };
    }
  }

  // Determine install method
  const useSymlink = options.useSymlink ?? paths.isDev;

  try {
    if (useSymlink) {
      // Symlink for dev - changes to hooks are immediately reflected
      symlinkSync(source, dest, 'dir');
    } else {
      // Copy for prod - stable installation
      copyDirectoryRecursive(source, dest);
    }
  } catch (err) {
    return {
      success: false,
      installed: false,
      updated: false,
      path: dest,
      error: `Failed to install: ${(err as Error).message}`,
    };
  }

  return {
    success: true,
    installed: !alreadyInstalled,
    updated: alreadyInstalled,
    path: dest,
  };
}

/**
 * Uninstall hooks from ~/.claude-plugins/
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

/**
 * Recursively copy a directory
 */
function copyDirectoryRecursive(source: string, dest: string): void {
  mkdirSync(dest, { recursive: true });

  for (const entry of readdirSync(source, { withFileTypes: true })) {
    const srcPath = join(source, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}
