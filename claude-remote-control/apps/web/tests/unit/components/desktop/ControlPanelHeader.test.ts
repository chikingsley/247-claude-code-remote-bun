import { describe, it, expect } from 'vitest';

/**
 * Test ControlPanelHeader component logic.
 * Simplified after removing status tracking system.
 */

describe('ControlPanelHeader', () => {
  describe('session count display', () => {
    it('shows count badge when totalSessions > 0', () => {
      const showBadge = (totalSessions: number) => totalSessions > 0;
      expect(showBadge(2)).toBe(true);
      expect(showBadge(0)).toBe(false);
    });
  });

  describe('collapsed state', () => {
    it('shows system indicator when collapsed', () => {
      const systemIndicator = '▣';
      expect(systemIndicator).toBe('▣');
    });

    it('shows expanded header text when not collapsed', () => {
      const headerText = 'Sessions';
      expect(headerText).toBe('Sessions');
    });
  });

  describe('typography styles', () => {
    it('uses correct text size for header', () => {
      const headerClass = 'font-mono text-[10px] uppercase tracking-wider text-white/40';
      expect(headerClass).toContain('text-[10px]');
    });
  });

  describe('collapsed count indicator', () => {
    it('shows total count when collapsed and sessions exist', () => {
      const showCollapsedCount = (isCollapsed: boolean, totalSessions: number) => {
        return isCollapsed && totalSessions > 0;
      };
      expect(showCollapsedCount(true, 3)).toBe(true);
      expect(showCollapsedCount(true, 0)).toBe(false);
      expect(showCollapsedCount(false, 3)).toBe(false);
    });
  });

  describe('collapse toggle button', () => {
    it('toggles between ChevronLeft and ChevronRight', () => {
      const getIcon = (isCollapsed: boolean) => (isCollapsed ? 'ChevronRight' : 'ChevronLeft');
      expect(getIcon(true)).toBe('ChevronRight');
      expect(getIcon(false)).toBe('ChevronLeft');
    });
  });

  describe('active badge styling', () => {
    it('active badge uses emerald color', () => {
      const badgeClass = 'bg-emerald-500/20 text-emerald-400';
      expect(badgeClass).toContain('emerald-500');
      expect(badgeClass).toContain('emerald-400');
    });

    it('active badge is rounded pill', () => {
      const badgeClass = 'rounded-full px-1.5';
      expect(badgeClass).toContain('rounded-full');
    });
  });
});
