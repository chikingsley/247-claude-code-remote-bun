/**
 * Hooks Command Tests
 *
 * Tests for the deprecated hooks command (now uses statusLine).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock chalk
vi.mock('chalk', () => ({
  default: {
    bold: (s: string) => s,
    red: (s: string) => s,
    green: (s: string) => s,
    yellow: (s: string) => s,
    dim: (s: string) => s,
  },
}));

// Mock ora
const mockSpinner = {
  start: vi.fn().mockReturnThis(),
  succeed: vi.fn().mockReturnThis(),
  fail: vi.fn().mockReturnThis(),
  info: vi.fn().mockReturnThis(),
  text: '',
};
vi.mock('ora', () => ({
  default: vi.fn(() => mockSpinner),
}));

// Mock hooks installer
vi.mock('../../../src/hooks/installer.js', () => ({
  uninstallHooks: vi.fn(),
  getHooksStatus: vi.fn(),
}));

describe('Hooks Command', () => {
  let consoleLogs: string[];
  let consoleErrors: string[];
  let originalConsoleLog: typeof console.log;
  let originalConsoleError: typeof console.error;
  let exitMock: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    // Reset spinner mocks
    mockSpinner.start.mockClear().mockReturnThis();
    mockSpinner.succeed.mockClear().mockReturnThis();
    mockSpinner.fail.mockClear().mockReturnThis();
    mockSpinner.info.mockClear().mockReturnThis();

    // Capture console output
    consoleLogs = [];
    consoleErrors = [];
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    console.log = vi.fn((...args) => {
      consoleLogs.push(args.join(' '));
    });
    console.error = vi.fn((...args) => {
      consoleErrors.push(args.join(' '));
    });

    // Mock process.exit to throw so we can catch it
    exitMock = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    exitMock.mockRestore();
  });

  describe('install subcommand (deprecated)', () => {
    it('shows deprecation message', async () => {
      const { getHooksStatus } = await import('../../../src/hooks/installer.js');
      vi.mocked(getHooksStatus).mockReturnValue({
        installed: false,
        path: '',
        isSymlink: false,
      });

      const { hooksCommand } = await import('../../../src/commands/hooks.js');
      await hooksCommand.parseAsync(['node', 'hooks', 'install']);

      expect(consoleLogs.some((log) => log.includes('deprecated'))).toBe(true);
      expect(consoleLogs.some((log) => log.includes('statusLine'))).toBe(true);
    });

    it('shows old hooks warning when present', async () => {
      const { getHooksStatus } = await import('../../../src/hooks/installer.js');
      vi.mocked(getHooksStatus).mockReturnValue({
        installed: true,
        path: '/test/hooks',
        isSymlink: false,
      });

      const { hooksCommand } = await import('../../../src/commands/hooks.js');
      await hooksCommand.parseAsync(['node', 'hooks', 'install']);

      expect(consoleLogs.some((log) => log.includes('Old hooks detected'))).toBe(true);
      expect(consoleLogs.some((log) => log.includes('uninstall'))).toBe(true);
    });
  });

  describe('uninstall subcommand', () => {
    it('shows success when no hooks installed', async () => {
      const { getHooksStatus } = await import('../../../src/hooks/installer.js');
      vi.mocked(getHooksStatus).mockReturnValue({
        installed: false,
        path: '',
        isSymlink: false,
      });

      const { hooksCommand } = await import('../../../src/commands/hooks.js');
      await hooksCommand.parseAsync(['node', 'hooks', 'uninstall']);

      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        'No old hooks installed - nothing to clean up'
      );
    });

    it('uninstalls old hooks successfully', async () => {
      const { getHooksStatus, uninstallHooks } = await import('../../../src/hooks/installer.js');
      vi.mocked(getHooksStatus).mockReturnValue({
        installed: true,
        path: '/test/hooks',
        isSymlink: false,
      });
      vi.mocked(uninstallHooks).mockReturnValue({ success: true });

      const { hooksCommand } = await import('../../../src/commands/hooks.js');
      await hooksCommand.parseAsync(['node', 'hooks', 'uninstall']);

      expect(mockSpinner.succeed).toHaveBeenCalledWith('Old hooks removed successfully');
    });

    it('shows failure message on uninstall error', async () => {
      const { getHooksStatus, uninstallHooks } = await import('../../../src/hooks/installer.js');
      vi.mocked(getHooksStatus).mockReturnValue({
        installed: true,
        path: '/test/hooks',
        isSymlink: false,
      });
      vi.mocked(uninstallHooks).mockReturnValue({
        success: false,
        error: 'Directory not empty',
      });

      const { hooksCommand } = await import('../../../src/commands/hooks.js');

      try {
        await hooksCommand.parseAsync(['node', 'hooks', 'uninstall']);
      } catch {
        // Expected process.exit
      }

      expect(mockSpinner.fail).toHaveBeenCalledWith(expect.stringContaining('Directory not empty'));
    });
  });

  describe('status subcommand', () => {
    it('shows statusLine API info', async () => {
      const { getHooksStatus } = await import('../../../src/hooks/installer.js');
      vi.mocked(getHooksStatus).mockReturnValue({
        installed: false,
        path: '',
        isSymlink: false,
      });

      const { hooksCommand } = await import('../../../src/commands/hooks.js');
      await hooksCommand.parseAsync(['node', 'hooks', 'status']);

      expect(consoleLogs.some((log) => log.includes('statusLine API'))).toBe(true);
    });

    it('warns about old hooks when present', async () => {
      const { getHooksStatus } = await import('../../../src/hooks/installer.js');
      vi.mocked(getHooksStatus).mockReturnValue({
        installed: true,
        path: '/home/user/.claude-plugins/247-hooks',
        isSymlink: true,
      });

      const { hooksCommand } = await import('../../../src/commands/hooks.js');
      await hooksCommand.parseAsync(['node', 'hooks', 'status']);

      expect(consoleLogs.some((log) => log.includes('Old hooks still installed'))).toBe(true);
      expect(consoleLogs.some((log) => log.includes('uninstall'))).toBe(true);
    });

    it('shows clean status when no old hooks', async () => {
      const { getHooksStatus } = await import('../../../src/hooks/installer.js');
      vi.mocked(getHooksStatus).mockReturnValue({
        installed: false,
        path: '',
        isSymlink: false,
      });

      const { hooksCommand } = await import('../../../src/commands/hooks.js');
      await hooksCommand.parseAsync(['node', 'hooks', 'status']);

      expect(consoleLogs.some((log) => log.includes('No old hooks installed'))).toBe(true);
    });
  });

  describe('update subcommand (deprecated)', () => {
    it('shows deprecation message', async () => {
      const { hooksCommand } = await import('../../../src/commands/hooks.js');
      await hooksCommand.parseAsync(['node', 'hooks', 'update']);

      expect(consoleLogs.some((log) => log.includes('deprecated'))).toBe(true);
      expect(consoleLogs.some((log) => log.includes('statusLine'))).toBe(true);
    });
  });
});
