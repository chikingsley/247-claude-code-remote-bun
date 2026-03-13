import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "fs";
import { dirname, join, resolve } from "path";
import { CREATE_TABLES_SQL, SCHEMA_VERSION } from "./schema";

// Database file location: ~/.247/data/web.db
const DATA_DIR = resolve(process.env.HOME || "~", ".247", "data");
const DB_PATH = join(DATA_DIR, "web.db");

// Singleton database instance
let db: Database | null = null;

/**
 * Get or create the database instance (lazy init)
 */
export function getDb(): Database {
  if (!db) {
    db = initDatabase();
  }
  return db;
}

/**
 * Initialize the database
 */
function initDatabase(dbPath?: string): Database {
  const path = dbPath ?? DB_PATH;

  // Create data directory if it doesn't exist
  const dataDir = dirname(path);
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  const database = new Database(path, { strict: true });

  // Enable WAL mode for better concurrent performance
  database.run("PRAGMA journal_mode = WAL");

  // Run migrations
  runMigrations(database);

  return database;
}

/**
 * Run database migrations
 */
function runMigrations(database: Database): void {
  // Check if schema_version table exists
  const tableExists = database
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_version'"
    )
    .get();

  if (!tableExists) {
    database.exec(CREATE_TABLES_SQL);
    database
      .prepare("INSERT INTO schema_version (version, applied_at) VALUES (?, ?)")
      .run(SCHEMA_VERSION, Date.now());
    return;
  }

  const row = database
    .prepare("SELECT version FROM schema_version ORDER BY version DESC LIMIT 1")
    .get() as { version: number } | undefined;

  if ((row?.version ?? 0) < SCHEMA_VERSION) {
    database.exec(CREATE_TABLES_SQL);
    database
      .prepare(
        "INSERT OR REPLACE INTO schema_version (version, applied_at) VALUES (?, ?)"
      )
      .run(SCHEMA_VERSION, Date.now());
  }
}

export type { DbAgentConnection, DbPushSubscription } from "./schema";
export { SELECT_CONNECTION } from "./schema";
