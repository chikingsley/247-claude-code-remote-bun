import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Mock fs and os
vi.mock('fs');
vi.mock('os', () => ({
  tmpdir: vi.fn(() => '/tmp'),
}));

describe('init-script', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('generateInitScript', () => {
    it('generates script with session name export', async () => {
      const { generateInitScript } = await import('../../src/lib/init-script.js');

      const script = generateInitScript({ sessionName: 'my-session' });

      expect(script).toContain('#!/bin/bash');
      expect(script).toContain('export CLAUDE_TMUX_SESSION="my-session"');
      expect(script).toContain('tmux set-option -t "my-session" history-limit 10000');
      expect(script).toContain('tmux set-option -t "my-session" mouse on');
      expect(script).toContain('exec bash -i');
    });

    it('includes custom env vars in script', async () => {
      const { generateInitScript } = await import('../../src/lib/init-script.js');

      const script = generateInitScript({
        sessionName: 'test',
        customEnvVars: {
          MY_VAR: 'value1',
          ANOTHER_VAR: 'value2',
        },
      });

      expect(script).toContain('export MY_VAR="value1"');
      expect(script).toContain('export ANOTHER_VAR="value2"');
    });

    it('filters out empty env vars', async () => {
      const { generateInitScript } = await import('../../src/lib/init-script.js');

      const script = generateInitScript({
        sessionName: 'test',
        customEnvVars: {
          VALID: 'value',
          EMPTY: '',
          WHITESPACE: '   ',
        },
      });

      expect(script).toContain('export VALID="value"');
      expect(script).not.toContain('export EMPTY=');
      expect(script).not.toContain('export WHITESPACE=');
    });

    it('escapes special characters in values', async () => {
      const { generateInitScript } = await import('../../src/lib/init-script.js');

      const script = generateInitScript({
        sessionName: 'test',
        customEnvVars: {
          WITH_QUOTES: 'value with "quotes"',
          WITH_DOLLAR: 'value with $VAR',
          WITH_BACKTICK: 'value with `cmd`',
          WITH_BACKSLASH: 'value with \\path',
        },
      });

      // Check that special chars are escaped
      expect(script).toContain('export WITH_QUOTES="value with \\"quotes\\""');
      expect(script).toContain('export WITH_DOLLAR="value with \\$VAR"');
      expect(script).toContain('export WITH_BACKTICK="value with \\`cmd\\`"');
      expect(script).toContain('export WITH_BACKSLASH="value with \\\\path"');
    });

    it('escapes special characters in session name', async () => {
      const { generateInitScript } = await import('../../src/lib/init-script.js');

      const script = generateInitScript({
        sessionName: 'session-with-$pecial"chars',
      });

      expect(script).toContain('export CLAUDE_TMUX_SESSION="session-with-\\$pecial\\"chars"');
    });
  });

  describe('writeInitScript', () => {
    it('writes script to temp directory with correct permissions', async () => {
      const { writeInitScript } = await import('../../src/lib/init-script.js');

      const result = writeInitScript('my-session', '#!/bin/bash\necho hello');

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/tmp/247-init-my-session.sh',
        '#!/bin/bash\necho hello',
        { mode: 0o755 }
      );
      expect(result).toBe('/tmp/247-init-my-session.sh');
    });
  });

  describe('cleanupInitScript', () => {
    it('removes init script file', async () => {
      const { cleanupInitScript } = await import('../../src/lib/init-script.js');

      cleanupInitScript('my-session');

      expect(fs.unlinkSync).toHaveBeenCalledWith('/tmp/247-init-my-session.sh');
    });

    it('ignores errors when file does not exist', async () => {
      vi.mocked(fs.unlinkSync).mockImplementation(() => {
        throw new Error('ENOENT');
      });

      const { cleanupInitScript } = await import('../../src/lib/init-script.js');

      // Should not throw
      expect(() => cleanupInitScript('nonexistent')).not.toThrow();
    });
  });

  describe('getInitScriptPath', () => {
    it('returns correct path for session', async () => {
      const { getInitScriptPath } = await import('../../src/lib/init-script.js');

      const result = getInitScriptPath('my-session');

      expect(result).toBe('/tmp/247-init-my-session.sh');
    });
  });
});
