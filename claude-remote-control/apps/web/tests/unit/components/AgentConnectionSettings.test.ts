/**
 * AgentConnectionSettings Tests
 *
 * Tests for agent connection management including localStorage persistence
 * and disconnect functionality.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadAgentConnection,
  saveAgentConnection,
  clearAgentConnection,
  type AgentConnection,
} from '@/components/AgentConnectionSettings';

describe('AgentConnectionSettings', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('loadAgentConnection', () => {
    it('returns null when no connection is stored', () => {
      expect(loadAgentConnection()).toBeNull();
    });

    it('returns stored connection when present', () => {
      const connection: AgentConnection = {
        url: 'localhost:4678',
        name: 'Test Agent',
        method: 'localhost',
      };
      localStorage.setItem('agentConnection', JSON.stringify(connection));

      expect(loadAgentConnection()).toEqual(connection);
    });

    it('returns null for invalid JSON', () => {
      localStorage.setItem('agentConnection', 'invalid-json');

      expect(loadAgentConnection()).toBeNull();
    });

    it('handles tailscale connection method', () => {
      const connection: AgentConnection = {
        url: 'machine.tailnet.ts.net',
        name: 'Tailscale Funnel',
        method: 'tailscale',
      };
      localStorage.setItem('agentConnection', JSON.stringify(connection));

      expect(loadAgentConnection()).toEqual(connection);
    });

    it('handles custom connection method', () => {
      const connection: AgentConnection = {
        url: '192.168.1.100:4678',
        name: 'Custom URL',
        method: 'custom',
      };
      localStorage.setItem('agentConnection', JSON.stringify(connection));

      expect(loadAgentConnection()).toEqual(connection);
    });
  });

  describe('saveAgentConnection', () => {
    it('saves connection to localStorage', () => {
      const connection: AgentConnection = {
        url: 'localhost:4678',
        name: 'Same Computer',
        method: 'localhost',
      };

      saveAgentConnection(connection);

      const stored = JSON.parse(localStorage.getItem('agentConnection') || '');
      expect(stored).toEqual(connection);
    });

    it('returns the saved connection', () => {
      const connection: AgentConnection = {
        url: 'localhost:4679',
        method: 'localhost',
      };

      const result = saveAgentConnection(connection);

      expect(result).toEqual(connection);
    });

    it('overwrites existing connection', () => {
      const oldConnection: AgentConnection = {
        url: 'localhost:4678',
        method: 'localhost',
      };
      const newConnection: AgentConnection = {
        url: 'machine.tailnet.ts.net',
        name: 'New Connection',
        method: 'tailscale',
      };

      saveAgentConnection(oldConnection);
      saveAgentConnection(newConnection);

      const stored = JSON.parse(localStorage.getItem('agentConnection') || '');
      expect(stored).toEqual(newConnection);
    });
  });

  describe('clearAgentConnection', () => {
    it('removes connection from localStorage', () => {
      const connection: AgentConnection = {
        url: 'localhost:4678',
        method: 'localhost',
      };
      localStorage.setItem('agentConnection', JSON.stringify(connection));

      clearAgentConnection();

      expect(localStorage.getItem('agentConnection')).toBeNull();
    });

    it('does nothing when no connection exists', () => {
      // Should not throw
      expect(() => clearAgentConnection()).not.toThrow();
      expect(localStorage.getItem('agentConnection')).toBeNull();
    });

    it('clears connection after save', () => {
      const connection: AgentConnection = {
        url: 'localhost:4678',
        name: 'Test',
        method: 'localhost',
      };

      saveAgentConnection(connection);
      expect(loadAgentConnection()).toEqual(connection);

      clearAgentConnection();
      expect(loadAgentConnection()).toBeNull();
    });
  });

  describe('disconnect flow', () => {
    it('full connect then disconnect cycle works correctly', () => {
      // Initially no connection
      expect(loadAgentConnection()).toBeNull();

      // Save a connection
      const connection: AgentConnection = {
        url: 'localhost:4678',
        name: 'Same Computer',
        method: 'localhost',
      };
      saveAgentConnection(connection);
      expect(loadAgentConnection()).toEqual(connection);

      // Clear the connection (disconnect)
      clearAgentConnection();
      expect(loadAgentConnection()).toBeNull();

      // Can save a new connection after clearing
      const newConnection: AgentConnection = {
        url: 'new-machine.tailnet.ts.net',
        name: 'Tailscale Funnel',
        method: 'tailscale',
      };
      saveAgentConnection(newConnection);
      expect(loadAgentConnection()).toEqual(newConnection);
    });
  });
});
