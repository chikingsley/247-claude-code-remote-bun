import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatTimeAgo, formatRelativeTime } from '../../../src/lib/time';

describe('Time utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatTimeAgo', () => {
    it('returns "just now" for times less than 60 seconds ago', () => {
      expect(formatTimeAgo(new Date('2024-01-15T11:59:30Z'))).toBe('just now');
      expect(formatTimeAgo(new Date('2024-01-15T11:59:01Z'))).toBe('just now');
      expect(formatTimeAgo(new Date('2024-01-15T12:00:00Z'))).toBe('just now');
    });

    it('returns minutes for times between 1-59 minutes ago', () => {
      expect(formatTimeAgo(new Date('2024-01-15T11:59:00Z'))).toBe('1m ago');
      expect(formatTimeAgo(new Date('2024-01-15T11:55:00Z'))).toBe('5m ago');
      expect(formatTimeAgo(new Date('2024-01-15T11:30:00Z'))).toBe('30m ago');
      expect(formatTimeAgo(new Date('2024-01-15T11:01:00Z'))).toBe('59m ago');
    });

    it('returns hours for times between 1-23 hours ago', () => {
      expect(formatTimeAgo(new Date('2024-01-15T11:00:00Z'))).toBe('1h ago');
      expect(formatTimeAgo(new Date('2024-01-15T10:00:00Z'))).toBe('2h ago');
      expect(formatTimeAgo(new Date('2024-01-15T00:00:00Z'))).toBe('12h ago');
      expect(formatTimeAgo(new Date('2024-01-14T13:00:00Z'))).toBe('23h ago');
    });

    it('returns days for times 24+ hours ago', () => {
      expect(formatTimeAgo(new Date('2024-01-14T12:00:00Z'))).toBe('1d ago');
      expect(formatTimeAgo(new Date('2024-01-13T12:00:00Z'))).toBe('2d ago');
      expect(formatTimeAgo(new Date('2024-01-08T12:00:00Z'))).toBe('7d ago');
      expect(formatTimeAgo(new Date('2023-12-15T12:00:00Z'))).toBe('31d ago');
    });
  });

  describe('formatRelativeTime', () => {
    const now = new Date('2024-01-15T12:00:00Z').getTime();

    it('returns "just now" for current time', () => {
      expect(formatRelativeTime(now)).toBe('just now');
    });

    it('returns "just now" for times less than 60 seconds ago', () => {
      expect(formatRelativeTime(now - 30 * 1000)).toBe('just now');
      expect(formatRelativeTime(now - 59 * 1000)).toBe('just now');
    });

    it('returns "just now" for future times', () => {
      expect(formatRelativeTime(now + 60 * 1000)).toBe('just now');
    });

    it('returns minutes for times between 1-59 minutes ago', () => {
      expect(formatRelativeTime(now - 60 * 1000)).toBe('1m ago');
      expect(formatRelativeTime(now - 5 * 60 * 1000)).toBe('5m ago');
      expect(formatRelativeTime(now - 30 * 60 * 1000)).toBe('30m ago');
      expect(formatRelativeTime(now - 59 * 60 * 1000)).toBe('59m ago');
    });

    it('returns hours for times between 1-23 hours ago', () => {
      expect(formatRelativeTime(now - 60 * 60 * 1000)).toBe('1h ago');
      expect(formatRelativeTime(now - 2 * 60 * 60 * 1000)).toBe('2h ago');
      expect(formatRelativeTime(now - 12 * 60 * 60 * 1000)).toBe('12h ago');
      expect(formatRelativeTime(now - 23 * 60 * 60 * 1000)).toBe('23h ago');
    });

    it('returns days for times 24+ hours ago', () => {
      expect(formatRelativeTime(now - 24 * 60 * 60 * 1000)).toBe('1d ago');
      expect(formatRelativeTime(now - 2 * 24 * 60 * 60 * 1000)).toBe('2d ago');
      expect(formatRelativeTime(now - 7 * 24 * 60 * 60 * 1000)).toBe('7d ago');
    });
  });

  describe('Edge cases', () => {
    it('handles boundary between just now and 1m ago', () => {
      const now = new Date('2024-01-15T12:00:00Z').getTime();

      // 59 seconds = just now
      expect(formatRelativeTime(now - 59 * 1000)).toBe('just now');
      // 60 seconds = 1m ago
      expect(formatRelativeTime(now - 60 * 1000)).toBe('1m ago');
    });

    it('handles boundary between 59m and 1h ago', () => {
      const now = new Date('2024-01-15T12:00:00Z').getTime();

      // 59 minutes = 59m ago
      expect(formatRelativeTime(now - 59 * 60 * 1000)).toBe('59m ago');
      // 60 minutes = 1h ago
      expect(formatRelativeTime(now - 60 * 60 * 1000)).toBe('1h ago');
    });

    it('handles boundary between 23h and 1d ago', () => {
      const now = new Date('2024-01-15T12:00:00Z').getTime();

      // 23 hours = 23h ago
      expect(formatRelativeTime(now - 23 * 60 * 60 * 1000)).toBe('23h ago');
      // 24 hours = 1d ago
      expect(formatRelativeTime(now - 24 * 60 * 60 * 1000)).toBe('1d ago');
    });
  });
});
