/**
 * Status Command Tests
 *
 * Tests for the status command that shows agent status.
 */
import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

// Mock chalk
mock.module("chalk", () => ({
  default: {
    bold: (s: string) => s,
    red: (s: string) => s,
    green: (s: string) => s,
    yellow: (s: string) => s,
    dim: (s: string) => s,
  },
}));

// Mock config
mock.module("../../../src/lib/config.js", () => ({
  loadConfig: mock(),
  configExists: mock(),
}));

// Mock paths
mock.module("../../../src/lib/paths.js", () => ({
  getAgentPaths: mock(),
}));

// Mock process
mock.module("../../../src/lib/process.js", () => ({
  isAgentRunning: mock(),
  getAgentHealth: mock(),
}));

describe("Status Command", () => {
  let consoleLogs: string[];
  let originalConsoleLog: typeof console.log;

  beforeEach(() => {
    // Capture console.log output
    consoleLogs = [];
    originalConsoleLog = console.log;
    console.log = mock((...args: any[]) => {
      consoleLogs.push(args.join(" "));
    }) as any;
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  it("shows not configured message when config does not exist", async () => {
    const { configExists } = await import("../../../src/lib/config.js");
    (configExists as ReturnType<typeof mock>).mockReturnValue(false);

    const { statusCommand } = await import("../../../src/commands/status.js");
    await statusCommand.parseAsync(["node", "status"]);

    expect(consoleLogs.some((log) => log.includes("Not configured"))).toBe(
      true
    );
    expect(consoleLogs.some((log) => log.includes("247 init"))).toBe(true);
  });

  it("shows error when config fails to load", async () => {
    const { configExists, loadConfig } = await import(
      "../../../src/lib/config.js"
    );
    (configExists as ReturnType<typeof mock>).mockReturnValue(true);
    (loadConfig as ReturnType<typeof mock>).mockReturnValue(null);

    const { statusCommand } = await import("../../../src/commands/status.js");
    await statusCommand.parseAsync(["node", "status"]);

    expect(
      consoleLogs.some((log) => log.includes("Failed to load configuration"))
    ).toBe(true);
  });

  it("shows process status as running with PID", async () => {
    const { configExists, loadConfig } = await import(
      "../../../src/lib/config.js"
    );
    const { getAgentPaths } = await import("../../../src/lib/paths.js");
    const { isAgentRunning, getAgentHealth } = await import(
      "../../../src/lib/process.js"
    );

    (configExists as ReturnType<typeof mock>).mockReturnValue(true);
    (loadConfig as ReturnType<typeof mock>).mockReturnValue({
      machine: { id: "test-id", name: "Test Machine" },
      agent: { port: 4678 },
      projects: { basePath: "/test/projects", whitelist: [] },
      editor: { enabled: false },
    } as any);
    (getAgentPaths as ReturnType<typeof mock>).mockReturnValue({
      configPath: "/test/.247/config.json",
    } as any);
    (isAgentRunning as ReturnType<typeof mock>).mockReturnValue({
      running: true,
      pid: 12_345,
    });
    (getAgentHealth as ReturnType<typeof mock>).mockResolvedValue({
      healthy: true,
      sessions: 3,
    });

    const { statusCommand } = await import("../../../src/commands/status.js");
    await statusCommand.parseAsync(["node", "status"]);

    expect(consoleLogs.some((log) => log.includes("Running"))).toBe(true);
    expect(consoleLogs.some((log) => log.includes("12345"))).toBe(true);
    expect(consoleLogs.some((log) => log.includes("Sessions: 3"))).toBe(true);
  });

  it("shows process status as stopped", async () => {
    const { configExists, loadConfig } = await import(
      "../../../src/lib/config.js"
    );
    const { getAgentPaths } = await import("../../../src/lib/paths.js");
    const { isAgentRunning } = await import("../../../src/lib/process.js");

    (configExists as ReturnType<typeof mock>).mockReturnValue(true);
    (loadConfig as ReturnType<typeof mock>).mockReturnValue({
      machine: { id: "test-id", name: "Test Machine" },
      agent: { port: 4678 },
      projects: { basePath: "/test/projects", whitelist: [] },
      editor: { enabled: false },
    } as any);
    (getAgentPaths as ReturnType<typeof mock>).mockReturnValue({
      configPath: "/test/.247/config.json",
    } as any);
    (isAgentRunning as ReturnType<typeof mock>).mockReturnValue({
      running: false,
    });

    const { statusCommand } = await import("../../../src/commands/status.js");
    await statusCommand.parseAsync(["node", "status"]);

    expect(consoleLogs.some((log) => log.includes("Stopped"))).toBe(true);
  });

  it("shows warning when agent is not responding", async () => {
    const { configExists, loadConfig } = await import(
      "../../../src/lib/config.js"
    );
    const { getAgentPaths } = await import("../../../src/lib/paths.js");
    const { isAgentRunning, getAgentHealth } = await import(
      "../../../src/lib/process.js"
    );

    (configExists as ReturnType<typeof mock>).mockReturnValue(true);
    (loadConfig as ReturnType<typeof mock>).mockReturnValue({
      machine: { id: "test-id", name: "Test Machine" },
      agent: { port: 4678 },
      projects: { basePath: "/test/projects", whitelist: [] },
      editor: { enabled: false },
    } as any);
    (getAgentPaths as ReturnType<typeof mock>).mockReturnValue({
      configPath: "/test/.247/config.json",
    } as any);
    (isAgentRunning as ReturnType<typeof mock>).mockReturnValue({
      running: true,
      pid: 12_345,
    });
    (getAgentHealth as ReturnType<typeof mock>).mockResolvedValue({
      healthy: false,
      error: "Connection refused",
    });

    const { statusCommand } = await import("../../../src/commands/status.js");
    await statusCommand.parseAsync(["node", "status"]);

    expect(consoleLogs.some((log) => log.includes("Warning"))).toBe(true);
    expect(consoleLogs.some((log) => log.includes("not responding"))).toBe(
      true
    );
  });

  it("shows configuration info", async () => {
    const { configExists, loadConfig } = await import(
      "../../../src/lib/config.js"
    );
    const { getAgentPaths } = await import("../../../src/lib/paths.js");
    const { isAgentRunning } = await import("../../../src/lib/process.js");

    (configExists as ReturnType<typeof mock>).mockReturnValue(true);
    (loadConfig as ReturnType<typeof mock>).mockReturnValue({
      machine: { id: "test-id", name: "Test Machine" },
      agent: { port: 4678 },
      projects: { basePath: "/test/projects", whitelist: [] },
      editor: { enabled: false },
    } as any);
    (getAgentPaths as ReturnType<typeof mock>).mockReturnValue({
      configPath: "/home/user/.247/config.json",
    } as any);
    (isAgentRunning as ReturnType<typeof mock>).mockReturnValue({
      running: false,
    });

    const { statusCommand } = await import("../../../src/commands/status.js");
    await statusCommand.parseAsync(["node", "status"]);

    expect(
      consoleLogs.some((log) => log.includes("Machine: Test Machine"))
    ).toBe(true);
    expect(consoleLogs.some((log) => log.includes("Port: 4678"))).toBe(true);
    expect(consoleLogs.some((log) => log.includes("/test/projects"))).toBe(
      true
    );
  });
});
