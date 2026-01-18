// ============================================================================
// Database Row Types (Simplified - No Status Tracking)
// ============================================================================

export interface DbSession {
  id: number;
  name: string;
  project: string;
  last_event: string | null;
  last_activity: number;
  archived_at: number | null;
  created_at: number;
  updated_at: number;
}

export interface DbSchemaVersion {
  version: number;
  applied_at: number;
}

// ============================================================================
// Input Types for Operations
// ============================================================================

export interface UpsertSessionInput {
  project?: string;
  lastEvent?: string | null;
  lastActivity?: number;
}

// ============================================================================
// SQL Schema Definitions (v16 - Status Removed)
// ============================================================================

export const SCHEMA_VERSION = 16;

export const CREATE_TABLES_SQL = `
-- Sessions: current state of terminal sessions (simplified - no status tracking)
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  project TEXT NOT NULL,
  last_event TEXT,
  last_activity INTEGER NOT NULL,
  archived_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_name ON sessions(name);
CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity);

-- Schema version tracking
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at INTEGER NOT NULL
);
`;

// ============================================================================
// Migration for v16 (Remove status tracking)
// ============================================================================

export const MIGRATION_16 = `
-- Migration v16: Remove status tracking columns
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
`;

// ============================================================================
// Retention Configuration
// ============================================================================

export const RETENTION_CONFIG = {
  /** Max age for sessions before cleanup (24 hours) */
  sessionMaxAge: 24 * 60 * 60 * 1000,
  /** Max age for archived sessions before cleanup (30 days) */
  archivedMaxAge: 30 * 24 * 60 * 60 * 1000,
  /** Cleanup interval (1 hour) */
  cleanupInterval: 60 * 60 * 1000,
};
