/**
 * Heartbeat Monitor tests
 * Tests for timeout behavior - transitions to 'idle' when no heartbeat for 3s
 * Note: The Notification hook handles 'needs_attention' cases (permission requests)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the dependencies before importing the module
vi.mock('../../src/routes/heartbeat.js', () => ({
  lastHeartbeat: new Map<string, number>(),
}));

vi.mock('../../src/status.js', () => ({
  tmuxSessionStatus: new Map(),
  broadcastStatusUpdate: vi.fn(),
}));

vi.mock('../../src/db/sessions.js', () => ({
  upsertSession: vi.fn().mockReturnValue({ created_at: Date.now() }),
  getSession: vi.fn().mockReturnValue({ created_at: Date.now() }),
}));

vi.mock('../../src/db/environments.js', () => ({
  getSessionEnvironment: vi.fn().mockReturnValue(null),
  getEnvironmentMetadata: vi.fn().mockReturnValue(null),
}));

describe('Heartbeat Monitor - Idle Transition', () => {
  let lastHeartbeat: Map<string, number>;
  let tmuxSessionStatus: Map<string, any>;
  let broadcastStatusUpdate: ReturnType<typeof vi.fn>;
  let upsertSession: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Get mocked modules
    const heartbeatModule = await import('../../src/routes/heartbeat.js');
    const statusModule = await import('../../src/status.js');
    const sessionsDbModule = await import('../../src/db/sessions.js');

    lastHeartbeat = heartbeatModule.lastHeartbeat;
    tmuxSessionStatus = statusModule.tmuxSessionStatus as Map<string, any>;
    broadcastStatusUpdate = statusModule.broadcastStatusUpdate as ReturnType<typeof vi.fn>;
    upsertSession = sessionsDbModule.upsertSession as ReturnType<typeof vi.fn>;

    // Clear maps
    lastHeartbeat.clear();
    tmuxSessionStatus.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('transitions from working to idle after timeout regardless of hasBeenWorking', async () => {
    const sessionName = 'project--test-session-42';
    const now = Date.now();

    // Set up a "working" session that HAS been working (received heartbeats)
    lastHeartbeat.set(sessionName, now);
    tmuxSessionStatus.set(sessionName, {
      status: 'working',
      hasBeenWorking: true, // Session has been working
      lastEvent: 'Heartbeat',
      lastActivity: now,
      lastStatusChange: now,
      project: 'project',
    });

    // Import and start the monitor
    const { startHeartbeatMonitor, stopHeartbeatMonitor } =
      await import('../../src/heartbeat-monitor.js');

    startHeartbeatMonitor();

    // Advance time past the timeout (3 seconds + 1 second check interval)
    vi.advanceTimersByTime(4000);

    // Status should transition to 'idle' after timeout
    // Note: 'needs_attention' is handled by Notification hook, not timeout
    const updatedStatus = tmuxSessionStatus.get(sessionName);
    expect(updatedStatus?.status).toBe('idle');
    expect(updatedStatus?.lastEvent).toBe('HeartbeatTimeout');

    // Database should have been updated
    expect(upsertSession).toHaveBeenCalledWith(
      sessionName,
      expect.objectContaining({
        status: 'idle',
        lastEvent: 'HeartbeatTimeout',
      })
    );

    // Broadcast should have been sent
    expect(broadcastStatusUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: sessionName,
        status: 'idle',
        lastEvent: 'HeartbeatTimeout',
      })
    );

    stopHeartbeatMonitor();
  });

  it('does NOT transition from needs_attention to idle (only working -> idle)', async () => {
    const sessionName = 'project--attention-session-42';
    const now = Date.now();

    // Set up a "needs_attention" session (waiting for permission)
    // This should NOT transition to idle - user needs to respond
    lastHeartbeat.set(sessionName, now);
    tmuxSessionStatus.set(sessionName, {
      status: 'needs_attention',
      attentionReason: 'permission',
      hasBeenWorking: true,
      lastEvent: 'Permission: Write',
      lastActivity: now,
      lastStatusChange: now,
      project: 'project',
    });

    // Import and start the monitor
    const { startHeartbeatMonitor, stopHeartbeatMonitor } =
      await import('../../src/heartbeat-monitor.js');

    startHeartbeatMonitor();

    // Advance time past the timeout (3 seconds + 1 second check interval)
    vi.advanceTimersByTime(4000);

    // Status should remain 'needs_attention' - only working -> idle is allowed
    const updatedStatus = tmuxSessionStatus.get(sessionName);
    expect(updatedStatus?.status).toBe('needs_attention');
    expect(updatedStatus?.attentionReason).toBe('permission');

    // Database should NOT have been updated
    expect(upsertSession).not.toHaveBeenCalled();

    // No broadcast should have been sent
    expect(broadcastStatusUpdate).not.toHaveBeenCalled();

    stopHeartbeatMonitor();
  });

  it('does not transition if session is not in working status', async () => {
    const sessionName = 'project--idle-session';
    const now = Date.now();

    // Set up an "init" session (not working)
    lastHeartbeat.set(sessionName, now - 5000); // Old heartbeat
    tmuxSessionStatus.set(sessionName, {
      status: 'init',
      lastEvent: 'SessionCreated',
      lastActivity: now,
      lastStatusChange: now,
      project: 'project',
    });

    const { startHeartbeatMonitor, stopHeartbeatMonitor } =
      await import('../../src/heartbeat-monitor.js');

    startHeartbeatMonitor();
    vi.advanceTimersByTime(4000);

    // Status should remain 'init'
    const updatedStatus = tmuxSessionStatus.get(sessionName);
    expect(updatedStatus?.status).toBe('init');

    stopHeartbeatMonitor();
  });

  it('does not transition if heartbeat is recent', async () => {
    const sessionName = 'project--active-session';
    const now = Date.now();

    // Set up a "working" session with recent heartbeat
    lastHeartbeat.set(sessionName, now);
    tmuxSessionStatus.set(sessionName, {
      status: 'working',
      lastEvent: 'Heartbeat',
      lastActivity: now,
      lastStatusChange: now,
      project: 'project',
    });

    const { startHeartbeatMonitor, stopHeartbeatMonitor } =
      await import('../../src/heartbeat-monitor.js');

    startHeartbeatMonitor();

    // Advance time but not past timeout (only 2 seconds)
    vi.advanceTimersByTime(2000);

    // Status should still be 'working'
    const updatedStatus = tmuxSessionStatus.get(sessionName);
    expect(updatedStatus?.status).toBe('working');

    stopHeartbeatMonitor();
  });

  it('preserves session metrics when transitioning to idle', async () => {
    const sessionName = 'project--metrics-session';
    const now = Date.now();

    // Set up a "working" session with metrics
    lastHeartbeat.set(sessionName, now);
    tmuxSessionStatus.set(sessionName, {
      status: 'working',
      hasBeenWorking: true,
      lastEvent: 'Heartbeat',
      lastActivity: now,
      lastStatusChange: now,
      project: 'project',
      model: 'Claude 3 Opus',
      costUsd: 0.5,
      contextUsage: 25,
      linesAdded: 100,
      linesRemoved: 50,
    });

    const { startHeartbeatMonitor, stopHeartbeatMonitor } =
      await import('../../src/heartbeat-monitor.js');

    startHeartbeatMonitor();
    vi.advanceTimersByTime(4000);

    // Verify metrics are preserved in broadcast
    expect(broadcastStatusUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'idle',
        model: 'Claude 3 Opus',
        costUsd: 0.5,
        contextUsage: 25,
        linesAdded: 100,
        linesRemoved: 50,
      })
    );

    stopHeartbeatMonitor();
  });
});
