/**
 * WebSocket handlers for terminal connections and sessions subscriptions.
 * Uses Bun's native ServerWebSocket with typed ws.data for connection state.
 */

import type {
  WSMessageToAgent,
  WSSessionInfo,
  WSSessionsMessageFromAgent,
} from "247-shared";
import type { ServerWebSocket } from "bun";
import { execSync } from "child_process";
import { existsSync } from "fs";
import { config } from "./config.js";
import * as sessionsDb from "./db/sessions.js";
import { createTerminal } from "./terminal.js";
import { isUpdateInProgress, triggerUpdate } from "./updater.js";
import { getAgentVersion, needsUpdate } from "./version.js";

// ── Connection state stored in ws.data ──────────────────────────────────

interface TerminalWSData {
  messageBuffer: string[];
  project: string;
  projectPath: string;
  sessionName: string;
  setupComplete: boolean;
  terminal: ReturnType<typeof createTerminal> | null;
  type: "terminal";
}

interface SessionsWSData {
  type: "sessions";
  url: URL;
}

export type WSData = TerminalWSData | SessionsWSData;

// ── Connection tracking ─────────────────────────────────────────────────

const activeConnections = new Map<string, Set<ServerWebSocket<WSData>>>();
const sessionsSubscribers = new Set<ServerWebSocket<WSData>>();

// Generate unique session name
let sessionCounter = 0;
function generateSessionName(project: string): string {
  const timestamp = Date.now().toString(36);
  const counter = (sessionCounter++).toString(36);
  return `${project}--${timestamp}${counter}`;
}

function tmuxSessionExists(sessionName: string): boolean {
  try {
    execSync(`tmux has-session -t "${sessionName}" 2>/dev/null`);
    return true;
  } catch {
    return false;
  }
}

// ── Broadcast helpers ───────────────────────────────────────────────────

function broadcast(payload: string): void {
  for (const ws of sessionsSubscribers) {
    try {
      ws.send(payload);
    } catch {
      // Connection may have closed between iteration steps
    }
  }
}

export function broadcastSessionRemoved(sessionName: string): void {
  const message: WSSessionsMessageFromAgent = {
    type: "session-removed",
    sessionName,
  };
  broadcast(JSON.stringify(message));
}

export function broadcastSessionArchived(
  sessionName: string,
  session: WSSessionInfo
): void {
  const message: WSSessionsMessageFromAgent = {
    type: "session-archived",
    sessionName,
    session,
  };
  broadcast(JSON.stringify(message));
}

export function broadcastStatusUpdate(session: WSSessionInfo): void {
  const message: WSSessionsMessageFromAgent = {
    type: "status-update",
    session,
  };
  console.log(
    `[Sessions WS] Broadcasting status update: session=${session.name} status=${session.status} reason=${session.attentionReason}`
  );
  broadcast(JSON.stringify(message));
}

export function broadcastUpdatePending(
  targetVersion: string,
  message: string
): void {
  const msg: WSSessionsMessageFromAgent = {
    type: "update-pending",
    targetVersion,
    message,
  };
  broadcast(JSON.stringify(msg));
}

// ── Upgrade: prepare ws.data before the socket opens ────────────────────

export function prepareTerminalUpgrade(url: URL): WSData | null {
  const project = url.searchParams.get("project");
  const urlSessionName = url.searchParams.get("session");
  const createFlag = url.searchParams.get("create") === "true";
  const sessionName = urlSessionName || generateSessionName(project || "root");

  // Validate project
  const whitelist = config.projects.whitelist as string[];
  const hasWhitelist = whitelist && whitelist.length > 0;
  const isRootTerminal = project === "";
  const isAllowed =
    isRootTerminal || (hasWhitelist ? whitelist.includes(project!) : true);
  if (project === null || project === undefined || !isAllowed) {
    return null; // Reject upgrade
  }

  const basePath = config.projects.basePath.replace("~", process.env.HOME!);
  const projectPath = isRootTerminal ? basePath : `${basePath}/${project}`;

  // Check path exists
  if (!existsSync(projectPath)) {
    return null;
  }

  // Check session exists or create flag set
  const sessionExists = tmuxSessionExists(sessionName);
  if (!(sessionExists || createFlag)) {
    return null;
  }

  return {
    type: "terminal",
    sessionName,
    project: project!,
    projectPath,
    terminal: null,
    setupComplete: false,
    messageBuffer: [],
  };
}

// ── Bun WebSocket handlers ──────────────────────────────────────────────

export const websocketHandlers = {
  open(ws: ServerWebSocket<WSData>) {
    if (ws.data.type === "sessions") {
      handleSessionsOpen(ws);
    } else {
      handleTerminalOpen(ws);
    }
  },

  message(ws: ServerWebSocket<WSData>, msg: string | Buffer) {
    if (ws.data.type === "terminal") {
      handleTerminalMessage(ws, msg);
    }
    // Sessions WS is server-push only
  },

  close(ws: ServerWebSocket<WSData>) {
    if (ws.data.type === "sessions") {
      handleSessionsClose(ws);
    } else {
      handleTerminalClose(ws);
    }
  },
};

// ── Terminal WS lifecycle ───────────────────────────────────────────────

function handleTerminalOpen(ws: ServerWebSocket<WSData>): void {
  const data = ws.data as TerminalWSData;

  console.log(`New terminal connection for project: ${data.project}`);
  console.log(`Project path: ${data.projectPath}`);

  // Create terminal
  let terminal: ReturnType<typeof createTerminal>;
  try {
    terminal = createTerminal(data.projectPath, data.sessionName, {});
    data.terminal = terminal;
  } catch (err) {
    console.error("Failed to create terminal:", err);
    ws.close(1011, "Failed to create terminal");
    return;
  }

  // Track connection
  if (!activeConnections.has(data.sessionName)) {
    activeConnections.set(data.sessionName, new Set());
  }
  activeConnections.get(data.sessionName)!.add(ws);

  // Handle existing session reconnect
  if (terminal.isExistingSession()) {
    console.log(`Reconnecting to existing session '${data.sessionName}'`);
    terminal
      .captureHistory(10_000)
      .then((history) => {
        if (history) {
          try {
            ws.send(
              JSON.stringify({
                type: "history",
                data: history,
                lines: history.split("\n").length,
              })
            );
          } catch {
            // ws may have closed
          }
        }
      })
      .catch((err) => {
        console.error(
          `Failed to capture history for '${data.sessionName}':`,
          err
        );
      });
  } else {
    // New session - register in DB
    try {
      sessionsDb.upsertSession(data.sessionName, {
        project: data.project,
        lastEvent: "SessionCreated",
        lastActivity: Date.now(),
      });
    } catch (err) {
      console.error(`Failed to persist session '${data.sessionName}':`, err);
    }
  }

  // Forward terminal output to WS client
  terminal.onData((output: string) => {
    try {
      ws.send(output);
      if (output.length > 10 && !output.startsWith("\x1b")) {
        console.log(
          `[Terminal] Sending ${output.length} bytes to client: ${output.substring(0, 100).replace(/\n/g, "\\n")}...`
        );
      }
    } catch {
      // ws may have closed
    }
  });

  terminal.onExit(({ exitCode }: { exitCode: number }) => {
    console.log(`Terminal exited with code ${exitCode}`);
    try {
      ws.close(1000, "Terminal closed");
    } catch {
      // Already closed
    }
  });

  // Mark setup complete and flush buffered messages
  data.setupComplete = true;
  console.log(
    `[Terminal] Setup complete for '${data.sessionName}', processing ${data.messageBuffer.length} buffered messages`
  );
  for (const buffered of data.messageBuffer) {
    try {
      const msg: WSMessageToAgent = JSON.parse(buffered);
      console.log(`[Terminal] Processing buffered message type: ${msg.type}`);
      processTerminalMessage(msg, terminal, ws);
    } catch (err) {
      console.error("Failed to parse buffered message:", err);
    }
  }
  data.messageBuffer.length = 0;
}

function handleTerminalMessage(
  ws: ServerWebSocket<WSData>,
  raw: string | Buffer
): void {
  const data = ws.data as TerminalWSData;
  const msgStr = typeof raw === "string" ? raw : raw.toString();

  console.log(
    `[Terminal] Received message for '${data.sessionName}': ${msgStr.substring(0, 100)}...`
  );

  if (!(data.setupComplete && data.terminal)) {
    console.log("[Terminal] Buffering message (setup not complete)");
    data.messageBuffer.push(msgStr);
    return;
  }

  try {
    const msg: WSMessageToAgent = JSON.parse(msgStr);
    processTerminalMessage(msg, data.terminal, ws);
  } catch (err) {
    console.error("Failed to parse message:", err);
  }
}

function processTerminalMessage(
  msg: WSMessageToAgent,
  terminal: ReturnType<typeof createTerminal>,
  ws: ServerWebSocket<WSData>
): void {
  switch (msg.type) {
    case "input":
      terminal.write(msg.data);
      break;
    case "resize":
      terminal.resize(msg.cols, msg.rows);
      break;
    case "start-claude":
      terminal.write("claude\r");
      break;
    case "ping":
      ws.send(JSON.stringify({ type: "pong" }));
      break;
    case "request-history":
      terminal
        .captureHistory(msg.lines || 10_000)
        .then((history) => {
          try {
            ws.send(
              JSON.stringify({
                type: "history",
                data: history,
                lines: history.split("\n").length,
              })
            );
          } catch {
            // ws may have closed
          }
        })
        .catch((err) => console.error("Failed to capture history:", err));
      break;
  }
}

function handleTerminalClose(ws: ServerWebSocket<WSData>): void {
  const data = ws.data as TerminalWSData;

  console.log(
    `Client disconnected, tmux session '${data.sessionName}' preserved`
  );

  if (data.terminal) {
    data.terminal.detach();
  }

  const connections = activeConnections.get(data.sessionName);
  if (connections) {
    connections.delete(ws);
    if (connections.size === 0) {
      activeConnections.delete(data.sessionName);
    }
  }
}

// ── Sessions WS lifecycle ───────────────────────────────────────────────

function handleSessionsOpen(ws: ServerWebSocket<WSData>): void {
  const data = ws.data as SessionsWSData;

  console.log("[Sessions WS] New subscriber connected");
  sessionsSubscribers.add(ws);

  // Extract web version from query params
  const webVersion = data.url.searchParams.get("v");
  const agentVersion = getAgentVersion();

  // Send agent version info
  const versionMessage: WSSessionsMessageFromAgent = {
    type: "version-info",
    agentVersion,
  };
  ws.send(JSON.stringify(versionMessage));

  // Check if update needed
  const isCloudAgent = process.env.CLOUD_AGENT === "true";
  if (
    webVersion &&
    !isUpdateInProgress() &&
    !isCloudAgent &&
    needsUpdate(agentVersion, webVersion)
  ) {
    console.log(
      `[Update] Version mismatch detected: agent=${agentVersion} web=${webVersion}`
    );
    setTimeout(() => {
      triggerUpdate(webVersion);
    }, 2000);
  }

  // Send initial session list
  sendInitialSessionList(ws);
}

async function sendInitialSessionList(
  ws: ServerWebSocket<WSData>
): Promise<void> {
  try {
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);

    const { stdout } = await execAsync(
      'tmux list-sessions -F "#{session_name}|#{session_created}" 2>/dev/null'
    );

    const sessions: WSSessionInfo[] = [];

    for (const line of stdout.trim().split("\n").filter(Boolean)) {
      const [name, created] = line.split("|");
      const [project] = name.split("--");
      const dbSession = sessionsDb.getSession(name);

      sessions.push({
        name,
        project,
        createdAt: Number.parseInt(created) * 1000,
        lastActivity: dbSession?.last_activity,
        lastEvent: dbSession?.last_event ?? undefined,
        status: dbSession?.status ?? undefined,
        statusSource: dbSession?.status_source ?? undefined,
        attentionReason: dbSession?.attention_reason ?? undefined,
        lastStatusChange: dbSession?.last_status_change ?? undefined,
      });
    }

    const message: WSSessionsMessageFromAgent = {
      type: "sessions-list",
      sessions,
    };
    try {
      ws.send(JSON.stringify(message));
    } catch {
      // ws may have closed
    }
  } catch (err) {
    console.error("[Sessions WS] Failed to get initial sessions:", err);
    try {
      const message: WSSessionsMessageFromAgent = {
        type: "sessions-list",
        sessions: [],
      };
      ws.send(JSON.stringify(message));
    } catch {
      // ws may have closed
    }
  }
}

function handleSessionsClose(ws: ServerWebSocket<WSData>): void {
  sessionsSubscribers.delete(ws);
  console.log(
    `[Sessions WS] Subscriber disconnected (remaining: ${sessionsSubscribers.size})`
  );
}
