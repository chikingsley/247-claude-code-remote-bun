/**
 * CLI Hooks Installer Tests
 *
 * Tests for the simplified hooks installer (only getHooksStatus and uninstallHooks).
 * The install functionality has been removed - statusLine is now auto-configured by the agent.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock paths module
const mockPaths = {
  configDir: '/mock/.247',
  configPath: '/mock/.247/config.json',
  dataDir: '/mock/.247/data',
  logDir: '/mock/.247/logs',
  pidFile: '/mock/.247/agent.pid',
  agentRoot: '/mock/agent',
  hooksDestination: '/mock/.claude-plugins/247-hooks',
  isDev: false,
  nodePath: '/usr/local/bin/node',
};

vi.mock('../../src/lib/paths.js', () => ({
  getAgentPaths: () => mockPaths,
  ensureDirectories: vi.fn(),
}));

// Mock fs module
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  copyFileSync: vi.fn(),
  symlinkSync: vi.fn(),
  unlinkSync: vi.fn(),
  readFileSync: vi.fn(),
  readdirSync: vi.fn(),
  lstatSync: vi.fn(),
  rmSync: vi.fn(),
}));

describe('CLI Hooks Installer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('getHooksStatus', () => {
    it('returns not installed if plugin.json missing', async () => {
      const { existsSync } = await import('fs');
      vi.mocked(existsSync).mockReturnValue(false);

      const { getHooksStatus } = await import('../../src/hooks/installer.js');
      const status = getHooksStatus();

      expect(status.installed).toBe(false);
      expect(status.path).toBe('/mock/.claude-plugins/247-hooks');
    });

    it('returns installed status', async () => {
      const { existsSync, lstatSync } = await import('fs');

      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(lstatSync).mockReturnValue({ isSymbolicLink: () => false } as any);

      const { getHooksStatus } = await import('../../src/hooks/installer.js');
      const status = getHooksStatus();

      expect(status.installed).toBe(true);
      expect(status.isSymlink).toBe(false);
    });

    it('detects symlink installation', async () => {
      const { existsSync, lstatSync } = await import('fs');

      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(lstatSync).mockReturnValue({ isSymbolicLink: () => true } as any);

      const { getHooksStatus } = await import('../../src/hooks/installer.js');
      const status = getHooksStatus();

      expect(status.isSymlink).toBe(true);
    });
  });

  describe('uninstallHooks', () => {
    it('returns success if already uninstalled', async () => {
      const { existsSync } = await import('fs');
      vi.mocked(existsSync).mockReturnValue(false);

      const { uninstallHooks } = await import('../../src/hooks/installer.js');
      const result = uninstallHooks();

      expect(result.success).toBe(true);
    });

    it('removes symlink installation', async () => {
      const { existsSync, lstatSync, unlinkSync } = await import('fs');

      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(lstatSync).mockReturnValue({ isSymbolicLink: () => true } as any);

      const { uninstallHooks } = await import('../../src/hooks/installer.js');
      const result = uninstallHooks();

      expect(result.success).toBe(true);
      expect(unlinkSync).toHaveBeenCalledWith('/mock/.claude-plugins/247-hooks');
    });

    it('removes directory installation', async () => {
      const { existsSync, lstatSync, rmSync } = await import('fs');

      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(lstatSync).mockReturnValue({ isSymbolicLink: () => false } as any);

      const { uninstallHooks } = await import('../../src/hooks/installer.js');
      const result = uninstallHooks();

      expect(result.success).toBe(true);
      expect(rmSync).toHaveBeenCalledWith('/mock/.claude-plugins/247-hooks', {
        recursive: true,
        force: true,
      });
    });

    it('returns error on failure', async () => {
      const { existsSync, lstatSync, rmSync } = await import('fs');

      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(lstatSync).mockReturnValue({ isSymbolicLink: () => false } as any);
      vi.mocked(rmSync).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const { uninstallHooks } = await import('../../src/hooks/installer.js');
      const result = uninstallHooks();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
    });
  });
});
