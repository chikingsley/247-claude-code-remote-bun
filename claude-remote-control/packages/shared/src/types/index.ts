// ============================================================================
// Session Status Types (Hook-based attention notifications)
// ============================================================================

export type SessionStatus = "init" | "working" | "needs_attention" | "idle";
// AttentionReason is now a pass-through from Claude Code's notification_type
// Known values: permission_prompt, input_request, plan_mode, task_complete, input (from Stop hook)
// Using string to allow any future types from Claude Code
export type AttentionReason = string;
export type StatusSource = "hook" | "tmux";

export interface AttentionNotification {
  attentionReason?: AttentionReason;
  eventType: string;
  sessionId: string;
  source: StatusSource;
  status: SessionStatus;
  timestamp: number;
}

// ============================================================================
// Machine types
export interface Machine {
  config: MachineConfig | null;
  createdAt: Date;
  id: string;
  lastSeen: Date | null;
  name: string;
  status: "online" | "offline";
}

export interface MachineConfig {
  agentUrl?: string; // e.g., "localhost:4678" or "mac.tailnet.ts.net:4678"
  projects: string[];
}

// Session types
export interface Session {
  endedAt: Date | null;
  id: string;
  machineId: string;
  project: string | null;
  startedAt: Date;
  tmuxSession: string | null;
}

// User types
export interface User {
  createdAt: Date;
  email: string;
  id: string;
  name: string | null;
}

// WebSocket message types - Client to Agent (Terminal)
export type WSMessageToAgent =
  | { type: "input"; data: string }
  | { type: "resize"; cols: number; rows: number }
  | { type: "start-claude" }
  | { type: "ping" }
  | { type: "request-history"; lines?: number };

// WebSocket message types - Agent to Client (Terminal)
export type WSMessageFromAgent =
  | { type: "output"; data: string }
  | { type: "connected"; session: string }
  | { type: "disconnected" }
  | { type: "pong" }
  | { type: "history"; data: string; lines: number };

// Session info for WebSocket (simplified)
export interface WSSessionInfo {
  archivedAt?: number; // Timestamp when session was archived (undefined = active)
  attentionReason?: AttentionReason;
  createdAt: number;
  lastActivity?: number;
  lastEvent?: string;
  lastStatusChange?: number;
  name: string;
  project: string;
  // Status tracking (from hooks)
  status?: SessionStatus;
  statusSource?: StatusSource;
}

// WebSocket message types - Agent to Client (Sessions channel)
export type WSSessionsMessageFromAgent =
  | { type: "sessions-list"; sessions: WSSessionInfo[] }
  | { type: "session-removed"; sessionName: string }
  | { type: "session-archived"; sessionName: string; session: WSSessionInfo }
  | { type: "status-update"; session: WSSessionInfo }
  | { type: "version-info"; agentVersion: string }
  | { type: "update-pending"; targetVersion: string; message: string };

// API types
export interface RegisterMachineRequest {
  config?: MachineConfig;
  id: string;
  name: string;
}

export interface AgentInfo {
  machine: {
    id: string;
    name: string;
  };
  projects: string[];
  status: "online" | "offline";
}

// Session archive
export interface ArchiveSessionResponse {
  message: string;
  session?: WSSessionInfo;
  success: boolean;
}

// Session output capture
export interface SessionOutputResponse {
  capturedAt: number;
  isRunning: boolean;
  output: string;
  returnedLines: number;
  sessionName: string;
  source?: "live" | "file" | "database";
  totalLines: number;
}

// Session input
export interface SessionInputRequest {
  sendEnter?: boolean; // Default true
  text: string;
}

export interface SessionInputResponse {
  bytesSent?: number;
  error?: string;
  sessionName?: string;
  success: boolean;
}

// Agent configuration
export interface AgentConfig {
  agent?: {
    port: number;
    url: string; // e.g., "localhost:4678" or "mac.tailnet.ts.net:4678"
  };
  dashboard: {
    apiUrl: string;
    apiKey: string;
  };
  machine: {
    id: string;
    name: string;
  };
  projects: {
    basePath: string;
    whitelist: string[];
  };
}
