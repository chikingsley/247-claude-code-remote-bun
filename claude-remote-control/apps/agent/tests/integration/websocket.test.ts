import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  mock,
} from "bun:test";
import { EventEmitter } from "events";

// Mock config
const mockConfig = {
  machine: { id: "test-machine", name: "Test Machine" },
  projects: {
    basePath: "/tmp/test-projects",
    whitelist: ["allowed-project"],
  },
  editor: {
    enabled: false,
    portRange: { start: 4680, end: 4699 },
    idleTimeout: 60_000,
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

// Mock fs module (must include all named exports used by any imported module)
mock.module("fs", () => ({
  existsSync: mock(() => true),
  readFileSync: mock(() => "{}"),
  writeFileSync: mock(),
  mkdirSync: mock(),
  default: {
    existsSync: mock(() => true),
    readFileSync: mock(() => "{}"),
    writeFileSync: mock(),
    mkdirSync: mock(),
  },
}));

// Mock fs/promises
mock.module("fs/promises", () => ({
  readdir: mock(async () => []),
  access: mock(async () => {
    throw new Error("ENOENT");
  }),
  rm: mock(async () => undefined),
}));

// Mock database modules
mock.module("../../src/db/index.js", () => ({
  initDatabase: mock(() => ({})),
  closeDatabase: mock(),
  migrateEnvironmentsFromJson: mock(() => false),
  RETENTION_CONFIG: {
    sessionMaxAge: 24 * 60 * 60 * 1000,
    historyMaxAge: 7 * 24 * 60 * 60 * 1000,
    cleanupInterval: 60 * 60 * 1000,
  },
}));

mock.module("../../src/db/environments.js", () => ({
  getEnvironmentsMetadata: mock(() => []),
  getEnvironmentMetadata: mock(() => undefined),
  getEnvironment: mock(() => undefined),
  createEnvironment: mock(() => ({ id: "test-env" })),
  updateEnvironment: mock(() => null),
  deleteEnvironment: mock(() => false),
  getEnvironmentVariables: mock(() => ({})),
  setSessionEnvironment: mock(),
  getSessionEnvironment: mock(() => undefined),
  clearSessionEnvironment: mock(),
  ensureDefaultEnvironment: mock(),
}));

mock.module("../../src/db/sessions.js", () => ({
  getAllSessions: mock(() => []),
  getSession: mock(() => null),
  upsertSession: mock(),
  deleteSession: mock(() => true),
  cleanupStaleSessions: mock(() => 0),
  reconcileWithTmux: mock(),
  toHookStatus: mock(() => ({})),
  clearSessionEnvironmentId: mock(),
}));

mock.module("../../src/db/history.js", () => ({
  recordStatusChange: mock(),
  getSessionHistory: mock(() => []),
  cleanupOldHistory: mock(() => 0),
}));

// Create shared mock terminal
let mockTerminal: any;
const createMockTerminal = () => {
  const terminal = {
    write: mock(),
    resize: mock(),
    kill: mock(),
    detach: mock(),
    captureHistory: mock(async () => "$ echo hello\nhello\n$ "),
    isExistingSession: mock(() => false),
    onReady: mock((cb: () => void) => cb()), // Mock terminal is always ready
    _dataCallbacks: [] as ((data: string) => void)[],
    _exitCallbacks: [] as ((info: { exitCode: number }) => void)[],
    onData: mock((cb: (data: string) => void) =>
      terminal._dataCallbacks.push(cb)
    ),
    onExit: mock((cb: (info: { exitCode: number }) => void) =>
      terminal._exitCallbacks.push(cb)
    ),
    emitData: (data: string) =>
      terminal._dataCallbacks.forEach((cb) => cb(data)),
    emitExit: (info: { exitCode: number }) =>
      terminal._exitCallbacks.forEach((cb) => cb(info)),
  };
  return terminal;
};

mock.module("../../src/terminal.js", () => ({
  createTerminal: mock(() => {
    mockTerminal = createMockTerminal();
    return mockTerminal;
  }),
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

// Mock editor
mock.module("../../src/editor.js", () => ({
  initEditor: mock(),
  getOrStartEditor: mock(),
  stopEditor: mock(),
  getEditorStatus: mock(() => ({ running: false })),
  getAllEditors: mock(() => []),
  updateEditorActivity: mock(),
  shutdownAllEditors: mock(),
}));

describe("WebSocket Terminal", () => {
  let server: ReturnType<typeof import("../../src/server.js").createServer>;
  let port: number;

  beforeAll(async () => {
    const { createServer } = await import("../../src/server.js");
    server = createServer(0);
    port = server.port;
  });

  afterAll(() => {
    server?.stop();
  });

  beforeEach(() => {
    mockTerminal = null;
  });

  const connectWS = (project: string, session?: string): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      const params = new URLSearchParams({ project });
      if (session) {
        params.set("session", session);
      }
      params.set("create", "true");
      const url = `ws://localhost:${port}/terminal?${params}`;
      const ws = new WebSocket(url);

      ws.addEventListener("open", () => resolve(ws));
      ws.addEventListener("error", (e) => reject(e));

      // Timeout after 5 seconds
      setTimeout(() => reject(new Error("Connection timeout")), 5000);
    });
  };

  const waitForClose = (url: string): Promise<number> => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      const timeout = setTimeout(() => reject(new Error("Timeout")), 5000);
      ws.addEventListener("close", (e) => {
        clearTimeout(timeout);
        resolve(e.code);
      });
      ws.addEventListener("error", () => {
        // Ignore errors, wait for close
      });
    });
  };

  describe("Connection", () => {
    it("connects successfully with allowed project", async () => {
      const ws = await connectWS("allowed-project");
      expect(ws.readyState).toBe(WebSocket.OPEN);
      ws.close();
    });

    it("rejects connection for non-whitelisted project", async () => {
      // Bun.serve returns 403 for rejected upgrades, which causes an error
      const result = await new Promise<"rejected">((resolve, reject) => {
        const ws = new WebSocket(
          `ws://localhost:${port}/terminal?project=not-allowed&create=true`
        );
        const timeout = setTimeout(() => reject(new Error("Timeout")), 5000);
        ws.addEventListener("error", () => {
          clearTimeout(timeout);
          resolve("rejected");
        });
        ws.addEventListener("open", () => {
          clearTimeout(timeout);
          ws.close();
          reject(new Error("Expected connection to be rejected"));
        });
      });

      expect(result).toBe("rejected");
    });

    it("rejects connection without project", async () => {
      const result = await new Promise<"rejected">((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${port}/terminal`);
        const timeout = setTimeout(() => reject(new Error("Timeout")), 5000);
        ws.addEventListener("error", () => {
          clearTimeout(timeout);
          resolve("rejected");
        });
        ws.addEventListener("open", () => {
          clearTimeout(timeout);
          ws.close();
          reject(new Error("Expected connection to be rejected"));
        });
      });

      expect(result).toBe("rejected");
    });

    it("accepts custom session name", async () => {
      const ws = await connectWS("allowed-project", "custom-session-42");
      expect(ws.readyState).toBe(WebSocket.OPEN);
      ws.close();
    });
  });

  describe("Message handling", () => {
    it("responds to ping with pong", async () => {
      const ws = await connectWS("allowed-project");

      const response = await new Promise<any>((resolve) => {
        ws.addEventListener("message", (event) => {
          try {
            const msg = JSON.parse(
              typeof event.data === "string"
                ? event.data
                : event.data.toString()
            );
            if (msg.type === "pong") {
              resolve(msg);
            }
          } catch {
            // Not JSON, skip
          }
        });
        ws.send(JSON.stringify({ type: "ping" }));
      });

      expect(response.type).toBe("pong");
      ws.close();
    });

    it("forwards input to terminal", async () => {
      const ws = await connectWS("allowed-project");

      // Wait for terminal to be created
      await new Promise((r) => setTimeout(r, 100));

      ws.send(JSON.stringify({ type: "input", data: "ls -la\n" }));

      // Wait for message processing
      await new Promise((r) => setTimeout(r, 100));

      expect(mockTerminal.write).toHaveBeenCalledWith("ls -la\n");
      ws.close();
    });

    it("forwards resize to terminal", async () => {
      const ws = await connectWS("allowed-project");

      // Wait for terminal to be created
      await new Promise((r) => setTimeout(r, 100));

      ws.send(JSON.stringify({ type: "resize", cols: 120, rows: 40 }));

      // Wait for message processing
      await new Promise((r) => setTimeout(r, 100));

      expect(mockTerminal.resize).toHaveBeenCalledWith(120, 40);
      ws.close();
    });

    it("handles start-claude message", async () => {
      const ws = await connectWS("allowed-project");

      // Wait for terminal to be created
      await new Promise((r) => setTimeout(r, 100));

      ws.send(JSON.stringify({ type: "start-claude" }));

      // Wait for message processing
      await new Promise((r) => setTimeout(r, 100));

      // Should write claude command to terminal
      expect(mockTerminal.write).toHaveBeenCalled();
      ws.close();
    });

    it("handles request-history message", async () => {
      const ws = await connectWS("allowed-project");

      // Wait for terminal to be created
      await new Promise((r) => setTimeout(r, 100));

      const historyResponse = await new Promise<any>((resolve) => {
        ws.addEventListener("message", (event) => {
          try {
            const msg = JSON.parse(
              typeof event.data === "string"
                ? event.data
                : event.data.toString()
            );
            if (msg.type === "history") {
              resolve(msg);
            }
          } catch {
            // Not JSON, skip
          }
        });
        ws.send(JSON.stringify({ type: "request-history", lines: 100 }));
      });

      expect(historyResponse.type).toBe("history");
      expect(historyResponse.data).toBeDefined();
      ws.close();
    });

    it("ignores invalid JSON messages", async () => {
      const ws = await connectWS("allowed-project");

      // This should not crash the server
      ws.send("not json");
      ws.send("{invalid}");

      // Wait for error handling
      await new Promise((r) => setTimeout(r, 100));

      // Connection should still be open
      expect(ws.readyState).toBe(WebSocket.OPEN);
      ws.close();
    });

    it("ignores unknown message types", async () => {
      const ws = await connectWS("allowed-project");

      ws.send(JSON.stringify({ type: "unknown-type" }));

      // Wait for message processing
      await new Promise((r) => setTimeout(r, 100));

      // Connection should still be open
      expect(ws.readyState).toBe(WebSocket.OPEN);
      ws.close();
    });
  });

  describe("Terminal output", () => {
    it("forwards terminal output to client", async () => {
      const ws = await connectWS("allowed-project");

      // Wait for terminal to be created
      await new Promise((r) => setTimeout(r, 100));

      const output = await new Promise<string>((resolve) => {
        ws.addEventListener("message", (event) => {
          const data =
            typeof event.data === "string" ? event.data : event.data.toString();
          // Skip JSON messages (like history)
          if (!data.startsWith("{")) {
            resolve(data);
          }
        });

        // Simulate terminal output
        mockTerminal.emitData("Hello, World!");
      });

      expect(output).toBe("Hello, World!");
      ws.close();
    });
  });

  describe("Connection cleanup", () => {
    it("detaches terminal on close", async () => {
      const ws = await connectWS("allowed-project");

      // Wait for terminal to be created
      await new Promise((r) => setTimeout(r, 100));

      ws.close();

      // Wait for close handling
      await new Promise((r) => setTimeout(r, 100));

      expect(mockTerminal.detach).toHaveBeenCalled();
    });
  });
});
