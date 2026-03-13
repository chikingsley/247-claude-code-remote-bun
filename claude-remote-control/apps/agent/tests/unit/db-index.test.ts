import { Database } from "bun:sqlite";
import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

// Mock fs module
mock.module("fs", () => ({
  existsSync: mock(),
  mkdirSync: mock(),
  readFileSync: mock(),
}));

// Mock schema module (v17 - must match all exports from schema.ts)
mock.module("../../src/db/schema.js", () => ({
  CREATE_TABLES_SQL: `
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      project TEXT NOT NULL,
      last_event TEXT,
      last_activity INTEGER NOT NULL,
      archived_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      status TEXT,
      status_source TEXT,
      attention_reason TEXT,
      last_status_change INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_name ON sessions(name);
    CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project);
    CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity);
    CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at INTEGER NOT NULL
    );
  `,
  SCHEMA_VERSION: 17,
  MIGRATION_16: `
    CREATE TABLE IF NOT EXISTS sessions_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      project TEXT NOT NULL,
      last_event TEXT,
      last_activity INTEGER NOT NULL,
      archived_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    INSERT OR IGNORE INTO sessions_new (id, name, project, last_event, last_activity, archived_at, created_at, updated_at)
    SELECT id, name, project, last_event, last_activity, archived_at, created_at, updated_at
    FROM sessions;
    DROP TABLE IF EXISTS sessions;
    ALTER TABLE sessions_new RENAME TO sessions;
    CREATE INDEX IF NOT EXISTS idx_sessions_name ON sessions(name);
    CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project);
    CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity);
  `,
  RETENTION_CONFIG: {
    sessionMaxAge: 24 * 60 * 60 * 1000,
    archivedMaxAge: 30 * 24 * 60 * 60 * 1000,
    cleanupInterval: 60 * 60 * 1000,
  },
}));

describe("Database Index", () => {
  beforeEach(() => {
    // Re-mock modules to get fresh state
  });

  afterEach(async () => {
    // Try to close database if it was opened
    try {
      const { closeDatabase } = await import("../../src/db/index.js");
      closeDatabase();
    } catch {
      // Ignore errors
    }
  });

  describe("getDatabase", () => {
    it("throws error if database not initialized", async () => {
      const { getDatabase } = await import("../../src/db/index.js");

      expect(() => getDatabase()).toThrow("Database not initialized");
    });

    it("returns database instance after initialization", async () => {
      const { initTestDatabase, getDatabase } = await import(
        "../../src/db/index.js"
      );

      initTestDatabase();
      const db = getDatabase();

      expect(db).toBeDefined();
      expect(db).toBeInstanceOf(Database);
    });
  });

  describe("initTestDatabase", () => {
    it("creates in-memory database", async () => {
      const { initTestDatabase } = await import("../../src/db/index.js");

      const db = initTestDatabase();

      expect(db).toBeDefined();
      expect(db).toBeInstanceOf(Database);
    });

    it("creates tables in database", async () => {
      const { initTestDatabase } = await import("../../src/db/index.js");

      const db = initTestDatabase();

      // Check that tables exist
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all() as Array<{ name: string }>;

      const tableNames = tables.map((t) => t.name);
      expect(tableNames).toContain("schema_version");
      expect(tableNames).toContain("sessions");
    });

    it("sets schema version", async () => {
      const { initTestDatabase } = await import("../../src/db/index.js");

      const db = initTestDatabase();

      const version = db
        .prepare(
          "SELECT version FROM schema_version ORDER BY version DESC LIMIT 1"
        )
        .get() as { version: number };

      expect(version.version).toBe(17);
    });
  });

  // Note: initDatabase with file paths is implicitly tested by other agent integration tests
  // The core database functionality (migrations, tables, stats) is tested via initTestDatabase

  describe("closeDatabase", () => {
    it("closes database connection", async () => {
      const { initTestDatabase, closeDatabase, getDatabase } = await import(
        "../../src/db/index.js"
      );

      initTestDatabase();
      closeDatabase();

      // After close, getDatabase should throw
      expect(() => getDatabase()).toThrow("Database not initialized");
    });

    it("handles multiple close calls gracefully", async () => {
      const { initTestDatabase, closeDatabase } = await import(
        "../../src/db/index.js"
      );

      initTestDatabase();
      closeDatabase();
      closeDatabase(); // Should not throw
    });
  });

  describe("getDatabaseStats", () => {
    it("returns counts for sessions table", async () => {
      const { initTestDatabase, getDatabaseStats } = await import(
        "../../src/db/index.js"
      );

      const db = initTestDatabase();
      const now = Date.now();

      // Insert test data
      db.prepare(
        `
        INSERT INTO sessions (name, project, status, last_activity, last_status_change, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      ).run("Session-1", "project1", "init", now, now, now, now);

      const stats = getDatabaseStats();

      expect(stats.sessions).toBe(1);
    });

    it("returns zeros for empty database", async () => {
      const { initTestDatabase, getDatabaseStats } = await import(
        "../../src/db/index.js"
      );

      initTestDatabase();

      const stats = getDatabaseStats();

      expect(stats.sessions).toBe(0);
    });
  });

  describe("Schema migrations", () => {
    it("creates all required columns", async () => {
      const { initTestDatabase } = await import("../../src/db/index.js");

      const db = initTestDatabase();

      // Check sessions table has archived_at column
      const sessionColumns = db
        .prepare("PRAGMA table_info(sessions)")
        .all() as Array<{ name: string }>;
      const sessionColumnNames = sessionColumns.map((c) => c.name);
      expect(sessionColumnNames).toContain("archived_at");
    });
  });
});
