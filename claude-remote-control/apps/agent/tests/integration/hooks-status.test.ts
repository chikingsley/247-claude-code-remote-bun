import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { EventEmitter } from 'events';

// Mock config
vi.mock('../../config.json', () => ({
  default: {
    machine: { id: 'test-machine', name: 'Test Machine' },
    projects: {
      basePath: '/tmp/test-projects',
      whitelist: [],
    },
    editor: {
      enabled: false,
      portRange: { start: 4680, end: 4699 },
      idleTimeout: 60000,
    },
    dashboard: {
      apiUrl: 'http://localhost:3001/api',
      apiKey: 'test-key',
    },
  },
}));

// Mock dependencies
vi.mock('fs/promises', () => ({
  readdir: vi.fn().mockResolvedValue([]),
  access: vi.fn().mockRejectedValue(new Error('ENOENT')),
  rm: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('child_process', () => ({
  exec: vi.fn((cmd, opts, cb) => {
    const callback = typeof opts === 'function' ? opts : cb;
    if (callback) callback(null, { stdout: '', stderr: '' });
  }),
  execSync: vi.fn(() => ''),
  spawn: vi.fn(() => {
    const proc = new EventEmitter() as any;
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    proc.kill = vi.fn();
    proc.pid = 12345;
    return proc;
  }),
}));

vi.mock('@homebridge/node-pty-prebuilt-multiarch', () => ({
  spawn: vi.fn(() => {
    const proc = new EventEmitter() as any;
    proc.write = vi.fn();
    proc.resize = vi.fn();
    proc.kill = vi.fn();
    proc.onData = (cb: any) => proc.on('data', cb);
    proc.onExit = (cb: any) => proc.on('exit', cb);
    return proc;
  }),
}));

vi.mock('../../src/terminal.js', () => ({
  createTerminal: vi.fn(() => ({
    write: vi.fn(),
    resize: vi.fn(),
    onData: vi.fn(),
    onExit: vi.fn(),
    kill: vi.fn(),
    detach: vi.fn(),
    captureHistory: vi.fn().mockResolvedValue(''),
    isExistingSession: vi.fn().mockReturnValue(false),
  })),
}));

vi.mock('../../src/editor.js', () => ({
  initEditor: vi.fn(),
  getOrStartEditor: vi.fn(),
  stopEditor: vi.fn(),
  getEditorStatus: vi.fn().mockReturnValue({ running: false }),
  getAllEditors: vi.fn().mockReturnValue([]),
  updateEditorActivity: vi.fn(),
  shutdownAllEditors: vi.fn(),
}));

describe('Hooks Status API', () => {
  let server: any;

  beforeAll(async () => {
    const { createServer } = await import('../../src/server.js');
    server = createServer();
  });

  afterAll(() => {
    if (server?.close) {
      server.close();
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/hooks/status', () => {
    it('accepts SessionStart event', async () => {
      const res = await request(server)
        .post('/api/hooks/status')
        .send({
          event: 'SessionStart',
          session_id: 'test-session-123',
          tmux_session: 'project--brave-lion-42',
          project: 'project',
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ received: true });
    });

    it('accepts PreToolUse event', async () => {
      const res = await request(server)
        .post('/api/hooks/status')
        .send({
          event: 'PreToolUse',
          session_id: 'test-session-123',
          tmux_session: 'project--brave-lion-42',
          tool_name: 'Bash',
          project: 'project',
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ received: true });
    });

    it('accepts PostToolUse event', async () => {
      const res = await request(server)
        .post('/api/hooks/status')
        .send({
          event: 'PostToolUse',
          session_id: 'test-session-123',
          tmux_session: 'project--brave-lion-42',
          tool_name: 'Bash',
          project: 'project',
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ received: true });
    });

    it('accepts PermissionRequest event', async () => {
      const res = await request(server)
        .post('/api/hooks/status')
        .send({
          event: 'PermissionRequest',
          session_id: 'test-session-123',
          tmux_session: 'project--brave-lion-42',
          tool_name: 'Bash',
          project: 'project',
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ received: true });
    });

    it('accepts Stop event', async () => {
      const res = await request(server)
        .post('/api/hooks/status')
        .send({
          event: 'Stop',
          session_id: 'test-session-123',
          tmux_session: 'project--brave-lion-42',
          stop_reason: 'end_turn',
          project: 'project',
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ received: true });
    });

    it('accepts SessionEnd event', async () => {
      const res = await request(server)
        .post('/api/hooks/status')
        .send({
          event: 'SessionEnd',
          session_id: 'test-session-123',
          tmux_session: 'project--brave-lion-42',
          project: 'project',
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ received: true });
    });

    it('accepts Notification event', async () => {
      const res = await request(server)
        .post('/api/hooks/status')
        .send({
          event: 'Notification',
          notification_type: 'idle_prompt',
          session_id: 'test-session-123',
          tmux_session: 'project--brave-lion-42',
          project: 'project',
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ received: true });
    });

    it('rejects request without event', async () => {
      const res = await request(server)
        .post('/api/hooks/status')
        .send({
          session_id: 'test-session-123',
          project: 'project',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Missing event');
    });

    it('accepts event with timestamp', async () => {
      const timestamp = Date.now();
      const res = await request(server)
        .post('/api/hooks/status')
        .send({
          event: 'PreToolUse',
          session_id: 'test-session-123',
          tmux_session: 'project--brave-lion-42',
          tool_name: 'Read',
          timestamp,
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ received: true });
    });

    it('accepts event without tmux_session (with warning)', async () => {
      const res = await request(server)
        .post('/api/hooks/status')
        .send({
          event: 'Stop',
          session_id: 'test-session-123',
          project: 'project',
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ received: true });
    });

    it('handles unknown event types gracefully', async () => {
      const res = await request(server)
        .post('/api/hooks/status')
        .send({
          event: 'UnknownEvent',
          session_id: 'test-session-123',
          tmux_session: 'project--brave-lion-42',
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ received: true });
    });
  });

  describe('Hook status lifecycle', () => {
    it('tracks full session lifecycle', async () => {
      const sessionId = 'lifecycle-test';
      const tmuxSession = 'project--lifecycle-test-1';

      // 1. Session start
      await request(server)
        .post('/api/hooks/status')
        .send({
          event: 'SessionStart',
          session_id: sessionId,
          tmux_session: tmuxSession,
          project: 'project',
        });

      // 2. Tool use
      await request(server)
        .post('/api/hooks/status')
        .send({
          event: 'PreToolUse',
          session_id: sessionId,
          tmux_session: tmuxSession,
          tool_name: 'Bash',
        });

      // 3. Tool complete
      await request(server)
        .post('/api/hooks/status')
        .send({
          event: 'PostToolUse',
          session_id: sessionId,
          tmux_session: tmuxSession,
          tool_name: 'Bash',
        });

      // 4. Stop (waiting for input)
      await request(server)
        .post('/api/hooks/status')
        .send({
          event: 'Stop',
          session_id: sessionId,
          tmux_session: tmuxSession,
          stop_reason: 'end_turn',
        });

      // 5. Session end
      const res = await request(server)
        .post('/api/hooks/status')
        .send({
          event: 'SessionEnd',
          session_id: sessionId,
          tmux_session: tmuxSession,
        });

      expect(res.status).toBe(200);
    });

    it('handles permission request flow', async () => {
      const sessionId = 'permission-test';
      const tmuxSession = 'project--permission-test-1';

      // 1. Tool requires permission
      await request(server)
        .post('/api/hooks/status')
        .send({
          event: 'PreToolUse',
          session_id: sessionId,
          tmux_session: tmuxSession,
          tool_name: 'Bash',
        });

      // 2. Permission requested
      await request(server)
        .post('/api/hooks/status')
        .send({
          event: 'PermissionRequest',
          session_id: sessionId,
          tmux_session: tmuxSession,
          tool_name: 'Bash',
        });

      // 3. Permission granted, tool executes
      await request(server)
        .post('/api/hooks/status')
        .send({
          event: 'PostToolUse',
          session_id: sessionId,
          tmux_session: tmuxSession,
          tool_name: 'Bash',
        });

      // All requests should succeed
      const res = await request(server)
        .post('/api/hooks/status')
        .send({
          event: 'Stop',
          session_id: sessionId,
          tmux_session: tmuxSession,
        });

      expect(res.status).toBe(200);
    });
  });
});
