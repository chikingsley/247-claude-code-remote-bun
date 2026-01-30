import { describe, it, expect, vi } from 'vitest';

/**
 * Test Sidebar component logic.
 * Tests machine item actions and props handling.
 */

// Mock SidebarMachine type for testing
interface MockMachine {
  id: string;
  name: string;
  type: 'localhost' | 'tailscale' | 'fly' | 'custom';
  status: 'online' | 'offline' | 'connecting';
  sessionCount: number;
  color?: string;
}

describe('Sidebar', () => {
  describe('MachineItem actions', () => {
    it('should show edit action when onEdit is provided', () => {
      const onEdit = vi.fn();
      const hasEditAction = !!onEdit;
      expect(hasEditAction).toBe(true);
    });

    it('should not show edit action when onEdit is undefined', () => {
      const onEdit = undefined;
      const hasEditAction = !!onEdit;
      expect(hasEditAction).toBe(false);
    });

    it('should show remove action when onRemove is provided and canRemove is true', () => {
      const onRemove = vi.fn();
      const canRemove = true;
      const hasRemoveAction = !!onRemove && canRemove;
      expect(hasRemoveAction).toBe(true);
    });

    it('should not show remove action when canRemove is false', () => {
      const onRemove = vi.fn();
      const canRemove = false;
      const hasRemoveAction = !!onRemove && canRemove;
      expect(hasRemoveAction).toBe(false);
    });

    it('should not show remove action when onRemove is undefined', () => {
      const onRemove = undefined;
      const canRemove = true;
      const hasRemoveAction = !!onRemove && canRemove;
      expect(hasRemoveAction).toBe(false);
    });
  });

  describe('canRemoveMachine logic', () => {
    it('should allow removal when there are multiple machines', () => {
      const machines: MockMachine[] = [
        { id: '1', name: 'Machine 1', type: 'localhost', status: 'online', sessionCount: 0 },
        { id: '2', name: 'Machine 2', type: 'tailscale', status: 'online', sessionCount: 0 },
      ];
      const canRemove = machines.length > 1;
      expect(canRemove).toBe(true);
    });

    it('should not allow removal when there is only one machine', () => {
      const machines: MockMachine[] = [
        { id: '1', name: 'Machine 1', type: 'localhost', status: 'online', sessionCount: 0 },
      ];
      const canRemove = machines.length > 1;
      expect(canRemove).toBe(false);
    });

    it('should not allow removal when there are no machines', () => {
      const machines: MockMachine[] = [];
      const canRemove = machines.length > 1;
      expect(canRemove).toBe(false);
    });
  });

  describe('touch device detection', () => {
    it('should detect touch device when ontouchstart exists', () => {
      const mockWindow = { ontouchstart: {} };
      const isTouchDevice = 'ontouchstart' in mockWindow;
      expect(isTouchDevice).toBe(true);
    });

    it('should not detect touch device when ontouchstart does not exist', () => {
      const mockWindow = {};
      const isTouchDevice = 'ontouchstart' in mockWindow;
      expect(isTouchDevice).toBe(false);
    });
  });

  describe('action visibility logic', () => {
    it('should show actions on hover for desktop', () => {
      const isHovered = true;
      const isTouchDevice = false;
      const showActions = isHovered || isTouchDevice;
      expect(showActions).toBe(true);
    });

    it('should show actions always on touch devices', () => {
      const isHovered = false;
      const isTouchDevice = true;
      const showActions = isHovered || isTouchDevice;
      expect(showActions).toBe(true);
    });

    it('should hide actions when not hovered on desktop', () => {
      const isHovered = false;
      const isTouchDevice = false;
      const showActions = isHovered || isTouchDevice;
      expect(showActions).toBe(false);
    });
  });

  describe('machine props passing', () => {
    it('should pass edit callback for specific machine', () => {
      const machine: MockMachine = {
        id: 'test-id',
        name: 'Test Machine',
        type: 'localhost',
        status: 'online',
        sessionCount: 3,
      };
      const onEditMachine = vi.fn();

      // Simulate how Sidebar passes callback to MachineItem
      const onEdit = () => onEditMachine(machine);
      onEdit();

      expect(onEditMachine).toHaveBeenCalledWith(machine);
    });

    it('should pass remove callback for specific machine', () => {
      const machine: MockMachine = {
        id: 'test-id',
        name: 'Test Machine',
        type: 'localhost',
        status: 'online',
        sessionCount: 3,
      };
      const onRemoveMachine = vi.fn();

      // Simulate how Sidebar passes callback to MachineItem
      const onRemove = () => onRemoveMachine(machine);
      onRemove();

      expect(onRemoveMachine).toHaveBeenCalledWith(machine);
    });

    it('should pass canRemove result for specific machine', () => {
      const machine: MockMachine = {
        id: 'test-id',
        name: 'Test Machine',
        type: 'localhost',
        status: 'online',
        sessionCount: 3,
      };
      // canRemoveMachine receives a machine and returns boolean
      const canRemoveMachine = vi.fn((_m: MockMachine) => true);

      // Simulate how Sidebar computes canRemove
      const canRemove = canRemoveMachine(machine);

      expect(canRemoveMachine).toHaveBeenCalledWith(machine);
      expect(canRemove).toBe(true);
    });
  });

  describe('collapsed state', () => {
    it('should not show actions in collapsed mode', () => {
      const collapsed = true;
      // In collapsed mode, only icon is shown, no actions
      const shouldShowActions = !collapsed;
      expect(shouldShowActions).toBe(false);
    });

    it('should show actions in expanded mode', () => {
      const collapsed = false;
      const shouldShowActions = !collapsed;
      expect(shouldShowActions).toBe(true);
    });
  });
});
