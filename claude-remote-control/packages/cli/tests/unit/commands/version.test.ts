/**
 * Version Command Tests
 *
 * Tests for the version command that shows current version and checks for updates.
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

const TEST_VERSION = "1.2.3";

// Mock chalk
mock.module("chalk", () => ({
  default: {
    green: (s: string) => `[green]${s}[/green]`,
    yellow: (s: string) => `[yellow]${s}[/yellow]`,
    dim: (s: string) => `[dim]${s}[/dim]`,
  },
}));

// Mock package.json import
mock.module("../../../package.json", () => ({
  default: { version: TEST_VERSION },
}));

describe("Version Command", () => {
  let consoleLogs: string[];
  let originalConsoleLog: typeof console.log;
  let fetchSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    consoleLogs = [];
    originalConsoleLog = console.log;
    console.log = mock((...args: unknown[]) => {
      consoleLogs.push(args.join(" "));
    }) as typeof console.log;

    fetchSpy = spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    fetchSpy.mockRestore();
  });

  it("shows current version with (latest) when up to date", async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ version: TEST_VERSION }), { status: 200 })
    );

    const { versionCommand } = await import("../../../src/commands/version.js");
    await versionCommand.parseAsync(["node", "version"]);

    expect(
      consoleLogs.some((log) => log.includes(`247 v${TEST_VERSION}`))
    ).toBe(true);
    expect(
      consoleLogs.some((log) => log.includes("[green](latest)[/green]"))
    ).toBe(true);
  });

  it("shows update available when newer version exists", async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ version: "9.9.9" }), { status: 200 })
    );

    const { versionCommand } = await import("../../../src/commands/version.js");
    await versionCommand.parseAsync(["node", "version"]);

    expect(
      consoleLogs.some((log) => log.includes(`247 v${TEST_VERSION}`))
    ).toBe(true);
    expect(
      consoleLogs.some((log) => log.includes("[yellow]Update available"))
    ).toBe(true);
    expect(consoleLogs.some((log) => log.includes("9.9.9"))).toBe(true);
    expect(consoleLogs.some((log) => log.includes("247 update"))).toBe(true);
  });

  it("shows version with warning when registry check fails", async () => {
    fetchSpy.mockRejectedValue(new Error("Network error"));

    const { versionCommand } = await import("../../../src/commands/version.js");
    await versionCommand.parseAsync(["node", "version"]);

    expect(
      consoleLogs.some((log) => log.includes(`247 v${TEST_VERSION}`))
    ).toBe(true);
    expect(
      consoleLogs.some((log) => log.includes("Could not check for updates"))
    ).toBe(true);
  });
});
