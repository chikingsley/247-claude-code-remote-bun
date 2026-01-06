import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractProjectName, cloneRepo } from '../../src/git.js';

// Mock child_process
vi.mock('child_process', () => ({
  exec: vi.fn((cmd, opts, cb) => {
    const callback = typeof opts === 'function' ? opts : cb;
    if (callback) callback(null, { stdout: '', stderr: '' });
  }),
}));

// Mock fs/promises
vi.mock('fs/promises', () => ({
  access: vi.fn().mockRejectedValue(new Error('ENOENT')),
  rm: vi.fn().mockResolvedValue(undefined),
}));

describe('Git utilities', () => {
  describe('extractProjectName', () => {
    it.each([
      ['https://github.com/user/repo', 'repo'],
      ['https://github.com/user/repo.git', 'repo'],
      ['https://gitlab.com/org/project-name', 'project-name'],
      ['https://github.com/user/my.project', 'my.project'],
    ])('extracts from HTTPS URL "%s" -> "%s"', (url, expected) => {
      expect(extractProjectName(url)).toBe(expected);
    });

    it.each([
      ['git@github.com:user/repo.git', 'repo'],
      ['git@github.com:user/repo', 'repo'],
      ['git@gitlab.com:org/my-project.git', 'my-project'],
    ])('extracts from SSH URL "%s" -> "%s"', (url, expected) => {
      expect(extractProjectName(url)).toBe(expected);
    });

    it.each([
      ['user/repo', 'repo'],
      ['organization/project-name', 'project-name'],
    ])('extracts from shorthand "%s" -> "%s"', (url, expected) => {
      expect(extractProjectName(url)).toBe(expected);
    });

    it('returns default name for empty input', () => {
      expect(extractProjectName('')).toBe('cloned-repo');
    });
  });

  describe('cloneRepo', () => {
    beforeEach(async () => {
      vi.clearAllMocks();
      // Reset mock to default (directory doesn't exist)
      const fs = await import('fs/promises');
      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('rejects invalid git URLs', async () => {
      const result = await cloneRepo('not-a-url', '/tmp');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid git URL format');
    });

    it('rejects javascript: URLs (security)', async () => {
      const result = await cloneRepo('javascript:alert(1)', '/tmp');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid git URL format');
    });

    it('rejects file:// URLs (security)', async () => {
      const result = await cloneRepo('file:///etc/passwd', '/tmp');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid git URL format');
    });

    it('accepts valid HTTPS URL', async () => {
      const result = await cloneRepo('https://github.com/user/repo', '/tmp');
      // Should not fail on URL validation
      expect(result.error).not.toBe('Invalid git URL format');
    });

    it('accepts valid SSH URL', async () => {
      const result = await cloneRepo('git@github.com:user/repo.git', '/tmp');
      expect(result.error).not.toBe('Invalid git URL format');
    });

    it('accepts GitHub shorthand', async () => {
      const result = await cloneRepo('user/repo', '/tmp');
      expect(result.error).not.toBe('Invalid git URL format');
    });

    it('rejects invalid project names', async () => {
      const result = await cloneRepo('https://github.com/user/repo', '/tmp', 'invalid name with spaces');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid project name');
    });

    it('rejects project names with special characters', async () => {
      const result = await cloneRepo('https://github.com/user/repo', '/tmp', 'project;rm -rf /');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid project name');
    });

    it('rejects if directory already exists', async () => {
      const fs = await import('fs/promises');
      vi.mocked(fs.access).mockResolvedValueOnce(undefined);

      const result = await cloneRepo('https://github.com/user/repo', '/tmp');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Directory already exists');
    });

    it('uses extracted project name when not provided', async () => {
      const result = await cloneRepo('https://github.com/user/my-project', '/tmp');
      expect(result.projectName).toBe('my-project');
    });

    it('uses custom project name when provided', async () => {
      const result = await cloneRepo('https://github.com/user/repo', '/tmp', 'custom-name');
      expect(result.projectName).toBe('custom-name');
    });

    it('expands ~ in basePath', async () => {
      const originalHome = process.env.HOME;
      process.env.HOME = '/home/testuser';

      const result = await cloneRepo('https://github.com/user/repo', '~/projects');
      expect(result.path).toContain('/home/testuser/projects');

      process.env.HOME = originalHome;
    });
  });

  describe('URL validation security', () => {
    it.each([
      ['https://github.com/user/repo', true],
      ['https://github.com/user/repo.git', true],
      ['git@github.com:user/repo.git', true],
      ['user/repo', true],
      ['not-a-url', false],
      ['javascript:alert(1)', false],
      ['file:///etc/passwd', false],
      ['ftp://example.com/repo', false],
      ['data:text/html,<script>alert(1)</script>', false],
      ['https://github.com/user/repo; rm -rf /', false],
      ['https://github.com/user/repo\nrm -rf /', false],
    ])('validates "%s" as %s', async (url, shouldBeValid) => {
      const result = await cloneRepo(url, '/tmp');
      if (shouldBeValid) {
        expect(result.error).not.toBe('Invalid git URL format');
      } else {
        expect(result.error).toBe('Invalid git URL format');
      }
    });
  });
});
