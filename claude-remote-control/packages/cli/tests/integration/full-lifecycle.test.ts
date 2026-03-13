/**
 * Full lifecycle integration test: init -> start -> stop
 *
 * This test verifies the complete user journey works end-to-end.
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
  setupHooksSource,
} from "../helpers/mock-system.js";

// ============= MOCK SETUP =============

let fsState: MockFsState;
let runningPids: Set<number>;
let promptResponses: unknown[];
let output: CapturedOutput;
let processExitSpy: ReturnType<typeof spyOn>;
const originalKill = process.kill;

// Mock paths module
mock.module("../../src/lib/paths.js", () => ({
  getAgentPaths: () => mockPaths,
  ensureDirectories: mock(() => {
    fsState.directories.add(mockPaths.configDir);
    fsState.directories.add(mockPaths.profilesDir);
    fsState.directories.add(mockPaths.dataDir);
    fsState.directories.add(mockPaths.logDir);
  }),
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
  lstatSync: mock(() => ({ isSymbolicLink: () => false })),
  rmSync: mock(),
  copyFileSync: mock(),
  symlinkSync: mock(),
  openSync: mock(() => 3),
}));

// Mock crypto
mock.module("crypto", () => ({
  randomUUID: () => "lifecycle-test-uuid",
}));

// Mock child_process
mock.module("child_process", () => ({
  spawn: mock(),
  execSync: mock(() => "tmux 3.4"),
}));

// Mock os
mock.module("os", () => ({
  hostname: () => "test-hostname",
  platform: () => "darwin",
  homedir: () => "/mock",
}));

// Mock enquirer
mock.module("enquirer", () => ({
  default: {
    prompt: mock(() => Promise.resolve(promptResponses.shift())),
  },
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

describe("full 247 lifecycle", () => {
  beforeEach(() => {
    // Reset state
    fsState = createMockFsState();
    runningPids = new Set();
    promptResponses = [];
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
  });

  afterEach(() => {
    mock.restore();
    process.kill = originalKill;
  });

  it("init -> start -> stop workflow completes successfully", async () => {
    // ============= STEP 1: INIT =============

    promptResponses = [
      { machineName: "lifecycle-test-machine" },
      { projectsPath: "~/Dev" },
    ];

    const { initCommand } = await import("../../src/commands/init.js");
    await initCommand.parseAsync(["node", "247", "init"]);

    // Verify: config was created
    expect(fsState.files.has(mockPaths.configPath)).toBe(true);
    const savedConfig = JSON.parse(fsState.files.get(mockPaths.configPath)!);
    expect(savedConfig.machine.name).toBe("lifecycle-test-machine");
    expect(savedConfig.machine.id).toBe("lifecycle-test-uuid");

    // ============= STEP 2: START =============

    const { spawn } = await import("child_process");
    const mockChild = createMockChild({ pid: 55_555 });
    (spawn as ReturnType<typeof mock>).mockReturnValue(mockChild as any);

    // Mark process as running after spawn
    runningPids.add(55_555);

    const { startCommand } = await import("../../src/commands/start.js");
    await startCommand.parseAsync(["node", "247", "start"]);

    // Verify: agent was spawned and PID file was created
    expect(spawn).toHaveBeenCalled();
    expect(fsState.files.get(mockPaths.pidFile)).toBe("55555");
    expect(runningPids.has(55_555)).toBe(true);
    expect(mockChild.unref).toHaveBeenCalled();

    // ============= STEP 3: STOP =============

    const { stopCommand } = await import("../../src/commands/stop.js");
    await stopCommand.parseAsync(["node", "247", "stop"]);

    // Verify: process was stopped and PID file was removed
    expect(process.kill).toHaveBeenCalledWith(55_555, "SIGTERM");
    expect(runningPids.has(55_555)).toBe(false);
    expect(fsState.files.has(mockPaths.pidFile)).toBe(false);
  });

  it("start fails gracefully before init", async () => {
    // Try to start without running init first

    const { startCommand } = await import("../../src/commands/start.js");

    await expect(
      startCommand.parseAsync(["node", "247", "start"])
    ).rejects.toThrow("process.exit(1)");

    // Should suggest running init
    expect(output.logs.some((l) => l.includes("247 init"))).toBe(true);
  });

  it("stop succeeds even when not running", async () => {
    // Stop when nothing is running

    const { stopCommand } = await import("../../src/commands/stop.js");
    await stopCommand.parseAsync(["node", "247", "stop"]);

    // Should complete without error
    expect(output.logs.some((l) => l.includes("not running"))).toBe(true);
  });

  it("start after stop works correctly", async () => {
    // Setup: init first
    promptResponses = [
      { machineName: "restart-test" },
      { projectsPath: "~/Dev" },
    ];

    const { initCommand } = await import("../../src/commands/init.js");
    await initCommand.parseAsync(["node", "247", "init"]);

    // First start
    const { spawn } = await import("child_process");
    let mockChild = createMockChild({ pid: 11_111 });
    (spawn as ReturnType<typeof mock>).mockReturnValue(mockChild as any);
    runningPids.add(11_111);

    let { startCommand } = await import("../../src/commands/start.js");
    await startCommand.parseAsync(["node", "247", "start"]);

    expect(fsState.files.get(mockPaths.pidFile)).toBe("11111");

    // Stop
    const { stopCommand } = await import("../../src/commands/stop.js");
    await stopCommand.parseAsync(["node", "247", "stop"]);

    expect(fsState.files.has(mockPaths.pidFile)).toBe(false);

    // Second start with new PID
    const { spawn: spawn2 } = await import("child_process");
    mockChild = createMockChild({ pid: 22_222 });
    (spawn2 as ReturnType<typeof mock>).mockReturnValue(mockChild as any);
    runningPids.add(22_222);

    ({ startCommand } = await import("../../src/commands/start.js"));
    await startCommand.parseAsync(["node", "247", "start"]);

    expect(fsState.files.get(mockPaths.pidFile)).toBe("22222");
    expect(runningPids.has(22_222)).toBe(true);
  });
});
