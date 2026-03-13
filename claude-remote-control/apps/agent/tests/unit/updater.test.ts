import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test";
import { platform } from "os";

// Mock dependencies before importing
mock.module("fs", () => ({
  writeFileSync: mock(),
  existsSync: mock(() => true),
  readFileSync: mock(() => ""),
  mkdirSync: mock(),
}));

mock.module("child_process", () => ({
  spawn: mock(() => ({
    unref: mock(),
    pid: 12_345,
  })),
  exec: mock(),
  execSync: mock(() => ""),
}));

mock.module("../../src/logger.js", () => ({
  logger: {
    main: {
      info: mock(),
      warn: mock(),
      error: mock(),
    },
  },
}));

mock.module("../../src/websocket-handlers.js", () => ({
  broadcastUpdatePending: mock(),
}));

describe("Updater Module", () => {
  beforeEach(() => {
    spyOn(process, "exit").mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    mock.restore();
  });

  describe("isUpdateInProgress", () => {
    it("returns false initially", async () => {
      const { isUpdateInProgress } = await import("../../src/updater.js");
      expect(isUpdateInProgress()).toBe(false);
    });
  });

  // Since triggerUpdate sets module-level state (updateInProgress = true)
  // and all tests share the same cached module, we use a single describe
  // block that calls triggerUpdate once and verifies all behaviors.
  describe("triggerUpdate (single invocation)", () => {
    it("creates update script, spawns process, logs, and sets state correctly", async () => {
      const { writeFileSync } = await import("fs");
      const { spawn } = await import("child_process");
      const { logger } = await import("../../src/logger.js");
      const { broadcastUpdatePending } = await import(
        "../../src/websocket-handlers.js"
      );

      const { triggerUpdate, isUpdateInProgress } = await import(
        "../../src/updater.js"
      );

      // Set NVM_BIN before calling triggerUpdate
      const originalNvmBin = process.env.NVM_BIN;
      process.env.NVM_BIN = "/home/user/.nvm/versions/node/v22.0.0/bin";

      triggerUpdate("1.2.3");

      // --- Verify update script content ---
      expect(writeFileSync).toHaveBeenCalledWith(
        "/tmp/247-update.sh",
        expect.stringContaining("bun install -g 247-cli@1.2.3"),
        { mode: 0o755 }
      );

      const scriptContent = (writeFileSync as any).mock.calls[0][1] as string;

      // Script should cd to /tmp before bun install
      expect(scriptContent).toContain("cd /tmp");
      const cdIndex = scriptContent.indexOf("cd /tmp");
      const bunIndex = scriptContent.indexOf("bun install -g");
      expect(cdIndex).toBeLessThan(bunIndex);

      // Script should fix executable permissions
      expect(scriptContent).toContain("chmod +x");
      expect(scriptContent).toContain("dist/index.js");
      const chmodIndex = scriptContent.indexOf("chmod +x");
      expect(chmodIndex).toBeGreaterThan(bunIndex);

      // Script should source nvm for Linux compatibility
      expect(scriptContent).toContain("NVM_DIR");
      expect(scriptContent).toContain('source "$NVM_DIR/nvm.sh"');
      const nvmIndex = scriptContent.indexOf('source "$NVM_DIR/nvm.sh"');
      expect(nvmIndex).toBeLessThan(bunIndex);

      // Platform-specific restart command (darwin on macOS)
      const currentPlatform = platform();
      if (currentPlatform === "darwin") {
        expect(scriptContent).toContain("launchctl kickstart");
      } else if (currentPlatform === "linux") {
        expect(scriptContent).toContain("systemctl --user restart");
      }

      // --- Verify spawn ---
      expect(spawn).toHaveBeenCalledWith(
        "bash",
        ["/tmp/247-update.sh"],
        expect.objectContaining({
          detached: true,
          stdio: "ignore",
        })
      );

      // Verify PATH in spawn environment
      const spawnOptions = (spawn as any).mock.calls[0][2] as {
        env: Record<string, string>;
      };
      expect(spawnOptions.env.PATH).toContain("/opt/homebrew/bin");
      expect(spawnOptions.env.PATH).toContain("/usr/local/bin");
      // Should include NVM_BIN in PATH since we set it
      expect(spawnOptions.env.PATH).toContain(
        "/home/user/.nvm/versions/node/v22.0.0/bin"
      );
      // Should pass NVM_DIR
      expect(spawnOptions.env.NVM_DIR).toBeDefined();
      expect(spawnOptions.env.NVM_DIR).toContain(".nvm");

      // --- Verify logging ---
      expect(logger.main.info).toHaveBeenCalledWith(
        { targetVersion: "1.2.3" },
        "Auto-update triggered"
      );

      // --- Verify broadcast ---
      expect(broadcastUpdatePending).toHaveBeenCalledWith(
        "1.2.3",
        "Agent updating to version 1.2.3..."
      );

      // --- Verify state ---
      expect(isUpdateInProgress()).toBe(true);

      // Restore NVM_BIN
      if (originalNvmBin) {
        process.env.NVM_BIN = originalNvmBin;
      } else {
        delete process.env.NVM_BIN;
      }
    });

    it("exits process after delay", async () => {
      // Note: process.exit was already called from the previous test's triggerUpdate
      // Wait for the real setTimeout to fire (1 second + buffer)
      await new Promise((r) => setTimeout(r, 1200));

      expect(process.exit).toHaveBeenCalledWith(0);
    });

    it("ignores subsequent triggerUpdate calls when update is in progress", async () => {
      const { logger } = await import("../../src/logger.js");
      const { triggerUpdate, isUpdateInProgress } = await import(
        "../../src/updater.js"
      );

      expect(isUpdateInProgress()).toBe(true);

      // Reset mock call history to check new calls only
      (logger.main.warn as any).mockClear();

      triggerUpdate("2.0.0");

      expect(logger.main.warn).toHaveBeenCalledWith(
        "Update already in progress, ignoring"
      );
    });
  });
});
