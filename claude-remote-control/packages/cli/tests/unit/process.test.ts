import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

// Mock paths module
const mockPaths = {
  configDir: "/mock/.247",
  configPath: "/mock/.247/config.json",
  dataDir: "/mock/.247/data",
  logDir: "/mock/.247/logs",
  pidFile: "/mock/.247/agent.pid",
  agentRoot: "/mock/agent",
  isDev: false,
  nodePath: "/usr/local/bin/node",
};

mock.module("../../src/lib/paths.js", () => ({
  getAgentPaths: () => mockPaths,
  ensureDirectories: mock(),
}));

// Mock config module
mock.module("../../src/lib/config.js", () => ({
  loadConfig: mock(),
}));

// Mock fs module
mock.module("fs", () => ({
  existsSync: mock(),
  readFileSync: mock(),
  writeFileSync: mock(),
  unlinkSync: mock(),
  openSync: mock(() => 3), // Return fake file descriptor
}));

// Mock child_process
mock.module("child_process", () => ({
  spawn: mock(),
}));

// Store original process.kill
const originalKill = process.kill;

describe("CLI Process", () => {
  beforeEach(() => {
    // Re-mock modules for fresh state
    mock.module("fs", () => ({
      existsSync: mock(),
      readFileSync: mock(),
      writeFileSync: mock(),
      unlinkSync: mock(),
      openSync: mock(() => 3),
    }));
    mock.module("../../src/lib/config.js", () => ({
      loadConfig: mock(),
    }));
    mock.module("child_process", () => ({
      spawn: mock(),
    }));
  });

  afterEach(() => {
    // Restore process.kill
    process.kill = originalKill;
  });

  describe("isAgentRunning", () => {
    it("returns false if PID file does not exist", async () => {
      const { existsSync } = await import("fs");
      (existsSync as ReturnType<typeof mock>).mockReturnValue(false);

      const { isAgentRunning } = await import("../../src/lib/process.js");
      const result = isAgentRunning();

      expect(result).toEqual({ running: false });
    });

    it("returns false if PID file contains invalid content", async () => {
      const { existsSync, readFileSync } = await import("fs");
      (existsSync as ReturnType<typeof mock>).mockReturnValue(true);
      (readFileSync as ReturnType<typeof mock>).mockReturnValue("not-a-number");

      const { isAgentRunning } = await import("../../src/lib/process.js");
      const result = isAgentRunning();

      expect(result).toEqual({ running: false });
    });

    it("returns true with PID if process is running", async () => {
      const { existsSync, readFileSync } = await import("fs");
      (existsSync as ReturnType<typeof mock>).mockReturnValue(true);
      (readFileSync as ReturnType<typeof mock>).mockReturnValue("12345");

      // Mock process.kill to succeed (process exists)
      process.kill = mock() as any;

      const { isAgentRunning } = await import("../../src/lib/process.js");
      const result = isAgentRunning();

      expect(result).toEqual({ running: true, pid: 12_345 });
      expect(process.kill).toHaveBeenCalledWith(12_345, 0);
    });

    it("returns false and cleans up stale PID file if process not running", async () => {
      const { existsSync, readFileSync, unlinkSync } = await import("fs");
      (existsSync as ReturnType<typeof mock>).mockReturnValue(true);
      (readFileSync as ReturnType<typeof mock>).mockReturnValue("12345");

      // Mock process.kill to throw (process doesn't exist)
      process.kill = mock(() => {
        throw new Error("ESRCH");
      }) as any;

      const { isAgentRunning } = await import("../../src/lib/process.js");
      const result = isAgentRunning();

      expect(result).toEqual({ running: false });
      expect(unlinkSync).toHaveBeenCalledWith("/mock/.247/agent.pid");
    });
  });

  describe("startAgentDaemon", () => {
    it("returns error if config not found", async () => {
      const { loadConfig } = await import("../../src/lib/config.js");
      (loadConfig as ReturnType<typeof mock>).mockReturnValue(null);

      const { startAgentDaemon } = await import("../../src/lib/process.js");
      const result = await startAgentDaemon();

      expect(result.success).toBe(false);
      expect(result.error).toContain("Configuration not found");
    });

    it("returns error if profile not found", async () => {
      const { loadConfig } = await import("../../src/lib/config.js");
      (loadConfig as ReturnType<typeof mock>).mockReturnValue(null);

      const { startAgentDaemon } = await import("../../src/lib/process.js");
      const result = await startAgentDaemon("nonexistent");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Profile 'nonexistent' not found");
    });

    it("returns error if agent already running", async () => {
      const { existsSync, readFileSync } = await import("fs");
      const { loadConfig } = await import("../../src/lib/config.js");

      (loadConfig as ReturnType<typeof mock>).mockReturnValue({
        machine: { id: "test", name: "Test" },
        projects: { basePath: "~/Dev", whitelist: [] },
        agent: { port: 4678 },
      });

      // PID file exists and process is running
      (existsSync as ReturnType<typeof mock>).mockReturnValue(true);
      (readFileSync as ReturnType<typeof mock>).mockReturnValue("12345");
      process.kill = mock() as any; // Process exists

      const { startAgentDaemon } = await import("../../src/lib/process.js");
      const result = await startAgentDaemon();

      expect(result.success).toBe(false);
      expect(result.error).toContain("already running");
    });

    it("returns error if entry point not found", async () => {
      const { existsSync, readFileSync } = await import("fs");
      const { loadConfig } = await import("../../src/lib/config.js");

      (loadConfig as ReturnType<typeof mock>).mockReturnValue({
        machine: { id: "test", name: "Test" },
        projects: { basePath: "~/Dev", whitelist: [] },
        agent: { port: 4678 },
      });

      // PID file doesn't exist (not running)
      (existsSync as ReturnType<typeof mock>).mockImplementation(
        (path: string) => {
          // Entry point doesn't exist
          return false;
        }
      );

      const { startAgentDaemon } = await import("../../src/lib/process.js");
      const result = await startAgentDaemon();

      expect(result.success).toBe(false);
      expect(result.error).toContain("entry point not found");
    });

    it("spawns agent process with correct options", async () => {
      const { existsSync, readFileSync, writeFileSync } = await import("fs");
      const { loadConfig } = await import("../../src/lib/config.js");
      const { spawn } = await import("child_process");

      (loadConfig as ReturnType<typeof mock>).mockReturnValue({
        machine: { id: "test", name: "Test" },
        projects: { basePath: "~/Dev", whitelist: [] },
        agent: { port: 4678 },
      });

      let callCount = 0;
      (existsSync as ReturnType<typeof mock>).mockImplementation(
        (path: string) => {
          const pathStr = String(path);
          // PID file check (first call) - not running
          if (pathStr.includes("agent.pid")) {
            callCount++;
            // First check: not running, subsequent checks: running (after spawn)
            return callCount > 1;
          }
          // Entry point exists
          if (pathStr.includes("dist/index.js")) {
            return true;
          }
          return false;
        }
      );

      (readFileSync as ReturnType<typeof mock>).mockReturnValue("99999");

      // Mock successful spawn
      const mockChild = {
        pid: 99_999,
        unref: mock(),
      };
      (spawn as ReturnType<typeof mock>).mockReturnValue(mockChild as any);

      // After spawn, process.kill should succeed
      process.kill = mock() as any;

      const { startAgentDaemon } = await import("../../src/lib/process.js");
      const result = await startAgentDaemon();

      expect(spawn).toHaveBeenCalled();
      expect(writeFileSync).toHaveBeenCalledWith(
        "/mock/.247/agent.pid",
        "99999",
        "utf-8"
      );
      expect(mockChild.unref).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.pid).toBe(99_999);
    });
  });

  describe("stopAgent", () => {
    it("returns success if agent not running", async () => {
      const { existsSync } = await import("fs");
      (existsSync as ReturnType<typeof mock>).mockReturnValue(false);

      const { stopAgent } = await import("../../src/lib/process.js");
      const result = stopAgent();

      expect(result.success).toBe(true);
    });

    it("sends SIGTERM to running agent", async () => {
      const { existsSync, readFileSync, unlinkSync } = await import("fs");

      (existsSync as ReturnType<typeof mock>).mockReturnValue(true);
      (readFileSync as ReturnType<typeof mock>).mockReturnValue("12345");

      let killCallCount = 0;
      process.kill = mock((pid: number, signal?: string | number) => {
        killCallCount++;
        // First call (signal 0 check in isAgentRunning) - process exists
        // Second call (SIGTERM) - succeeds
        // Third call (signal 0 check in loop) - process gone
        if (killCallCount >= 3) {
          throw new Error("ESRCH");
        }
      }) as any;

      const { stopAgent } = await import("../../src/lib/process.js");
      const result = stopAgent();

      expect(result.success).toBe(true);
      expect(process.kill).toHaveBeenCalledWith(12_345, "SIGTERM");
      expect(unlinkSync).toHaveBeenCalledWith("/mock/.247/agent.pid");
    });

    it("returns error if kill fails", async () => {
      const { existsSync, readFileSync } = await import("fs");

      (existsSync as ReturnType<typeof mock>).mockReturnValue(true);
      (readFileSync as ReturnType<typeof mock>).mockReturnValue("12345");

      let killCallCount = 0;
      process.kill = mock((pid: number, signal?: string | number) => {
        killCallCount++;
        // First call (signal 0 check) - process exists
        if (killCallCount === 1) {
          return true;
        }
        // Second call (SIGTERM) - permission denied
        throw new Error("EPERM: operation not permitted");
      }) as any;

      const { stopAgent } = await import("../../src/lib/process.js");
      const result = stopAgent();

      expect(result.success).toBe(false);
      expect(result.error).toContain("EPERM");
    });
  });

  describe("getAgentHealth", () => {
    it("returns healthy with session count on success", async () => {
      const mockFetch = mock(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: "1" }, { id: "2" }]),
        })
      );
      global.fetch = mockFetch as any;

      const { getAgentHealth } = await import("../../src/lib/process.js");
      const result = await getAgentHealth(4678);

      expect(result).toEqual({ healthy: true, sessions: 2 });
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:4678/api/sessions"
      );
    });

    it("returns unhealthy on HTTP error", async () => {
      const mockFetch = mock(() =>
        Promise.resolve({
          ok: false,
          status: 500,
        })
      );
      global.fetch = mockFetch as any;

      const { getAgentHealth } = await import("../../src/lib/process.js");
      const result = await getAgentHealth(4678);

      expect(result).toEqual({ healthy: false, error: "HTTP 500" });
    });

    it("returns unhealthy on network error", async () => {
      const mockFetch = mock(() =>
        Promise.reject(new Error("Connection refused"))
      );
      global.fetch = mockFetch as any;

      const { getAgentHealth } = await import("../../src/lib/process.js");
      const result = await getAgentHealth(4678);

      expect(result).toEqual({ healthy: false, error: "Connection refused" });
    });
  });

  describe("restartAgent", () => {
    it("stops and starts the agent", async () => {
      const { existsSync, readFileSync, writeFileSync } = await import("fs");
      const { loadConfig } = await import("../../src/lib/config.js");
      const { spawn } = await import("child_process");

      (loadConfig as ReturnType<typeof mock>).mockReturnValue({
        machine: { id: "test", name: "Test" },
        projects: { basePath: "~/Dev", whitelist: [] },
        agent: { port: 4678 },
      });

      // Track state: initially running, then stopped, then running again
      let agentState = "running";
      let callCount = 0;

      (existsSync as ReturnType<typeof mock>).mockImplementation(
        (path: string) => {
          const pathStr = String(path);
          if (pathStr.includes("agent.pid")) {
            return agentState !== "stopped";
          }
          if (pathStr.includes("dist/index.js")) {
            return true;
          }
          return false;
        }
      );

      (readFileSync as ReturnType<typeof mock>).mockReturnValue("12345");

      // Mock process.kill for stop and status checks
      process.kill = mock((pid: number, signal?: string | number) => {
        callCount++;
        if (agentState === "stopped") {
          throw new Error("ESRCH");
        }
        if (signal === "SIGTERM") {
          agentState = "stopped";
        }
      }) as any;

      // Mock spawn for start
      const mockChild = {
        pid: 99_999,
        unref: mock(),
      };
      (spawn as ReturnType<typeof mock>).mockImplementation(() => {
        // After spawn, mark as running
        setTimeout(() => {
          agentState = "running";
        }, 0);
        return mockChild as any;
      });

      // After spawn completes, update state
      (readFileSync as ReturnType<typeof mock>).mockImplementation(() => {
        if (agentState === "running" && callCount > 2) {
          return "99999";
        }
        return "12345";
      });

      const { restartAgent } = await import("../../src/lib/process.js");
      const result = await restartAgent();

      expect(process.kill).toHaveBeenCalledWith(12_345, "SIGTERM");
      expect(spawn).toHaveBeenCalled();
    });
  });
});
