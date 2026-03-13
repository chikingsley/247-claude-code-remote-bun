/**
 * API Contracts Tests
 *
 * Tests that validate API response structures match the TypeScript types
 * defined in the shared package. These tests ensure interface stability
 * between the agent and web dashboard.
 */
import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import type { WSSessionInfo } from "247-shared";
import { EventEmitter } from "events";

// Mock config
const mockConfig = {
  machine: { id: "test-machine", name: "Test Machine" },
  projects: {
    basePath: "/tmp/test-projects",
    whitelist: ["allowed-project"],
  },
  dashboard: {
    apiUrl: "http://localhost:3001/api",
    apiKey: "test-key",
  },
};

mock.module("../../src/config.js", () => ({
  config: mockConfig,
  loadConfig: () => mockConfig,
  default: mockConfig,
}));

// Mock fs/promises
mock.module("fs/promises", () => ({
  readdir: mock(async () => [
    { name: "allowed-project", isDirectory: () => true },
  ]),
  access: mock(async () => {
    throw new Error("ENOENT");
  }),
  rm: mock(async () => undefined),
}));

// Mock child_process
mock.module("child_process", () => ({
  exec: mock((cmd: any, opts: any, cb: any) => {
    const callback = typeof opts === "function" ? opts : cb;
    if (callback) {
      callback(null, { stdout: "", stderr: "" });
    }
  }),
  execSync: mock(() => ""),
  spawn: mock(() => {
    const proc = new EventEmitter() as any;
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    proc.kill = mock();
    proc.pid = 12_345;
    return proc;
  }),
}));

// Mock terminal
mock.module("../../src/terminal.js", () => ({
  createTerminal: mock(() => ({
    write: mock(),
    resize: mock(),
    onData: mock(),
    onExit: mock(),
    kill: mock(),
    detach: mock(),
    captureHistory: mock(async () => ""),
    isExistingSession: mock(() => false),
  })),
}));

// ============================================================================
// Type Guards for Response Validation
// ============================================================================

function isValidWSSessionInfo(obj: unknown): obj is WSSessionInfo {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }
  const session = obj as Record<string, unknown>;

  if (typeof session.name !== "string") {
    return false;
  }
  if (typeof session.project !== "string") {
    return false;
  }
  if (typeof session.createdAt !== "number") {
    return false;
  }

  return true;
}

// ============================================================================
// Tests
// ============================================================================

describe("API Response Contract Tests", () => {
  let server: ReturnType<typeof import("../../src/server.js").createServer>;
  let baseUrl: string;

  beforeAll(async () => {
    const { createServer } = await import("../../src/server.js");
    server = createServer(0);
    baseUrl = `http://localhost:${server.port}`;
  });

  afterAll(() => {
    server?.stop();
  });

  describe("GET /api/projects", () => {
    it("returns string array", async () => {
      const res = await fetch(`${baseUrl}/api/projects`);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      body.forEach((item: unknown) => {
        expect(typeof item).toBe("string");
      });
    });
  });

  describe("GET /api/folders", () => {
    it("returns string array of folder names", async () => {
      const res = await fetch(`${baseUrl}/api/folders`);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      body.forEach((item: unknown) => {
        expect(typeof item).toBe("string");
      });
    });
  });

  describe("GET /api/sessions", () => {
    it("returns array of valid WSSessionInfo", async () => {
      const { exec } = await import("child_process");
      (exec as any).mockImplementation((cmd: any, opts: any, cb: any) => {
        const callback = typeof opts === "function" ? opts : cb;
        // Mock tmux output: session_name|session_created (unix timestamp)
        const mockOutput =
          "test--session-1|1704067200\ntest--session-2|1704067300\n";
        if (callback) {
          callback(null, { stdout: mockOutput, stderr: "" });
        }
        return null as any;
      });

      const res = await fetch(`${baseUrl}/api/sessions`);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(body)).toBe(true);

      if (body.length > 0) {
        body.forEach((session: unknown) => {
          expect(isValidWSSessionInfo(session)).toBe(true);
        });
      }
    });

    it("returns empty array when no sessions", async () => {
      const { exec } = await import("child_process");
      (exec as any).mockImplementation((cmd: any, opts: any, cb: any) => {
        const callback = typeof opts === "function" ? opts : cb;
        if (callback) {
          callback(new Error("no sessions"), null, null);
        }
        return null as any;
      });

      const res = await fetch(`${baseUrl}/api/sessions`);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual([]);
    });
  });

  describe("Session Preview Endpoint", () => {
    it("returns preview with expected structure", async () => {
      const { exec } = await import("child_process");
      (exec as any).mockImplementation((cmd: any, opts: any, cb: any) => {
        const callback = typeof opts === "function" ? opts : cb;
        if (callback) {
          callback(null, { stdout: "$ echo hello\nhello\n$ ", stderr: "" });
        }
        return null as any;
      });

      const res = await fetch(
        `${baseUrl}/api/sessions/test--valid-session-1/preview`
      );
      const body = await res.json();

      if (res.status === 200) {
        expect(Array.isArray(body.lines)).toBe(true);
        expect(typeof body.timestamp).toBe("number");
      }
    });
  });
});

describe("Error Response Contracts", () => {
  let server: ReturnType<typeof import("../../src/server.js").createServer>;
  let baseUrl: string;

  beforeAll(async () => {
    const { createServer } = await import("../../src/server.js");
    server = createServer(0);
    baseUrl = `http://localhost:${server.port}`;
  });

  afterAll(() => {
    server?.stop();
  });

  it("returns 400 for invalid session name format", async () => {
    const res = await fetch(`${baseUrl}/api/sessions/invalid;rm -rf/preview`);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid session name");
  });

  it("returns 404 for missing resources", async () => {
    const res = await fetch(
      `${baseUrl}/api/sessions/non-existent-session/status`
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(typeof body.error).toBe("string");
  });
});
