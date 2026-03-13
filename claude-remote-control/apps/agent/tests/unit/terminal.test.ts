import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

// Force bash shell for consistent test results
const originalShell = process.env.SHELL;
process.env.SHELL = "/bin/bash";

// Track init script writes for testing
let writtenInitScripts: { path: string; content: string }[] = [];

// Mock fs module for init script handling
mock.module("fs", () => ({
  writeFileSync: mock((path: string, content: string) => {
    writtenInitScripts.push({ path, content });
  }),
  unlinkSync: mock(),
}));

// --- Bun.spawn mock infrastructure ---
// Capture the terminal.data callback from spawnPty options so tests can simulate data events
let capturedTerminalDataCb: ((terminal: any, data: Uint8Array) => void) | null =
  null;
let mockExitResolve: ((code: number) => void) | null = null;

const createMockTerminal = () => ({
  write: mock(),
  resize: mock(),
});

let mockTerminal = createMockTerminal();
let mockKill = mock();

const mockSpawnPty = mock();

// Mock the bun-pty module (Bun global is non-configurable)
mock.module("../../src/lib/bun-pty.js", () => ({
  spawnPty: (...args: any[]) => mockSpawnPty(...args),
}));

// --- child_process / util mocks ---
let execSyncResponses: Record<string, string | Error> = {};
let execAsyncResponses: Record<
  string,
  { stdout: string; stderr: string } | Error
> = {};

// Mock child_process
mock.module("child_process", () => ({
  execSync: mock((cmd: string) => {
    const key = Object.keys(execSyncResponses).find((k) => cmd.includes(k));
    if (key) {
      const response = execSyncResponses[key];
      if (response instanceof Error) {
        throw response;
      }
      return response;
    }
    throw new Error("Command not mocked");
  }),
  exec: mock(
    (
      cmd: string,
      callback?: (error: Error | null, stdout: string, stderr: string) => void
    ) => {
      // If callback provided, call it asynchronously
      if (callback) {
        setImmediate(() => callback(null, "", ""));
      }
    }
  ),
}));

// Mock promisify to return our async mock
mock.module("util", () => ({
  promisify: () => async (cmd: string) => {
    const key = Object.keys(execAsyncResponses).find((k) => cmd.includes(k));
    if (key) {
      const response = execAsyncResponses[key];
      if (response instanceof Error) {
        throw response;
      }
      return response;
    }
    return { stdout: "", stderr: "" };
  },
}));

describe("Terminal", () => {
  beforeEach(() => {
    mockTerminal = createMockTerminal();
    mockKill = mock();
    capturedTerminalDataCb = null;
    mockExitResolve = null;
    execSyncResponses = {};
    execAsyncResponses = {};
    writtenInitScripts = [];

    // Configure mock spawnPty to capture terminal callbacks
    mockSpawnPty.mockImplementation((_cmd: string[], opts: any) => {
      capturedTerminalDataCb = opts?.terminal?.data ?? null;

      const exitPromise = new Promise<number>((resolve) => {
        mockExitResolve = resolve;
      });

      return {
        terminal: mockTerminal,
        kill: mockKill,
        pid: 12_345,
        exited: exitPromise,
      };
    });
  });

  afterEach(() => {
    mock.restore();
  });

  describe("createTerminal", () => {
    it("creates a new tmux session when session does not exist", async () => {
      // Session does not exist
      execSyncResponses["has-session"] = new Error("session not found");

      const { createTerminal } = await import("../../src/terminal.js");
      const terminal = createTerminal("/tmp/test", "test-session");

      expect(terminal).toBeDefined();
      expect(terminal.write).toBeDefined();
      expect(terminal.resize).toBeDefined();
      expect(terminal.kill).toBeDefined();
      expect(terminal.detach).toBeDefined();
      expect(terminal.captureHistory).toBeDefined();
      expect(terminal.isExistingSession()).toBe(false);
    });

    it("attaches to existing tmux session when it exists", async () => {
      // Session exists
      execSyncResponses["has-session"] = "";

      const { createTerminal } = await import("../../src/terminal.js");
      const terminal = createTerminal("/tmp/test", "existing-session");

      expect(terminal.isExistingSession()).toBe(true);
    });

    it("forwards write calls to PTY", async () => {
      execSyncResponses["has-session"] = new Error("not found");

      const { createTerminal } = await import("../../src/terminal.js");
      const terminal = createTerminal("/tmp/test", "write-test");

      terminal.write("hello");
      expect(mockTerminal.write).toHaveBeenCalledWith("hello");
    });

    it("forwards resize calls to PTY", async () => {
      execSyncResponses["has-session"] = new Error("not found");

      const { createTerminal } = await import("../../src/terminal.js");
      const terminal = createTerminal("/tmp/test", "resize-test");

      terminal.resize(120, 40);
      expect(mockTerminal.resize).toHaveBeenCalledWith(120, 40);
    });

    it("sends detach command when detach is called", async () => {
      execSyncResponses["has-session"] = new Error("not found");

      const { createTerminal } = await import("../../src/terminal.js");
      const terminal = createTerminal("/tmp/test", "detach-test");

      terminal.detach();
      // Ctrl+B, d for tmux detach
      expect(mockTerminal.write).toHaveBeenCalledWith("\x02d");
    });

    it("captures history from tmux scrollback", async () => {
      execSyncResponses["has-session"] = new Error("not found");
      execAsyncResponses["capture-pane"] = {
        stdout: "line 1\nline 2\nline 3\n",
        stderr: "",
      };

      const { createTerminal } = await import("../../src/terminal.js");
      const terminal = createTerminal("/tmp/test", "history-test");

      const history = await terminal.captureHistory(100);
      expect(history).toBe("line 1\nline 2\nline 3\n");
    });

    it("returns empty string when history capture fails", async () => {
      execSyncResponses["has-session"] = new Error("not found");
      execAsyncResponses["capture-pane"] = new Error("tmux error");

      const { createTerminal } = await import("../../src/terminal.js");
      const terminal = createTerminal("/tmp/test", "history-error-test");

      const history = await terminal.captureHistory();
      expect(history).toBe("");
    });

    it("registers data callback", async () => {
      execSyncResponses["has-session"] = new Error("not found");

      const { createTerminal } = await import("../../src/terminal.js");
      const terminal = createTerminal("/tmp/test", "data-test");

      const dataCallback = mock();
      terminal.onData(dataCallback);

      // Simulate data from terminal via the captured callback
      expect(capturedTerminalDataCb).not.toBeNull();
      capturedTerminalDataCb!(
        mockTerminal,
        new TextEncoder().encode("test output")
      );
      expect(dataCallback).toHaveBeenCalledWith("test output");
    });

    it("registers exit callback", async () => {
      execSyncResponses["has-session"] = new Error("not found");

      const { createTerminal } = await import("../../src/terminal.js");
      const terminal = createTerminal("/tmp/test", "exit-test");

      const exitCallback = mock();
      terminal.onExit(exitCallback);

      // Simulate exit by resolving the exited promise
      expect(mockExitResolve).not.toBeNull();
      mockExitResolve!(0);

      // Let the promise resolution propagate
      await new Promise((r) => setTimeout(r, 10));

      expect(exitCallback).toHaveBeenCalledWith({ exitCode: 0 });
    });

    it("kills PTY when kill is called", async () => {
      execSyncResponses["has-session"] = new Error("not found");

      const { createTerminal } = await import("../../src/terminal.js");
      const terminal = createTerminal("/tmp/test", "kill-test");

      terminal.kill();
      expect(mockKill).toHaveBeenCalled();
    });

    it("writes init script with env vars for new sessions", async () => {
      execSyncResponses["has-session"] = new Error("not found");

      const { createTerminal } = await import("../../src/terminal.js");
      createTerminal("/tmp/test", "init-script-test", { MY_VAR: "my-value" });

      // Verify init script was written
      expect(writtenInitScripts.length).toBe(1);
      const script = writtenInitScripts[0];

      // Check script path
      expect(script.path).toMatch(/247-init-init-script-test\.sh$/);

      // Check script contains required exports
      expect(script.content).toContain(
        'export CLAUDE_TMUX_SESSION="init-script-test"'
      );
      expect(script.content).toContain('export MY_VAR="my-value"');

      // Check script contains tmux config
      expect(script.content).toContain("tmux set-option");
      expect(script.content).toContain("history-limit 50000");
      expect(script.content).toContain("mouse on");

      // Check script ends with interactive shell
      expect(script.content).toContain("exec bash -i");
    });

    it("does not write init script for existing sessions", async () => {
      // Session exists
      execSyncResponses["has-session"] = "";

      const { createTerminal } = await import("../../src/terminal.js");
      createTerminal("/tmp/test", "existing-session");

      // No init script should be written
      expect(writtenInitScripts.length).toBe(0);
    });

    it("onReady fires immediately for existing sessions", async () => {
      // Session exists
      execSyncResponses["has-session"] = "";

      const { createTerminal } = await import("../../src/terminal.js");
      const terminal = createTerminal("/tmp/test", "existing-ready-test");

      const readyCallback = mock();
      terminal.onReady(readyCallback);

      // Should fire immediately since session already exists
      expect(readyCallback).toHaveBeenCalledTimes(1);
    });

    it("onReady fires after init for new sessions", async () => {
      execSyncResponses["has-session"] = new Error("not found");

      const { createTerminal } = await import("../../src/terminal.js");
      const terminal = createTerminal("/tmp/test", "new-ready-test");

      const readyCallback = mock();
      terminal.onReady(readyCallback);

      // Should NOT fire immediately
      expect(readyCallback).not.toHaveBeenCalled();

      // Wait for setTimeout (150ms for init script)
      await new Promise((r) => setTimeout(r, 200));

      // Should now have fired
      expect(readyCallback).toHaveBeenCalledTimes(1);
    });

    it("onReady fires multiple callbacks for new sessions", async () => {
      execSyncResponses["has-session"] = new Error("not found");

      const { createTerminal } = await import("../../src/terminal.js");
      const terminal = createTerminal("/tmp/test", "multi-ready-test");

      const callback1 = mock();
      const callback2 = mock();
      terminal.onReady(callback1);
      terminal.onReady(callback2);

      // Wait for init to complete (150ms + buffer)
      await new Promise((r) => setTimeout(r, 200));

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it("onReady fires immediately if called after terminal is ready", async () => {
      execSyncResponses["has-session"] = new Error("not found");

      const { createTerminal } = await import("../../src/terminal.js");
      const terminal = createTerminal("/tmp/test", "late-ready-test");

      // Wait for init to complete (150ms + buffer)
      await new Promise((r) => setTimeout(r, 200));

      // Now call onReady after terminal is ready
      const lateCallback = mock();
      terminal.onReady(lateCallback);

      // Should fire immediately since terminal is already ready
      expect(lateCallback).toHaveBeenCalledTimes(1);
    });
  });
});
