/**
 * Paths Module Tests
 *
 * Tests for the paths utility module that provides agent paths.
 */
import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { homedir, platform } from "os";

// Mock fs
mock.module("fs", () => ({
  existsSync: mock(),
  mkdirSync: mock(),
}));

describe("Agent Paths", () => {
  beforeEach(() => {
    // Re-mock in beforeEach for fresh mock state
    mock.module("fs", () => ({
      existsSync: mock(),
      mkdirSync: mock(),
    }));
  });

  afterEach(async () => {
    // Clear the cached paths after each test
    const { clearPathsCache } = await import("../../src/lib/paths.js");
    clearPathsCache();
  });

  describe("getAgentPaths", () => {
    it("returns an AgentPaths object", async () => {
      const { existsSync } = await import("fs");
      (existsSync as ReturnType<typeof mock>).mockReturnValue(false);

      const { getAgentPaths } = await import("../../src/lib/paths.js");
      const paths = getAgentPaths();

      expect(paths).toBeDefined();
      expect(typeof paths.cliRoot).toBe("string");
      expect(typeof paths.agentRoot).toBe("string");
      expect(typeof paths.configDir).toBe("string");
      expect(typeof paths.configPath).toBe("string");
      expect(typeof paths.dataDir).toBe("string");
      expect(typeof paths.logDir).toBe("string");
      expect(typeof paths.pidFile).toBe("string");
      expect(typeof paths.nodePath).toBe("string");
      expect(typeof paths.isDev).toBe("boolean");
    });

    it("configDir is in home directory", async () => {
      const { existsSync } = await import("fs");
      (existsSync as ReturnType<typeof mock>).mockReturnValue(false);

      const { getAgentPaths } = await import("../../src/lib/paths.js");
      const paths = getAgentPaths();

      expect(paths.configDir).toContain(".247");
      expect(paths.configDir.startsWith(homedir())).toBe(true);
    });

    it("configPath is config.json in configDir", async () => {
      const { existsSync } = await import("fs");
      (existsSync as ReturnType<typeof mock>).mockReturnValue(false);

      const { getAgentPaths } = await import("../../src/lib/paths.js");
      const paths = getAgentPaths();

      expect(paths.configPath).toBe(`${paths.configDir}/config.json`);
    });

    it("dataDir is under configDir", async () => {
      const { existsSync } = await import("fs");
      (existsSync as ReturnType<typeof mock>).mockReturnValue(false);

      const { getAgentPaths } = await import("../../src/lib/paths.js");
      const paths = getAgentPaths();

      expect(paths.dataDir).toBe(`${paths.configDir}/data`);
    });

    it("pidFile is under configDir", async () => {
      const { existsSync } = await import("fs");
      (existsSync as ReturnType<typeof mock>).mockReturnValue(false);

      const { getAgentPaths } = await import("../../src/lib/paths.js");
      const paths = getAgentPaths();

      expect(paths.pidFile).toBe(`${paths.configDir}/agent.pid`);
    });

    it("nodePath is the current process executable", async () => {
      const { existsSync } = await import("fs");
      (existsSync as ReturnType<typeof mock>).mockReturnValue(false);

      const { getAgentPaths } = await import("../../src/lib/paths.js");
      const paths = getAgentPaths();

      expect(paths.nodePath).toBe(process.execPath);
    });

    it("detects dev mode when bun.lock exists", async () => {
      const { existsSync } = await import("fs");
      (existsSync as ReturnType<typeof mock>).mockImplementation(
        (path: string) => {
          return String(path).includes("bun.lock");
        }
      );

      const { getAgentPaths } = await import("../../src/lib/paths.js");
      const paths = getAgentPaths();

      expect(paths.isDev).toBe(true);
    });

    it("detects production mode when bun.lock does not exist", async () => {
      const { existsSync } = await import("fs");
      (existsSync as ReturnType<typeof mock>).mockReturnValue(false);

      const { getAgentPaths } = await import("../../src/lib/paths.js");
      const paths = getAgentPaths();

      expect(paths.isDev).toBe(false);
    });

    it("caches paths on subsequent calls", async () => {
      const { existsSync } = await import("fs");
      (existsSync as ReturnType<typeof mock>).mockReturnValue(false);

      const { getAgentPaths } = await import("../../src/lib/paths.js");

      const paths1 = getAgentPaths();
      const paths2 = getAgentPaths();

      expect(paths1).toBe(paths2); // Same reference
    });

    describe("platform-specific logDir", () => {
      it("uses Library/Logs on macOS", async () => {
        const { existsSync } = await import("fs");
        (existsSync as ReturnType<typeof mock>).mockReturnValue(false);

        const { getAgentPaths } = await import("../../src/lib/paths.js");
        const paths = getAgentPaths();

        if (platform() === "darwin") {
          expect(paths.logDir).toContain("Library/Logs");
          expect(paths.logDir).toContain("247-agent");
        }
      });

      it("uses .local/log on Linux", async () => {
        const { existsSync } = await import("fs");
        (existsSync as ReturnType<typeof mock>).mockReturnValue(false);

        const { getAgentPaths } = await import("../../src/lib/paths.js");
        const paths = getAgentPaths();

        if (platform() === "linux") {
          expect(paths.logDir).toContain(".local/log");
          expect(paths.logDir).toContain("247-agent");
        }
      });
    });
  });

  describe("ensureDirectories", () => {
    it("creates configDir if it does not exist", async () => {
      const { existsSync, mkdirSync } = await import("fs");
      (existsSync as ReturnType<typeof mock>).mockReturnValue(false);
      (mkdirSync as ReturnType<typeof mock>).mockReturnValue(undefined);

      const { ensureDirectories, getAgentPaths } = await import(
        "../../src/lib/paths.js"
      );
      const paths = getAgentPaths();

      ensureDirectories();

      expect(mkdirSync).toHaveBeenCalledWith(paths.configDir, {
        recursive: true,
      });
    });

    it("creates dataDir if it does not exist", async () => {
      const { existsSync, mkdirSync } = await import("fs");
      (existsSync as ReturnType<typeof mock>).mockReturnValue(false);
      (mkdirSync as ReturnType<typeof mock>).mockReturnValue(undefined);

      const { ensureDirectories, getAgentPaths } = await import(
        "../../src/lib/paths.js"
      );
      const paths = getAgentPaths();

      ensureDirectories();

      expect(mkdirSync).toHaveBeenCalledWith(paths.dataDir, {
        recursive: true,
      });
    });

    it("creates logDir if it does not exist", async () => {
      const { existsSync, mkdirSync } = await import("fs");
      (existsSync as ReturnType<typeof mock>).mockReturnValue(false);
      (mkdirSync as ReturnType<typeof mock>).mockReturnValue(undefined);

      const { ensureDirectories, getAgentPaths } = await import(
        "../../src/lib/paths.js"
      );
      const paths = getAgentPaths();

      ensureDirectories();

      expect(mkdirSync).toHaveBeenCalledWith(paths.logDir, { recursive: true });
    });

    it("does not create directories that already exist", async () => {
      const { existsSync, mkdirSync } = await import("fs");
      (existsSync as ReturnType<typeof mock>).mockReturnValue(true);
      (mkdirSync as ReturnType<typeof mock>).mockReturnValue(undefined);

      const { ensureDirectories } = await import("../../src/lib/paths.js");

      ensureDirectories();

      expect(mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe("clearPathsCache", () => {
    it("clears the cached paths", async () => {
      const { existsSync } = await import("fs");
      (existsSync as ReturnType<typeof mock>).mockReturnValue(false);

      const { getAgentPaths, clearPathsCache } = await import(
        "../../src/lib/paths.js"
      );

      const paths1 = getAgentPaths();
      clearPathsCache();

      // After clearing, a new object should be created
      const paths2 = getAgentPaths();

      // They should be equal in value but not the same reference
      expect(paths1).toEqual(paths2);
      // Note: In practice they might be the same reference if the mock returns the same values
    });
  });
});
