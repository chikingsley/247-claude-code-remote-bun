/**
 * Integration tests for `247 init` command workflow
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
  createMockFsState,
  type MockFsState,
  mockPaths,
  setupDefaultDirectories,
  setupHooksSource,
  validConfig,
} from "../helpers/mock-system.js";

// ============= MOCK SETUP =============

let fsState: MockFsState;
let promptResponses: unknown[];
let output: CapturedOutput;
let processExitSpy: ReturnType<typeof spyOn>;

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
mock.module("fs", () => {
  return {
    existsSync: mock(
      (path: string) =>
        fsState?.files.has(path) || fsState?.directories.has(path)
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
  };
});

// Mock crypto for UUID generation
mock.module("crypto", () => ({
  randomUUID: () => "generated-uuid-1234",
}));

// Mock child_process for prerequisite checks
mock.module("child_process", () => ({
  execSync: mock(() => "tmux 3.4"),
  spawn: mock(),
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

// Mock chalk to pass through text (makes assertions easier)
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
          // Trigger listening callback synchronously via setImmediate
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

/**
 * Reset Commander option state on the initCommand singleton.
 * Commander retains parsed option values between parseAsync calls,
 * so we must clear them before each test.
 */
async function resetInitCommand() {
  const { initCommand } = await import("../../src/commands/init.js");
  initCommand.setOptionValue("name", undefined);
  initCommand.setOptionValue("port", "4678");
  initCommand.setOptionValue("projects", "~/Dev");
  initCommand.setOptionValue("force", undefined);
  initCommand.setOptionValue("profile", undefined);
}

describe("247 init workflow", () => {
  beforeEach(async () => {
    // Reset state
    fsState = createMockFsState();
    setupDefaultDirectories(fsState);
    setupHooksSource(fsState);
    promptResponses = [];
    output = captureConsole();

    // Mock process.exit to throw instead of exiting
    processExitSpy = spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });

    // Reset Commander option state from previous tests
    await resetInitCommand();
  });

  afterEach(() => {
    mock.restore();
  });

  describe("fresh installation", () => {
    it("creates config with prompted values", async () => {
      promptResponses = [
        { machineName: "my-awesome-mac" },
        { projectsPath: "~/Projects" },
      ];

      const { initCommand } = await import("../../src/commands/init.js");
      await initCommand.parseAsync(["node", "247", "init"]);

      // Verify config was written
      expect(fsState.files.has(mockPaths.configPath)).toBe(true);

      const savedConfig = JSON.parse(fsState.files.get(mockPaths.configPath)!);
      expect(savedConfig.machine.name).toBe("my-awesome-mac");
      expect(savedConfig.machine.id).toBe("generated-uuid-1234");
      expect(savedConfig.projects.basePath).toBe("~/Projects");
      expect(savedConfig.agent.port).toBe(4678);
    });

    it("uses CLI flags instead of prompts when provided", async () => {
      // No prompts needed since all values are provided via CLI
      promptResponses = [];

      const { initCommand } = await import("../../src/commands/init.js");
      await initCommand.parseAsync([
        "node",
        "247",
        "init",
        "--name",
        "cli-provided-name",
        "--port",
        "5000",
        "--projects",
        "/custom/path",
      ]);

      const savedConfig = JSON.parse(fsState.files.get(mockPaths.configPath)!);
      expect(savedConfig.machine.name).toBe("cli-provided-name");
      expect(savedConfig.agent.port).toBe(5000);
      expect(savedConfig.projects.basePath).toBe("/custom/path");
    });

    it("prompts for machine name only if not provided", async () => {
      promptResponses = [
        { machineName: "prompted-name" },
        { projectsPath: "~/Dev" },
      ];

      const enquirer = await import("enquirer");

      const { initCommand } = await import("../../src/commands/init.js");
      await initCommand.parseAsync(["node", "247", "init"]);

      // Enquirer should have been called for prompts
      expect(enquirer.default.prompt).toHaveBeenCalled();
    });
  });

  describe("existing configuration", () => {
    it("warns if config already exists and suggests --force", async () => {
      // Pre-existing config
      fsState.files.set(mockPaths.configPath, JSON.stringify(validConfig));

      const { initCommand } = await import("../../src/commands/init.js");
      await initCommand.parseAsync(["node", "247", "init"]);

      expect(output.logs.some((l) => l.includes("already exists"))).toBe(true);
      expect(output.logs.some((l) => l.includes("--force"))).toBe(true);

      // Config should not have been modified
      const savedConfig = JSON.parse(fsState.files.get(mockPaths.configPath)!);
      expect(savedConfig.machine.id).toBe(validConfig.machine.id);
    });

    it("overwrites config when --force is used", async () => {
      // Pre-existing config
      fsState.files.set(mockPaths.configPath, JSON.stringify(validConfig));
      promptResponses = [];

      const { initCommand } = await import("../../src/commands/init.js");
      await initCommand.parseAsync([
        "node",
        "247",
        "init",
        "--force",
        "--name",
        "new-name",
      ]);

      const savedConfig = JSON.parse(fsState.files.get(mockPaths.configPath)!);
      expect(savedConfig.machine.name).toBe("new-name");
      expect(savedConfig.machine.id).toBe("generated-uuid-1234"); // New UUID
    });
  });

  describe("prerequisites checking", () => {
    it("exits with error if tmux is not installed", async () => {
      const { execSync } = await import("child_process");
      // Use mockImplementationOnce so it doesn't affect subsequent tests
      (execSync as ReturnType<typeof mock>).mockImplementationOnce(() => {
        throw new Error("command not found");
      });

      promptResponses = [{ machineName: "test" }, { projectsPath: "~/Dev" }];

      const { initCommand } = await import("../../src/commands/init.js");

      await expect(
        initCommand.parseAsync(["node", "247", "init", "--name", "test"])
      ).rejects.toThrow("process.exit(1)");

      expect(output.logs.some((l) => l.toLowerCase().includes("tmux"))).toBe(
        true
      );
    });
  });

  describe("profile support", () => {
    it("creates profile in profiles directory when --profile is used", async () => {
      promptResponses = [
        { machineName: "dev-machine" },
        { projectsPath: "~/Dev" },
      ];

      const { initCommand } = await import("../../src/commands/init.js");
      await initCommand.parseAsync(["node", "247", "init", "--profile", "dev"]);

      // Profile should be created in profiles directory
      const profilePath = `${mockPaths.profilesDir}/dev.json`;
      expect(fsState.files.has(profilePath)).toBe(true);

      const savedConfig = JSON.parse(fsState.files.get(profilePath)!);
      expect(savedConfig.machine.name).toBe("dev-machine");
    });
  });

  describe("statusLine configuration", () => {
    it("completes without mentioning hooks (deprecated)", async () => {
      promptResponses = [{ machineName: "test" }, { projectsPath: "~/Dev" }];

      const { initCommand } = await import("../../src/commands/init.js");
      await initCommand.parseAsync(["node", "247", "init"]);

      // Config should be saved - statusLine is auto-configured by agent at startup
      expect(fsState.files.has(mockPaths.configPath)).toBe(true);

      // Should show completion message
      const allOutput = output.logs.join(" ");
      expect(
        allOutput.includes("complete") || allOutput.includes("Complete")
      ).toBe(true);
    });
  });

  describe("success output", () => {
    it("shows success message and next steps", async () => {
      promptResponses = [{ machineName: "test" }, { projectsPath: "~/Dev" }];

      const { initCommand } = await import("../../src/commands/init.js");
      await initCommand.parseAsync(["node", "247", "init"]);

      const allOutput = output.logs.join(" ");
      expect(
        allOutput.includes("complete") || allOutput.includes("Complete")
      ).toBe(true);
      expect(allOutput.includes("247 start")).toBe(true);
    });
  });
});
