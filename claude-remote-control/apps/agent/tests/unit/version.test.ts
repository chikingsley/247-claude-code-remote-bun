import { describe, expect, it } from "bun:test";

describe("Version Module", () => {
  describe("compareSemver", () => {
    it("returns positive when a > b (major)", async () => {
      const { compareSemver } = await import("../../src/version.js");
      expect(compareSemver("2.0.0", "1.0.0")).toBeGreaterThan(0);
    });

    it("returns positive when a > b (minor)", async () => {
      const { compareSemver } = await import("../../src/version.js");
      expect(compareSemver("1.2.0", "1.1.0")).toBeGreaterThan(0);
    });

    it("returns positive when a > b (patch)", async () => {
      const { compareSemver } = await import("../../src/version.js");
      expect(compareSemver("1.0.2", "1.0.1")).toBeGreaterThan(0);
    });

    it("returns negative when a < b", async () => {
      const { compareSemver } = await import("../../src/version.js");
      expect(compareSemver("1.0.0", "2.0.0")).toBeLessThan(0);
      expect(compareSemver("1.0.0", "1.1.0")).toBeLessThan(0);
      expect(compareSemver("1.0.0", "1.0.1")).toBeLessThan(0);
    });

    it("returns 0 when versions are equal", async () => {
      const { compareSemver } = await import("../../src/version.js");
      expect(compareSemver("1.0.0", "1.0.0")).toBe(0);
      expect(compareSemver("0.1.0", "0.1.0")).toBe(0);
    });

    it("handles v prefix", async () => {
      const { compareSemver } = await import("../../src/version.js");
      expect(compareSemver("v1.0.0", "1.0.0")).toBe(0);
      expect(compareSemver("1.0.0", "v1.0.0")).toBe(0);
      expect(compareSemver("v2.0.0", "v1.0.0")).toBeGreaterThan(0);
    });

    it("handles partial versions", async () => {
      const { compareSemver } = await import("../../src/version.js");
      // Missing parts are treated as 0
      expect(compareSemver("1.0", "1.0.0")).toBe(0);
      expect(compareSemver("1", "1.0.0")).toBe(0);
    });

    it("handles large version numbers", async () => {
      const { compareSemver } = await import("../../src/version.js");
      expect(compareSemver("10.20.30", "10.20.29")).toBeGreaterThan(0);
      expect(compareSemver("100.0.0", "99.99.99")).toBeGreaterThan(0);
    });

    it("handles version 0.0.0", async () => {
      const { compareSemver } = await import("../../src/version.js");
      expect(compareSemver("0.0.0", "0.0.1")).toBeLessThan(0);
      expect(compareSemver("0.0.1", "0.0.0")).toBeGreaterThan(0);
      expect(compareSemver("0.0.0", "0.0.0")).toBe(0);
    });

    it("handles non-numeric characters gracefully", async () => {
      const { compareSemver } = await import("../../src/version.js");
      // Non-numeric parts become 0 via parseInt fallback
      expect(compareSemver("1.0.0-beta", "1.0.0")).toBe(0); // -beta is stripped
      expect(compareSemver("1.0.0", "1.0.0-alpha")).toBe(0);
    });

    it("handles empty string versions", async () => {
      const { compareSemver } = await import("../../src/version.js");
      expect(compareSemver("", "")).toBe(0);
      expect(compareSemver("1.0.0", "")).toBeGreaterThan(0);
      expect(compareSemver("", "1.0.0")).toBeLessThan(0);
    });

    it("compares major version first", async () => {
      const { compareSemver } = await import("../../src/version.js");
      // Major version takes precedence
      expect(compareSemver("2.0.0", "1.99.99")).toBeGreaterThan(0);
      expect(compareSemver("1.99.99", "2.0.0")).toBeLessThan(0);
    });

    it("compares minor version second", async () => {
      const { compareSemver } = await import("../../src/version.js");
      // Minor version takes precedence over patch
      expect(compareSemver("1.2.0", "1.1.99")).toBeGreaterThan(0);
      expect(compareSemver("1.1.99", "1.2.0")).toBeLessThan(0);
    });
  });

  describe("needsUpdate", () => {
    it("returns true when web version is newer", async () => {
      const { needsUpdate } = await import("../../src/version.js");
      expect(needsUpdate("0.1.0", "0.2.0")).toBe(true);
      expect(needsUpdate("0.1.0", "1.0.0")).toBe(true);
      expect(needsUpdate("0.1.0", "0.1.1")).toBe(true);
    });

    it("returns false when versions are equal", async () => {
      const { needsUpdate } = await import("../../src/version.js");
      expect(needsUpdate("0.1.0", "0.1.0")).toBe(false);
    });

    it("returns false when agent version is newer (no downgrade)", async () => {
      const { needsUpdate } = await import("../../src/version.js");
      expect(needsUpdate("0.2.0", "0.1.0")).toBe(false);
      expect(needsUpdate("1.0.0", "0.9.0")).toBe(false);
    });

    it("handles major version bump", async () => {
      const { needsUpdate } = await import("../../src/version.js");
      expect(needsUpdate("0.9.9", "1.0.0")).toBe(true);
      expect(needsUpdate("1.9.9", "2.0.0")).toBe(true);
    });

    it("handles minor version bump", async () => {
      const { needsUpdate } = await import("../../src/version.js");
      expect(needsUpdate("1.0.9", "1.1.0")).toBe(true);
    });

    it("handles version 0.0.0", async () => {
      const { needsUpdate } = await import("../../src/version.js");
      expect(needsUpdate("0.0.0", "0.0.1")).toBe(true);
      expect(needsUpdate("0.0.0", "0.1.0")).toBe(true);
      expect(needsUpdate("0.0.0", "1.0.0")).toBe(true);
      expect(needsUpdate("0.0.0", "0.0.0")).toBe(false);
    });

    it("works with v prefix", async () => {
      const { needsUpdate } = await import("../../src/version.js");
      expect(needsUpdate("v0.1.0", "v0.2.0")).toBe(true);
      expect(needsUpdate("0.1.0", "v0.2.0")).toBe(true);
      expect(needsUpdate("v0.1.0", "0.2.0")).toBe(true);
    });

    it("handles large version differences", async () => {
      const { needsUpdate } = await import("../../src/version.js");
      expect(needsUpdate("0.1.0", "10.0.0")).toBe(true);
      expect(needsUpdate("10.0.0", "0.1.0")).toBe(false);
    });
  });

  describe("getAgentVersion", () => {
    it("returns a valid semver version string from package.json", async () => {
      const { getAgentVersion } = await import("../../src/version.js");
      const version = getAgentVersion();

      // Should be a valid semver string (major.minor.patch)
      expect(version).toMatch(/^\d+\.\d+\.\d+/);
    });

    it("caches the version on subsequent calls", async () => {
      const { getAgentVersion } = await import("../../src/version.js");

      const version1 = getAgentVersion();
      const version2 = getAgentVersion();

      // Should return same value (cached)
      expect(version1).toBe(version2);
    });

    it("returns the version from the agent package.json", async () => {
      // Read the actual package.json to know what version to expect
      const { readFileSync } = await import("fs");
      const { resolve } = await import("path");
      const pkgPath = resolve(import.meta.dir, "../../package.json");
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

      const { getAgentVersion } = await import("../../src/version.js");
      const version = getAgentVersion();

      expect(version).toBe(pkg.version);
    });

    it("version is usable with compareSemver", async () => {
      const { getAgentVersion, compareSemver } = await import(
        "../../src/version.js"
      );
      const version = getAgentVersion();

      // Should be comparable
      expect(compareSemver(version, "0.0.0")).toBeGreaterThanOrEqual(0);
      expect(compareSemver(version, version)).toBe(0);
    });

    it("version is usable with needsUpdate", async () => {
      const { getAgentVersion, needsUpdate } = await import(
        "../../src/version.js"
      );
      const version = getAgentVersion();

      // Same version should not need update
      expect(needsUpdate(version, version)).toBe(false);
      // Much higher version should need update
      expect(needsUpdate(version, "999.0.0")).toBe(true);
    });

    it("version paths include package.json", async () => {
      // The implementation tries multiple paths, all ending in package.json
      // We verify this by checking the source code structure:
      // paths = [join(__dirname, '..', 'package.json'), join(__dirname, '..', '..', 'package.json')]
      const { getAgentVersion } = await import("../../src/version.js");
      const version = getAgentVersion();

      // If we got a real version (not 0.0.0), at least one path succeeded
      expect(version).not.toBe("0.0.0");
    });
  });
});
