/**
 * Integration tests for `247 start` and `247 stop` command workflows
 */
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test";
import {
  type CapturedOutput,
  captureConsole,
  createMockChild,
  createMockFsState,
  createProcessKillMock,
  type MockFsState,
  mockPaths,
  setupAgentEntryPoint,
  setupDefaultDirectories,
  setupExistingConfig,
  setupHooksSource,
  validConfig,
} from "../helpers/mock-system.js";

// ============= MOCK SETUP =============

let fsState: MockFsState;
let runningPids: Set<number>;
let output: CapturedOutput;
let processExitSpy: ReturnType<typeof spyOn>;
const originalKill = process.kill;

// Mock paths module
mock.module("../../src/lib/paths.js", () => ({
  getAgentPaths: () => mockPaths,
  ensureDirectories: mock(),
}));

// Mock fs module
mock.module("fs", () => ({
  existsSync: mock(
    (path: string) => fsState?.files.has(path) || fsState?.directories.has(path)
  ),
  readFileSync: mock((path: string) => {
    const content = fsState?.files.get(path);
    if (content === undefined) {
      throw new Error("ENOENT");
    }
    return content;
  }),
  writeFileSync: mock((path: string, content: string) => {
    fsState?.files.set(path, content);
  }),
  mkdirSync: mock((path: string) => {
    fsState?.directories.add(path);
  }),
  unlinkSync: mock((path: string) => {
    fsState?.files.delete(path);
  }),
  readdirSync: mock(() => []),
  openSync: mock(() => 3),
}));

// Mock child_process
mock.module("child_process", () => ({
  spawn: mock(),
  execSync: mock(() => "tmux 3.4"),
}));

// Mock ora - capture messages to output
mock.module("ora", () => ({
  default: mock(() => {
    const spinner = {
      text: "",
      start: mock(function (this: any, text?: string) {
        if (text) {
          this.text = text;
        }
        return this;
      }),
      stop: mock(function (this: any) {
        return this;
      }),
      succeed: mock(function (this: any, text?: string) {
        console.log(text || this.text);
        return this;
      }),
      fail: mock(function (this: any, text?: string) {
        console.log(text || this.text);
        return this;
      }),
      warn: mock(function (this: any, text?: string) {
        console.log(text || this.text);
        return this;
      }),
      info: mock(function (this: any) {
        return this;
      }),
    };
    return spinner;
  }),
}));

// Mock chalk
mock.module("chalk", () => ({
  default: {
    red: (s: string) => s,
    green: (s: string) => s,
    yellow: (s: string) => s,
    blue: (s: string) => s,
    cyan: (s: string) => s,
    dim: (s: string) => s,
  },
}));

// Mock net module for port checking
mock.module("net", () => {
  return {
    createServer: mock(() => {
      const listeners: Record<string, Array<() => void>> = {};
      return {
        listen: mock(function (this: any, _port: number, _host: string) {
          setImmediate(() => {
            listeners["listening"]?.forEach((cb) => cb());
          });
          return this;
        }),
        close: mock(),
        once: mock(function (this: any, event: string, callback: () => void) {
          if (!listeners[event]) {
            listeners[event] = [];
          }
          listeners[event].push(callback);
          return this;
        }),
      };
    }),
  };
});

// ============= TESTS =============

/**
 * Reset Commander option state on command singletons.
 * Commander retains parsed option values between parseAsync calls,
 * so we must clear them before each test.
 */
async function resetStartCommand() {
  const { startCommand } = await import("../../src/commands/start.js");
  startCommand.setOptionValue("foreground", undefined);
  startCommand.setOptionValue("profile", undefined);
}

describe("247 start workflow", () => {
  beforeEach(async () => {
    // Reset state
    fsState = createMockFsState();
    runningPids = new Set();
    setupDefaultDirectories(fsState);
    setupAgentEntryPoint(fsState);
    setupHooksSource(fsState);
    output = captureConsole();

    // Mock process.kill
    process.kill = createProcessKillMock(runningPids) as any;

    // Mock process.exit
    processExitSpy = spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });

    // Reset Commander option state from previous tests
    await resetStartCommand();
  });

  afterEach(() => {
    mock.restore();
    process.kill = originalKill;
  });

  describe("without configuration", () => {
    it("exits with error and suggests running init", async () => {
      // No config file exists

      const { startCommand } = await import("../../src/commands/start.js");

      await expect(
        startCommand.parseAsync(["node", "247", "start"])
      ).rejects.toThrow("process.exit(1)");

      expect(output.logs.some((l) => l.includes("247 init"))).toBe(true);
    });

    it("shows profile-specific error when profile not found", async () => {
      // Default config exists but not the requested profile
      setupExistingConfig(fsState);

      const { startCommand } = await import("../../src/commands/start.js");

      await expect(
        startCommand.parseAsync([
          "node",
          "247",
          "start",
          "--profile",
          "nonexistent",
        ])
      ).rejects.toThrow("process.exit(1)");

      expect(output.logs.some((l) => l.includes("nonexistent"))).toBe(true);
    });
  });

  describe("with configuration", () => {
    beforeEach(() => {
      setupExistingConfig(fsState);
    });

    it("warns if agent is already running", async () => {
      // Agent is already running
      fsState.files.set(mockPaths.pidFile, "12345");
      runningPids.add(12_345);

      const { startCommand } = await import("../../src/commands/start.js");
      await startCommand.parseAsync(["node", "247", "start"]);

      expect(output.logs.some((l) => l.includes("already running"))).toBe(true);
      expect(output.logs.some((l) => l.includes("12345"))).toBe(true);
    });

    it("spawns agent as daemon and writes PID file", async () => {
      const { spawn } = await import("child_process");

      // Create mock child process
      const mockChild = createMockChild({ pid: 99_999 });
      (spawn as ReturnType<typeof mock>).mockReturnValue(mockChild as any);

      // After spawn, mark PID as running
      runningPids.add(99_999);

      const { startCommand } = await import("../../src/commands/start.js");
      await startCommand.parseAsync(["node", "247", "start"]);

      // Verify spawn was called
      expect(spawn).toHaveBeenCalled();

      // Verify PID file was written
      expect(fsState.files.get(mockPaths.pidFile)).toBe("99999");

      // Verify unref was called (detached process)
      expect(mockChild.unref).toHaveBeenCalled();
    });

    it("exits with error if agent entry point is missing", async () => {
      // Remove agent entry point
      fsState.files.delete("/mock/agent/dist/index.js");

      const { startCommand } = await import("../../src/commands/start.js");

      await expect(
        startCommand.parseAsync(["node", "247", "start"])
      ).rejects.toThrow("process.exit(1)");

      expect(
        output.logs.some(
          (l) => l.includes("entry point") || l.includes("not found")
        )
      ).toBe(true);
    });

    it("loads profile config when --profile is specified", async () => {
      // Create profile config
      const profileConfig = { ...validConfig, agent: { port: 5000 } };
      fsState.files.set(
        `${mockPaths.profilesDir}/dev.json`,
        JSON.stringify(profileConfig)
      );

      const { spawn } = await import("child_process");
      const mockChild = createMockChild({ pid: 88_888 });
      (spawn as ReturnType<typeof mock>).mockReturnValue(mockChild as any);
      runningPids.add(88_888);

      const { startCommand } = await import("../../src/commands/start.js");
      await startCommand.parseAsync([
        "node",
        "247",
        "start",
        "--profile",
        "dev",
      ]);

      // Should start successfully
      expect(spawn).toHaveBeenCalled();
    });
  });
});

describe("247 stop workflow", () => {
  beforeEach(() => {
    // Reset state
    fsState = createMockFsState();
    runningPids = new Set();
    setupDefaultDirectories(fsState);
    output = captureConsole();

    // Mock process.kill
    process.kill = createProcessKillMock(runningPids) as any;

    // Mock process.exit
    processExitSpy = spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
  });

  afterEach(() => {
    mock.restore();
    process.kill = originalKill;
  });

  describe("when agent is not running", () => {
    it("shows info message and returns successfully", async () => {
      // No PID file exists

      const { stopCommand } = await import("../../src/commands/stop.js");
      await stopCommand.parseAsync(["node", "247", "stop"]);

      expect(output.logs.some((l) => l.includes("not running"))).toBe(true);
      // Should not throw
    });
  });

  describe("when agent is running", () => {
    beforeEach(() => {
      fsState.files.set(mockPaths.pidFile, "12345");
      runningPids.add(12_345);
    });

    it("sends SIGTERM and removes PID file", async () => {
      const { stopCommand } = await import("../../src/commands/stop.js");
      await stopCommand.parseAsync(["node", "247", "stop"]);

      // Process should have been killed
      expect(process.kill).toHaveBeenCalledWith(12_345, "SIGTERM");

      // PID file should be removed
      expect(fsState.files.has(mockPaths.pidFile)).toBe(false);
    });

    it("cleans up stale PID file if process does not exist", async () => {
      // Process doesn't actually exist (stale PID)
      runningPids.delete(12_345);

      const { stopCommand } = await import("../../src/commands/stop.js");
      await stopCommand.parseAsync(["node", "247", "stop"]);

      // PID file should be cleaned up
      expect(fsState.files.has(mockPaths.pidFile)).toBe(false);
    });
  });
});
