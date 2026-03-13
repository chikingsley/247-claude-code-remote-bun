/**
 * Logs Command Tests
 *
 * Tests for the logs command that views agent logs.
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
import { EventEmitter } from "events";

// Mock chalk
mock.module("chalk", () => ({
  default: {
    yellow: (s: string) => s,
    red: (s: string) => s,
    dim: (s: string) => s,
  },
}));

// Mock fs
mock.module("fs", () => ({
  existsSync: mock(),
}));

// Mock paths
mock.module("../../../src/lib/paths.js", () => ({
  getAgentPaths: mock(),
}));

// Mock child_process
mock.module("child_process", () => ({
  spawn: mock(),
}));

describe("Logs Command", () => {
  let consoleLogs: string[];
  let consoleErrors: string[];
  let originalConsoleLog: typeof console.log;
  let originalConsoleError: typeof console.error;

  beforeEach(async () => {
    // Capture console output
    consoleLogs = [];
    consoleErrors = [];
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    console.log = mock((...args: any[]) => {
      consoleLogs.push(args.join(" "));
    }) as any;
    console.error = mock((...args: any[]) => {
      consoleErrors.push(args.join(" "));
    }) as any;

    // Clear accumulated mock call counts from previous tests
    const fs = await import("fs");
    (fs.existsSync as ReturnType<typeof mock>).mockClear();
    const cp = await import("child_process");
    (cp.spawn as ReturnType<typeof mock>).mockClear();
    const paths = await import("../../../src/lib/paths.js");
    (paths.getAgentPaths as ReturnType<typeof mock>).mockClear();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  it("shows message when no logs exist", async () => {
    const { existsSync } = await import("fs");
    const { getAgentPaths } = await import("../../../src/lib/paths.js");

    (getAgentPaths as ReturnType<typeof mock>).mockReturnValue({
      logDir: "/home/user/Library/Logs/247-agent",
    } as any);
    (existsSync as ReturnType<typeof mock>).mockReturnValue(false);

    const { logsCommand } = await import("../../../src/commands/logs.js");
    await logsCommand.parseAsync(["node", "logs"]);

    expect(consoleLogs.some((log) => log.includes("No logs found"))).toBe(true);
    expect(consoleLogs.some((log) => log.includes("agent.log"))).toBe(true);
  });

  it("uses error log file when --errors option is set", async () => {
    const { existsSync } = await import("fs");
    const { getAgentPaths } = await import("../../../src/lib/paths.js");
    const { spawn } = await import("child_process");

    (getAgentPaths as ReturnType<typeof mock>).mockReturnValue({
      logDir: "/home/user/Library/Logs/247-agent",
    } as any);
    (existsSync as ReturnType<typeof mock>).mockReturnValue(true);

    const mockTail = new EventEmitter() as any;
    mockTail.kill = mock();
    (spawn as ReturnType<typeof mock>).mockReturnValue(mockTail);

    const { logsCommand } = await import("../../../src/commands/logs.js");
    // Reset Commander option state from previous tests
    logsCommand.setOptionValue("errors", undefined);
    logsCommand.setOptionValue("follow", undefined);
    logsCommand.setOptionValue("lines", "50");
    // Parse without waiting
    logsCommand.parseAsync(["node", "logs", "--errors"]);

    // Wait for spawn to be called
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(spawn).toHaveBeenCalledWith(
      "tail",
      expect.arrayContaining([expect.stringContaining("agent.error.log")]),
      { stdio: "inherit" }
    );
  });

  it("spawns tail with correct arguments", async () => {
    const { existsSync } = await import("fs");
    const { getAgentPaths } = await import("../../../src/lib/paths.js");
    const { spawn } = await import("child_process");

    (getAgentPaths as ReturnType<typeof mock>).mockReturnValue({
      logDir: "/home/user/Library/Logs/247-agent",
    } as any);
    (existsSync as ReturnType<typeof mock>).mockReturnValue(true);

    const mockTail = new EventEmitter() as any;
    mockTail.kill = mock();
    (spawn as ReturnType<typeof mock>).mockReturnValue(mockTail);

    const { logsCommand } = await import("../../../src/commands/logs.js");
    // Reset Commander option state from previous tests
    logsCommand.setOptionValue("errors", undefined);
    logsCommand.setOptionValue("follow", undefined);
    logsCommand.setOptionValue("lines", "50");
    logsCommand.parseAsync(["node", "logs", "-n", "100"]);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(spawn).toHaveBeenCalledWith(
      "tail",
      ["-n", "100", expect.stringContaining("agent.log")],
      { stdio: "inherit" }
    );
  });

  it("spawns tail with -f flag when following", async () => {
    const { existsSync } = await import("fs");
    const { getAgentPaths } = await import("../../../src/lib/paths.js");
    const { spawn } = await import("child_process");

    (getAgentPaths as ReturnType<typeof mock>).mockReturnValue({
      logDir: "/home/user/Library/Logs/247-agent",
    } as any);
    (existsSync as ReturnType<typeof mock>).mockReturnValue(true);

    const mockTail = new EventEmitter() as any;
    mockTail.kill = mock();
    (spawn as ReturnType<typeof mock>).mockReturnValue(mockTail);

    const { logsCommand } = await import("../../../src/commands/logs.js");
    // Reset Commander option state from previous tests
    logsCommand.setOptionValue("errors", undefined);
    logsCommand.setOptionValue("follow", undefined);
    logsCommand.setOptionValue("lines", "50");
    logsCommand.parseAsync(["node", "logs", "--follow"]);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(spawn).toHaveBeenCalledWith("tail", expect.arrayContaining(["-f"]), {
      stdio: "inherit",
    });
  });

  it("handles tail spawn error", async () => {
    const { existsSync } = await import("fs");
    const { getAgentPaths } = await import("../../../src/lib/paths.js");
    const { spawn } = await import("child_process");

    (getAgentPaths as ReturnType<typeof mock>).mockReturnValue({
      logDir: "/home/user/Library/Logs/247-agent",
    } as any);
    (existsSync as ReturnType<typeof mock>).mockReturnValue(true);

    const mockTail = new EventEmitter() as any;
    mockTail.kill = mock();
    (spawn as ReturnType<typeof mock>).mockReturnValue(mockTail);

    // Mock process.exit
    const exitMock = spyOn(process, "exit").mockImplementation(() => {
      throw new Error("exit");
    });

    const { logsCommand } = await import("../../../src/commands/logs.js");
    // Reset Commander option state from previous tests
    logsCommand.setOptionValue("errors", undefined);
    logsCommand.setOptionValue("follow", undefined);
    logsCommand.setOptionValue("lines", "50");
    logsCommand.parseAsync(["node", "logs"]);

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Emit error
    try {
      mockTail.emit("error", new Error("spawn ENOENT"));
    } catch {
      // Expected exit
    }

    expect(
      consoleErrors.some((log) => log.includes("Failed to read logs"))
    ).toBe(true);

    exitMock.mockRestore();
  });

  it("uses default of 50 lines", async () => {
    const { existsSync } = await import("fs");
    const { getAgentPaths } = await import("../../../src/lib/paths.js");
    const { spawn } = await import("child_process");

    (getAgentPaths as ReturnType<typeof mock>).mockReturnValue({
      logDir: "/home/user/Library/Logs/247-agent",
    } as any);
    (existsSync as ReturnType<typeof mock>).mockReturnValue(true);

    const mockTail = new EventEmitter() as any;
    mockTail.kill = mock();
    (spawn as ReturnType<typeof mock>).mockReturnValue(mockTail);

    const { logsCommand } = await import("../../../src/commands/logs.js");
    // Reset Commander option state from previous tests
    logsCommand.setOptionValue("errors", undefined);
    logsCommand.setOptionValue("follow", undefined);
    logsCommand.setOptionValue("lines", "50");
    logsCommand.parseAsync(["node", "logs"]);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(spawn).toHaveBeenCalledWith(
      "tail",
      ["-n", "50", expect.any(String)],
      {
        stdio: "inherit",
      }
    );
  });
});
