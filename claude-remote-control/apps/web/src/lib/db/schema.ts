// ═══════════════════════════════════════════════════════════════════════════
// Database schema for web app (bun:sqlite)
// ═══════════════════════════════════════════════════════════════════════════

export const SCHEMA_VERSION = 1;

export const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    applied_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS agent_connection (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'local',
    machine_id TEXT,
    url TEXT NOT NULL,
    name TEXT NOT NULL,
    method TEXT NOT NULL DEFAULT 'tailscale',
    is_cloud INTEGER NOT NULL DEFAULT 0,
    cloud_agent_id TEXT,
    color TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_agent_connection_user ON agent_connection(user_id);
  CREATE INDEX IF NOT EXISTS idx_agent_connection_machine ON agent_connection(machine_id);

  CREATE TABLE IF NOT EXISTS user_settings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'local',
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_user_settings_user_key ON user_settings(user_id, key);

  CREATE TABLE IF NOT EXISTS push_subscription (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'local',
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_push_subscription_user ON push_subscription(user_id);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subscription_endpoint ON push_subscription(endpoint);
`;

// ═══════════════════════════════════════════════════════════════════════════
// TypeScript interfaces (match DB column names)
// ═══════════════════════════════════════════════════════════════════════════

export interface DbAgentConnection {
  cloud_agent_id: string | null;
  color: string | null;
  created_at: number;
  id: string;
  is_cloud: number;
  machine_id: string | null;
  method: string;
  name: string;
  updated_at: number;
  url: string;
  user_id: string;
}

export interface DbPushSubscription {
  auth: string;
  created_at: number;
  endpoint: string;
  id: string;
  p256dh: string;
  user_agent: string | null;
  user_id: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SQL fragments for SELECT with camelCase aliases (for API responses)
// ═══════════════════════════════════════════════════════════════════════════

export const SELECT_CONNECTION = `
  SELECT id, url, name, method, color,
    machine_id as machineId,
    is_cloud as isCloud,
    cloud_agent_id as cloudAgentId,
    created_at as createdAt,
    updated_at as updatedAt
  FROM agent_connection
`;
