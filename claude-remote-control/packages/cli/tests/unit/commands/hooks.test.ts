/**
 * Hooks Command Tests
 *
 * Tests for the hooks command that manages Claude Code notification hooks.
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
    cyan: (s: string) => s,
  },
}));

// Mock ora
mock.module("ora", () => ({
  default: mock(() => ({
    start: mock(function (this: any) {
      return this;
    }),
    succeed: mock(function (this: any) {
      return this;
    }),
    fail: mock(function (this: any) {
      return this;
    }),
    info: mock(function (this: any) {
      return this;
    }),
    text: "",
  })),
}));

// Mock hooks lib
mock.module("../../../src/lib/hooks.js", () => ({
  getHooksStatus: mock(),
  installHook: mock(),
  uninstallHook: mock(),
  needsUpdate: mock(),
  getHookVersion: mock(),
  getPackagedHookVersion: mock(),
  getCodexNotifyStatus: mock(() => ({
    configPath: "/home/user/.codex/config.toml",
    configExists: false,
    notifyConfigured: false,
  })),
  installCodexNotify: mock(() => ({
    success: true,
    status: "missing-config",
  })),
  uninstallCodexNotify: mock(() => ({
    success: true,
    status: "missing-config",
  })),
}));

describe("Hooks Command", () => {
  let consoleLogs: string[];
  let originalConsoleLog: typeof console.log;
  let exitMock: ReturnType<typeof spyOn>;

  beforeEach(async () => {
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

    // Clear accumulated mock call counts from previous tests
    const hooksLib = await import("../../../src/lib/hooks.js");
    (hooksLib.getHooksStatus as ReturnType<typeof mock>).mockClear();
    (hooksLib.installHook as ReturnType<typeof mock>).mockClear();
    (hooksLib.uninstallHook as ReturnType<typeof mock>).mockClear();
    (hooksLib.needsUpdate as ReturnType<typeof mock>).mockClear();
    (hooksLib.getHookVersion as ReturnType<typeof mock>).mockClear();
    (hooksLib.getPackagedHookVersion as ReturnType<typeof mock>).mockClear();
    (hooksLib.getCodexNotifyStatus as ReturnType<typeof mock>).mockClear();
    (hooksLib.installCodexNotify as ReturnType<typeof mock>).mockClear();
    (hooksLib.uninstallCodexNotify as ReturnType<typeof mock>).mockClear();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    exitMock.mockRestore();
  });

  describe("install subcommand", () => {
    it("installs hooks when not installed", async () => {
      const { getHooksStatus, installHook } = await import(
        "../../../src/lib/hooks.js"
      );
      (getHooksStatus as ReturnType<typeof mock>).mockReturnValue({
        installed: false,
        version: null,
        path: "/home/user/.247/hooks/notify-247.sh",
        settingsConfigured: false,
        needsUpdate: false,
        packagedVersion: "2.25.0",
      });
      (installHook as ReturnType<typeof mock>).mockReturnValue({
        success: true,
        installedVersion: "2.25.0",
      });

      const { hooksCommand } = await import("../../../src/commands/hooks.js");
      await hooksCommand.parseAsync(["node", "hooks", "install"]);

      expect(installHook).toHaveBeenCalled();
    });

    it("skips install when already up to date", async () => {
      const { getHooksStatus, installHook } = await import(
        "../../../src/lib/hooks.js"
      );
      (getHooksStatus as ReturnType<typeof mock>).mockReturnValue({
        installed: true,
        version: "2.25.0",
        path: "/home/user/.247/hooks/notify-247.sh",
        settingsConfigured: true,
        needsUpdate: false,
        packagedVersion: "2.25.0",
      });

      const { hooksCommand } = await import("../../../src/commands/hooks.js");
      await hooksCommand.parseAsync(["node", "hooks", "install"]);

      expect(installHook).not.toHaveBeenCalled();
    });

    it("updates when newer version available", async () => {
      const { getHooksStatus, installHook } = await import(
        "../../../src/lib/hooks.js"
      );
      (getHooksStatus as ReturnType<typeof mock>).mockReturnValue({
        installed: true,
        version: "2.24.0",
        path: "/home/user/.247/hooks/notify-247.sh",
        settingsConfigured: true,
        needsUpdate: true,
        packagedVersion: "2.25.0",
      });
      (installHook as ReturnType<typeof mock>).mockReturnValue({
        success: true,
        installedVersion: "2.25.0",
      });

      const { hooksCommand } = await import("../../../src/commands/hooks.js");
      await hooksCommand.parseAsync(["node", "hooks", "install"]);

      expect(installHook).toHaveBeenCalled();
    });

    it("force reinstalls when --force flag used", async () => {
      const { getHooksStatus, installHook } = await import(
        "../../../src/lib/hooks.js"
      );
      (getHooksStatus as ReturnType<typeof mock>).mockReturnValue({
        installed: true,
        version: "2.25.0",
        path: "/home/user/.247/hooks/notify-247.sh",
        settingsConfigured: true,
        needsUpdate: false,
        packagedVersion: "2.25.0",
      });
      (installHook as ReturnType<typeof mock>).mockReturnValue({
        success: true,
        installedVersion: "2.25.0",
      });

      const { hooksCommand } = await import("../../../src/commands/hooks.js");
      await hooksCommand.parseAsync(["node", "hooks", "install", "--force"]);

      expect(installHook).toHaveBeenCalled();
    });

    it("exits with error on install failure", async () => {
      const { getHooksStatus, installHook } = await import(
        "../../../src/lib/hooks.js"
      );
      (getHooksStatus as ReturnType<typeof mock>).mockReturnValue({
        installed: false,
        version: null,
        path: "/home/user/.247/hooks/notify-247.sh",
        settingsConfigured: false,
        needsUpdate: false,
        packagedVersion: "2.25.0",
      });
      (installHook as ReturnType<typeof mock>).mockReturnValue({
        success: false,
        error: "Permission denied",
      });

      const { hooksCommand } = await import("../../../src/commands/hooks.js");

      try {
        await hooksCommand.parseAsync(["node", "hooks", "install"]);
      } catch (e) {
        expect((e as Error).message).toBe("process.exit");
      }

      expect(exitMock).toHaveBeenCalledWith(1);
    });
  });

  describe("uninstall subcommand", () => {
    it("uninstalls hooks when installed", async () => {
      const { getHooksStatus, uninstallHook } = await import(
        "../../../src/lib/hooks.js"
      );
      (getHooksStatus as ReturnType<typeof mock>).mockReturnValue({
        installed: true,
        version: "2.25.0",
        path: "/home/user/.247/hooks/notify-247.sh",
        settingsConfigured: true,
        needsUpdate: false,
        packagedVersion: "2.25.0",
      });
      (uninstallHook as ReturnType<typeof mock>).mockReturnValue({
        success: true,
      });

      const { hooksCommand } = await import("../../../src/commands/hooks.js");
      await hooksCommand.parseAsync(["node", "hooks", "uninstall"]);

      expect(uninstallHook).toHaveBeenCalledWith(true);
    });

    it("keeps script when --keep-script flag used", async () => {
      const { getHooksStatus, uninstallHook } = await import(
        "../../../src/lib/hooks.js"
      );
      (getHooksStatus as ReturnType<typeof mock>).mockReturnValue({
        installed: true,
        version: "2.25.0",
        path: "/home/user/.247/hooks/notify-247.sh",
        settingsConfigured: true,
        needsUpdate: false,
        packagedVersion: "2.25.0",
      });
      (uninstallHook as ReturnType<typeof mock>).mockReturnValue({
        success: true,
      });

      const { hooksCommand } = await import("../../../src/commands/hooks.js");
      await hooksCommand.parseAsync([
        "node",
        "hooks",
        "uninstall",
        "--keep-script",
      ]);

      expect(uninstallHook).toHaveBeenCalledWith(false);
    });

    it("does nothing when not installed", async () => {
      const { getHooksStatus, uninstallHook } = await import(
        "../../../src/lib/hooks.js"
      );
      (getHooksStatus as ReturnType<typeof mock>).mockReturnValue({
        installed: false,
        version: null,
        path: "/home/user/.247/hooks/notify-247.sh",
        settingsConfigured: false,
        needsUpdate: false,
        packagedVersion: "2.25.0",
      });

      const { hooksCommand } = await import("../../../src/commands/hooks.js");
      await hooksCommand.parseAsync(["node", "hooks", "uninstall"]);

      expect(uninstallHook).not.toHaveBeenCalled();
    });
  });

  describe("status subcommand", () => {
    it("shows installed status", async () => {
      const { getHooksStatus } = await import("../../../src/lib/hooks.js");
      (getHooksStatus as ReturnType<typeof mock>).mockReturnValue({
        installed: true,
        version: "2.25.0",
        path: "/home/user/.247/hooks/notify-247.sh",
        settingsConfigured: true,
        needsUpdate: false,
        packagedVersion: "2.25.0",
      });

      const { hooksCommand } = await import("../../../src/commands/hooks.js");
      await hooksCommand.parseAsync(["node", "hooks", "status"]);

      expect(consoleLogs.some((log) => log.includes("installed"))).toBe(true);
      expect(consoleLogs.some((log) => log.includes("2.25.0"))).toBe(true);
    });

    it("shows update available", async () => {
      const { getHooksStatus } = await import("../../../src/lib/hooks.js");
      (getHooksStatus as ReturnType<typeof mock>).mockReturnValue({
        installed: true,
        version: "2.24.0",
        path: "/home/user/.247/hooks/notify-247.sh",
        settingsConfigured: true,
        needsUpdate: true,
        packagedVersion: "2.25.0",
      });

      const { hooksCommand } = await import("../../../src/commands/hooks.js");
      await hooksCommand.parseAsync(["node", "hooks", "status"]);

      expect(consoleLogs.some((log) => log.includes("Update available"))).toBe(
        true
      );
    });

    it("shows not installed status", async () => {
      const { getHooksStatus } = await import("../../../src/lib/hooks.js");
      (getHooksStatus as ReturnType<typeof mock>).mockReturnValue({
        installed: false,
        version: null,
        path: "/home/user/.247/hooks/notify-247.sh",
        settingsConfigured: false,
        needsUpdate: false,
        packagedVersion: "2.25.0",
      });

      const { hooksCommand } = await import("../../../src/commands/hooks.js");
      await hooksCommand.parseAsync(["node", "hooks", "status"]);

      expect(consoleLogs.some((log) => log.includes("not installed"))).toBe(
        true
      );
    });
  });

  describe("update subcommand", () => {
    it("updates hooks when update available", async () => {
      const { getHooksStatus, installHook } = await import(
        "../../../src/lib/hooks.js"
      );
      (getHooksStatus as ReturnType<typeof mock>).mockReturnValue({
        installed: true,
        version: "2.24.0",
        path: "/home/user/.247/hooks/notify-247.sh",
        settingsConfigured: true,
        needsUpdate: true,
        packagedVersion: "2.25.0",
      });
      (installHook as ReturnType<typeof mock>).mockReturnValue({
        success: true,
        installedVersion: "2.25.0",
      });

      const { hooksCommand } = await import("../../../src/commands/hooks.js");
      await hooksCommand.parseAsync(["node", "hooks", "update"]);

      expect(installHook).toHaveBeenCalled();
    });

    it("does nothing when already up to date", async () => {
      const { getHooksStatus, installHook } = await import(
        "../../../src/lib/hooks.js"
      );
      (getHooksStatus as ReturnType<typeof mock>).mockReturnValue({
        installed: true,
        version: "2.25.0",
        path: "/home/user/.247/hooks/notify-247.sh",
        settingsConfigured: true,
        needsUpdate: false,
        packagedVersion: "2.25.0",
      });

      const { hooksCommand } = await import("../../../src/commands/hooks.js");
      await hooksCommand.parseAsync(["node", "hooks", "update"]);

      expect(installHook).not.toHaveBeenCalled();
    });

    it("prompts install when not installed", async () => {
      const { getHooksStatus, installHook } = await import(
        "../../../src/lib/hooks.js"
      );
      (getHooksStatus as ReturnType<typeof mock>).mockReturnValue({
        installed: false,
        version: null,
        path: "/home/user/.247/hooks/notify-247.sh",
        settingsConfigured: false,
        needsUpdate: false,
        packagedVersion: "2.25.0",
      });

      const { hooksCommand } = await import("../../../src/commands/hooks.js");
      await hooksCommand.parseAsync(["node", "hooks", "update"]);

      expect(installHook).not.toHaveBeenCalled();
    });
  });
});
