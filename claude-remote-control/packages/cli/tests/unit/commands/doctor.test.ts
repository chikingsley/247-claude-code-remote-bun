/**
 * Doctor Command Tests
 *
 * Tests for the doctor command that diagnoses 247 installation issues.
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

// Mock fs
mock.module("fs", () => ({
  existsSync: mock(),
}));

// Mock prerequisites
mock.module("../../../src/lib/prerequisites.js", () => ({
  checkRuntime: mock(),
  checkTmux: mock(),
  checkBun: mock(),
}));

// Mock config
mock.module("../../../src/lib/config.js", () => ({
  configExists: mock(),
  loadConfig: mock(),
}));

// Mock process
mock.module("../../../src/lib/process.js", () => ({
  isAgentRunning: mock(),
  getAgentHealth: mock(),
}));

// Mock service manager
mock.module("../../../src/service/index.js", () => ({
  createServiceManager: mock(),
}));

// Mock paths
mock.module("../../../src/lib/paths.js", () => ({
  getAgentPaths: mock(),
}));

// Mock hooks
mock.module("../../../src/lib/hooks.js", () => ({
  getHooksStatus: mock(),
}));

// Mock net module
const createMockServer = (portAvailable = true) => {
  return {
    once: mock((event: string, callback: () => void) => {
      // Simulate immediate callback
      if (event === "listening" && portAvailable) {
        setTimeout(() => callback(), 0);
      } else if (event === "error" && !portAvailable) {
        setTimeout(() => callback(), 0);
      }
    }),
    listen: mock(),
    close: mock(),
  };
};

mock.module("net", () => ({
  createServer: mock(() => createMockServer(true)),
}));

describe("Doctor Command", () => {
  let consoleLogs: string[];
  let originalConsoleLog: typeof console.log;
  let exitMock: ReturnType<typeof spyOn>;

  beforeEach(() => {
    // Capture console output
    consoleLogs = [];
    originalConsoleLog = console.log;
    console.log = mock((...args: any[]) => {
      consoleLogs.push(args.join(" "));
    }) as any;

    // Mock process.exit
    exitMock = spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    exitMock.mockRestore();
  });

  const setupAllMocks = async (overrides: Record<string, any> = {}) => {
    const { checkRuntime, checkTmux, checkBun } = await import(
      "../../../src/lib/prerequisites.js"
    );
    const { configExists, loadConfig } = await import(
      "../../../src/lib/config.js"
    );
    const { isAgentRunning, getAgentHealth } = await import(
      "../../../src/lib/process.js"
    );
    const { createServiceManager } = await import(
      "../../../src/service/index.js"
    );
    const { getAgentPaths } = await import("../../../src/lib/paths.js");
    const { getHooksStatus } = await import("../../../src/lib/hooks.js");
    const { existsSync } = await import("fs");

    // Default all passing scenario
    (checkRuntime as ReturnType<typeof mock>).mockReturnValue({
      name: "Runtime",
      status: "ok",
      message: "Bun 1.3.9",
      required: true,
    });

    (checkTmux as ReturnType<typeof mock>).mockReturnValue({
      name: "tmux",
      status: "ok",
      message: "tmux 3.4",
      required: true,
    });

    (checkBun as ReturnType<typeof mock>).mockReturnValue({
      name: "Bun",
      status: "ok",
      message: "1.3.9",
      required: true,
    });

    (configExists as ReturnType<typeof mock>).mockReturnValue(true);
    (loadConfig as ReturnType<typeof mock>).mockReturnValue({
      machine: { id: "test-id", name: "Test Machine" },
      agent: { port: 4678 },
      projects: { basePath: "/test/projects", whitelist: [] },
      editor: { enabled: false },
    } as any);

    (isAgentRunning as ReturnType<typeof mock>).mockReturnValue({
      running: true,
      pid: 12_345,
    });
    (getAgentHealth as ReturnType<typeof mock>).mockResolvedValue({
      healthy: true,
      sessions: 2,
    });

    (createServiceManager as ReturnType<typeof mock>).mockReturnValue({
      platform: "launchd",
      status: mock(() =>
        Promise.resolve({
          installed: true,
          running: true,
          enabled: true,
        })
      ),
      install: mock(),
      uninstall: mock(),
      start: mock(),
      stop: mock(),
    } as any);

    (getAgentPaths as ReturnType<typeof mock>).mockReturnValue({
      configDir: "/home/user/.247",
      logDir: "/home/user/Library/Logs/247-agent",
    } as any);

    (getHooksStatus as ReturnType<typeof mock>).mockReturnValue({
      installed: true,
      version: "2.25.0",
      path: "/home/user/.247/hooks/notify-247.sh",
      settingsConfigured: true,
      needsUpdate: false,
      packagedVersion: "2.25.0",
    });

    (existsSync as ReturnType<typeof mock>).mockReturnValue(true);

    // Apply overrides
    if (overrides.checkRuntime) {
      (checkRuntime as ReturnType<typeof mock>).mockReturnValue(
        overrides.checkRuntime
      );
    }
    if (overrides.checkTmux) {
      (checkTmux as ReturnType<typeof mock>).mockReturnValue(
        overrides.checkTmux
      );
    }
    if (overrides.checkBun) {
      (checkBun as ReturnType<typeof mock>).mockReturnValue(overrides.checkBun);
    }
    if (overrides.configExists !== undefined) {
      (configExists as ReturnType<typeof mock>).mockReturnValue(
        overrides.configExists
      );
    }
    if (overrides.loadConfig !== undefined) {
      (loadConfig as ReturnType<typeof mock>).mockReturnValue(
        overrides.loadConfig
      );
    }
    if (overrides.isAgentRunning) {
      (isAgentRunning as ReturnType<typeof mock>).mockReturnValue(
        overrides.isAgentRunning
      );
    }
    if (overrides.getAgentHealth) {
      (getAgentHealth as ReturnType<typeof mock>).mockResolvedValue(
        overrides.getAgentHealth
      );
    }
    if (overrides.serviceStatus) {
      (createServiceManager as ReturnType<typeof mock>).mockReturnValue({
        platform: "launchd",
        status: mock(() => Promise.resolve(overrides.serviceStatus)),
        install: mock(),
        uninstall: mock(),
        start: mock(),
        stop: mock(),
      } as any);
    }
    if (overrides.existsSync !== undefined) {
      (existsSync as ReturnType<typeof mock>).mockReturnValue(
        overrides.existsSync
      );
    }
    if (overrides.hooksStatus) {
      (getHooksStatus as ReturnType<typeof mock>).mockReturnValue(
        overrides.hooksStatus
      );
    }

    // Setup net mock for port availability check (only runs when agent not running)
    const net = await import("net");
    (net.createServer as ReturnType<typeof mock>).mockReturnValue(
      createMockServer(overrides.portAvailable !== false) as any
    );
  };

  it("shows all checks passing", async () => {
    await setupAllMocks();

    const { doctorCommand } = await import("../../../src/commands/doctor.js");
    await doctorCommand.parseAsync(["node", "doctor"]);

    expect(consoleLogs.some((log) => log.includes("Runtime"))).toBe(true);
    expect(consoleLogs.some((log) => log.includes("tmux"))).toBe(true);
    expect(consoleLogs.some((log) => log.includes("All checks passed"))).toBe(
      true
    );
  });

  it("shows runtime check failure", async () => {
    await setupAllMocks({
      checkRuntime: {
        name: "Runtime",
        status: "error",
        message: "Node.js v16.0.0 (required: >=18)",
        required: true,
      },
    });

    const { doctorCommand } = await import("../../../src/commands/doctor.js");

    try {
      await doctorCommand.parseAsync(["node", "doctor"]);
    } catch {
      // Expected process.exit
    }

    expect(consoleLogs.some((log) => log.includes("Runtime"))).toBe(true);
    expect(consoleLogs.some((log) => log.includes("failures"))).toBe(true);
  });

  it("shows tmux check failure with install hint", async () => {
    await setupAllMocks({
      checkTmux: {
        name: "tmux",
        status: "error",
        message: "Not installed",
        required: true,
      },
    });

    const { doctorCommand } = await import("../../../src/commands/doctor.js");

    try {
      await doctorCommand.parseAsync(["node", "doctor"]);
    } catch {
      // Expected process.exit
    }

    expect(consoleLogs.some((log) => log.includes("tmux"))).toBe(true);
    expect(
      consoleLogs.some((log) => log.includes("brew") || log.includes("apt"))
    ).toBe(true);
  });

  it("shows configuration not found", async () => {
    await setupAllMocks({
      configExists: false,
    });

    const { doctorCommand } = await import("../../../src/commands/doctor.js");

    try {
      await doctorCommand.parseAsync(["node", "doctor"]);
    } catch {
      // Expected process.exit
    }

    expect(consoleLogs.some((log) => log.includes("Not configured"))).toBe(
      true
    );
    expect(consoleLogs.some((log) => log.includes("247 init"))).toBe(true);
  });

  it("shows invalid configuration", async () => {
    await setupAllMocks({
      loadConfig: null,
    });

    const { doctorCommand } = await import("../../../src/commands/doctor.js");

    try {
      await doctorCommand.parseAsync(["node", "doctor"]);
    } catch {
      // Expected process.exit
    }

    expect(consoleLogs.some((log) => log.includes("invalid"))).toBe(true);
  });

  it("shows agent not running warning", async () => {
    await setupAllMocks({
      isAgentRunning: { running: false },
    });

    const { doctorCommand } = await import("../../../src/commands/doctor.js");
    await doctorCommand.parseAsync(["node", "doctor"]);

    expect(consoleLogs.some((log) => log.includes("Not running"))).toBe(true);
    expect(consoleLogs.some((log) => log.includes("247 start"))).toBe(true);
  });

  it("shows agent health warning when not responding", async () => {
    await setupAllMocks({
      getAgentHealth: {
        healthy: false,
        error: "Connection refused",
      },
    });

    const { doctorCommand } = await import("../../../src/commands/doctor.js");
    await doctorCommand.parseAsync(["node", "doctor"]);

    expect(consoleLogs.some((log) => log.includes("Not responding"))).toBe(
      true
    );
    expect(consoleLogs.some((log) => log.includes("restart"))).toBe(true);
  });

  it("shows service not installed warning", async () => {
    await setupAllMocks({
      serviceStatus: {
        installed: false,
        running: false,
        enabled: false,
      },
    });

    const { doctorCommand } = await import("../../../src/commands/doctor.js");
    await doctorCommand.parseAsync(["node", "doctor"]);

    expect(consoleLogs.some((log) => log.includes("Service"))).toBe(true);
    expect(consoleLogs.some((log) => log.includes("247 service install"))).toBe(
      true
    );
  });

  it("shows service installed but not running", async () => {
    await setupAllMocks({
      serviceStatus: {
        installed: true,
        running: false,
        enabled: false,
      },
    });

    const { doctorCommand } = await import("../../../src/commands/doctor.js");
    await doctorCommand.parseAsync(["node", "doctor"]);

    expect(consoleLogs.some((log) => log.includes("not running"))).toBe(true);
    expect(consoleLogs.some((log) => log.includes("247 service start"))).toBe(
      true
    );
  });

  it("shows missing config directory warning", async () => {
    const { existsSync } = await import("fs");
    await setupAllMocks();
    (existsSync as ReturnType<typeof mock>).mockImplementation(
      (path: string) => {
        return !(
          String(path).includes("configDir") || String(path).includes(".247")
        );
      }
    );

    const { doctorCommand } = await import("../../../src/commands/doctor.js");
    await doctorCommand.parseAsync(["node", "doctor"]);

    expect(consoleLogs.some((log) => log.includes("Missing"))).toBe(true);
  });

  it("shows summary with pass, warn, fail counts", async () => {
    await setupAllMocks();

    const { doctorCommand } = await import("../../../src/commands/doctor.js");
    await doctorCommand.parseAsync(["node", "doctor"]);

    expect(consoleLogs.some((log) => log.includes("Summary"))).toBe(true);
    expect(consoleLogs.some((log) => log.includes("passed"))).toBe(true);
  });

  it("exits with code 1 when there are failures", async () => {
    await setupAllMocks({
      checkRuntime: {
        name: "Runtime",
        status: "error",
        message: "Node.js v16.0.0 (required: >=18)",
        required: true,
      },
    });

    const { doctorCommand } = await import("../../../src/commands/doctor.js");

    try {
      await doctorCommand.parseAsync(["node", "doctor"]);
    } catch (e) {
      expect((e as Error).message).toBe("process.exit");
    }

    expect(exitMock).toHaveBeenCalledWith(1);
  });

  it("shows warnings message when only warnings exist", async () => {
    await setupAllMocks({
      isAgentRunning: { running: false },
    });

    // Make sure no failures occur
    const { configExists, loadConfig } = await import(
      "../../../src/lib/config.js"
    );
    (configExists as ReturnType<typeof mock>).mockReturnValue(true);
    (loadConfig as ReturnType<typeof mock>).mockReturnValue({
      machine: { id: "test-id", name: "Test" },
      agent: { port: 4678 },
      projects: { basePath: "/test", whitelist: [] },
    } as any);

    const { doctorCommand } = await import("../../../src/commands/doctor.js");
    await doctorCommand.parseAsync(["node", "doctor"]);

    expect(consoleLogs.some((log) => log.includes("warnings"))).toBe(true);
  });
});
