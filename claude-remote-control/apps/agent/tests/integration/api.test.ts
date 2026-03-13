import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { EventEmitter } from "events";

// Mock config
const mockConfig = {
  machine: { id: "test-machine", name: "Test Machine" },
  projects: {
    basePath: "/tmp/test-projects",
    whitelist: ["allowed-project", "another-project"],
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
    { name: "another-project", isDirectory: () => true },
    { name: "unlisted-project", isDirectory: () => true },
    { name: ".hidden", isDirectory: () => true },
    { name: "file.txt", isDirectory: () => false },
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

describe("Agent REST API", () => {
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
    it("returns the whitelist", async () => {
      const res = await fetch(`${baseUrl}/api/projects`);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual(["allowed-project", "another-project"]);
    });
  });

  describe("GET /api/folders", () => {
    it("returns non-hidden directories", async () => {
      const res = await fetch(`${baseUrl}/api/folders`);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toContain("allowed-project");
      expect(body).toContain("another-project");
      expect(body).toContain("unlisted-project");
      expect(body).not.toContain(".hidden");
      expect(body).not.toContain("file.txt");
    });

    it("sorts folders alphabetically", async () => {
      const res = await fetch(`${baseUrl}/api/folders`);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual([...body].sort());
    });
  });

  describe("GET /api/sessions", () => {
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

  describe("GET /api/sessions/:sessionName/preview", () => {
    it("validates session name format", async () => {
      const res = await fetch(`${baseUrl}/api/sessions/invalid;rm -rf/preview`);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("Invalid session name");
    });

    it("accepts valid session name", async () => {
      const { exec } = await import("child_process");
      (exec as any).mockImplementation((cmd: any, opts: any, cb: any) => {
        const callback = typeof opts === "function" ? opts : cb;
        if (callback) {
          callback(null, { stdout: "line1\nline2\n", stderr: "" });
        }
        return null as any;
      });

      const res = await fetch(
        `${baseUrl}/api/sessions/project--valid-session-42/preview`
      );

      // Should not be a 400 error
      expect(res.status).not.toBe(400);
    });
  });

  describe("DELETE /api/sessions/:sessionName", () => {
    it("validates session name format", async () => {
      const res = await fetch(`${baseUrl}/api/sessions/invalid;rm`, {
        method: "DELETE",
      });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("Invalid session name");
    });
  });
});
