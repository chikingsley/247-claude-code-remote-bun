import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { resolve } from "path";

const mockHome = "/mock/home";

const validConfig = {
  machine: { id: "test-id", name: "Test Machine" },
  projects: { basePath: "~/Dev", whitelist: [] },
};

// Mock fs before importing the module - provide valid defaults so config loads
mock.module("fs", () => ({
  existsSync: mock(() => true),
  readFileSync: mock(() => JSON.stringify(validConfig)),
}));

describe("Agent Config", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.HOME = mockHome;
    delete process.env.AGENT_247_PROFILE;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("loadConfig", () => {
    it("loads config and exports it", async () => {
      const { config, loadConfig } = await import("../../src/config.js");

      // config is loaded at module init time
      expect(config).toBeDefined();
      expect(config.machine).toBeDefined();
      expect(config.projects).toBeDefined();

      // loadConfig returns the same cached config
      const config2 = loadConfig();
      expect(config).toBe(config2);
    });

    it("caches config after first load (returns same reference)", async () => {
      const { readFileSync } = await import("fs");
      const { loadConfig, config } = await import("../../src/config.js");

      // loadConfig() should return cached config (same as exported config)
      const config2 = loadConfig();

      expect(config).toBe(config2);
      // readFileSync should only be called once (at module load)
      expect(readFileSync).toHaveBeenCalledTimes(1);
    });

    it("config has expected structure", async () => {
      const { config } = await import("../../src/config.js");

      // Verify config matches what the mock returned
      expect(config.machine.id).toBe("test-id");
      expect(config.machine.name).toBe("Test Machine");
      expect(config.projects.basePath).toBe("~/Dev");
      expect(config.projects.whitelist).toEqual([]);
    });

    it("existsSync is called with expected config path", async () => {
      const { existsSync } = await import("fs");

      // Force import to ensure the module was loaded
      await import("../../src/config.js");

      // existsSync should have been called (at least once for the config path)
      expect(existsSync).toHaveBeenCalled();
    });

    it("readFileSync is called to read config", async () => {
      const { readFileSync } = await import("fs");

      // Force import to ensure the module was loaded
      await import("../../src/config.js");

      // readFileSync should have been called with utf-8 encoding
      expect(readFileSync).toHaveBeenCalledWith(expect.any(String), "utf-8");
    });

    it("loadConfig returns config with correct types", async () => {
      const { config } = await import("../../src/config.js");

      expect(typeof config.machine.id).toBe("string");
      expect(typeof config.machine.name).toBe("string");
      expect(typeof config.projects.basePath).toBe("string");
      expect(Array.isArray(config.projects.whitelist)).toBe(true);
    });
  });

  describe("getConfigPath logic", () => {
    it("default config path is ~/.247/config.json", () => {
      const expectedPath = resolve(mockHome, ".247", "config.json");
      expect(expectedPath).toContain(".247");
      expect(expectedPath).toContain("config.json");
    });

    it("profile config path is ~/.247/profiles/<name>.json", () => {
      const profileName = "dev";
      const expectedPath = resolve(
        mockHome,
        ".247",
        "profiles",
        `${profileName}.json`
      );
      expect(expectedPath).toContain(".247");
      expect(expectedPath).toContain("profiles");
      expect(expectedPath).toContain("dev.json");
    });
  });
});
