/**
 * Session API routes: list, preview, kill, archive tmux sessions.
 * Simplified version without spawn, worktree, push, or PR features.
 */

import type { WSSessionInfo } from "247-shared";
import * as sessionsDb from "../db/sessions.js";
import { json, type Route, route } from "../router.js";
import {
  broadcastSessionArchived,
  broadcastSessionRemoved,
  broadcastStatusUpdate,
} from "../websocket-handlers.js";

export function sessionRoutes(): Route[] {
  return [
    // Get session output (terminal scrollback)
    route(
      "GET",
      "/api/sessions/:sessionName/output",
      async (_req, url, params) => {
        const { sessionName } = params;
        const lines =
          Number.parseInt(url.searchParams.get("lines") ?? "") || 1000;
        const format = url.searchParams.get("format") || "plain";
        const { exec } = await import("child_process");
        const { promisify } = await import("util");
        const execAsync = promisify(exec);

        if (!/^[\w-]+$/.test(sessionName)) {
          return json({ error: "Invalid session name" }, 400);
        }

        // Limit lines to prevent memory issues
        const maxLines = Math.min(lines, 50_000);

        try {
          const { stdout } = await execAsync(
            `tmux capture-pane -t "${sessionName}" -p -S -${maxLines} -J 2>/dev/null`
          );

          let output = stdout;

          // Strip ANSI codes if plain format requested
          if (format === "plain") {
            // eslint-disable-next-line no-control-regex
            output = output.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "");
          }

          const outputLines = output.split("\n");

          // Check if session is still running
          let isRunning = true;
          try {
            await execAsync(`tmux has-session -t "${sessionName}" 2>/dev/null`);
          } catch {
            isRunning = false;
          }

          return json({
            sessionName,
            output,
            totalLines: outputLines.length,
            returnedLines: outputLines.length,
            isRunning,
            capturedAt: Date.now(),
            source: "live" as const,
          });
        } catch {
          return json({ error: "Session not found" }, 404);
        }
      }
    ),

    // Send input to a session
    route(
      "POST",
      "/api/sessions/:sessionName/input",
      async (req, _url, params) => {
        const { sessionName } = params;
        const { text, sendEnter = true } = (await req.json()) as {
          text: string;
          sendEnter?: boolean;
        };
        const { exec } = await import("child_process");
        const { promisify } = await import("util");
        const execAsync = promisify(exec);

        if (!/^[\w-]+$/.test(sessionName)) {
          return json({ success: false, error: "Invalid session name" }, 400);
        }

        if (!text || typeof text !== "string") {
          return json({ success: false, error: "Text is required" }, 400);
        }

        try {
          // Check if session exists
          await execAsync(`tmux has-session -t "${sessionName}" 2>/dev/null`);

          // Escape special characters for tmux send-keys
          const escapedText = text
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"')
            .replace(/;/g, "\\;");

          // Send the text
          if (sendEnter) {
            await execAsync(
              `tmux send-keys -t "${sessionName}" "${escapedText}" Enter`
            );
          } else {
            await execAsync(
              `tmux send-keys -t "${sessionName}" "${escapedText}"`
            );
          }

          // Update last activity
          sessionsDb.upsertSession(sessionName, {
            lastEvent: "Input sent",
          });

          return json({
            success: true,
            sessionName,
            bytesSent: text.length,
          });
        } catch {
          return json({ success: false, error: "Session not found" }, 404);
        }
      }
    ),

    // Enhanced sessions endpoint with detailed info
    route("GET", "/api/sessions", async () => {
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);

      try {
        const { stdout } = await execAsync(
          'tmux list-sessions -F "#{session_name}|#{session_created}" 2>/dev/null'
        );

        const sessions: WSSessionInfo[] = [];

        for (const line of stdout.trim().split("\n").filter(Boolean)) {
          const [name, created] = line.split("|");
          const [project] = name.split("--");

          // Get DB data if available
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

        return json(sessions);
      } catch {
        return json([]);
      }
    }),

    // Get archived sessions
    route("GET", "/api/sessions/archived", () => {
      const archivedSessions = sessionsDb.getArchivedSessions();

      const sessions: WSSessionInfo[] = archivedSessions.map((session) => ({
        name: session.name,
        project: session.project,
        createdAt: session.created_at,
        lastEvent: session.last_event ?? undefined,
        archivedAt: session.archived_at ?? undefined,
      }));

      return json(sessions);
    }),

    // Get single session info by name
    route("GET", "/api/sessions/:sessionName/status", (_req, _url, params) => {
      const { sessionName } = params;

      if (!/^[\w-]+$/.test(sessionName)) {
        return json({ error: "Invalid session name" }, 400);
      }

      const dbSession = sessionsDb.getSession(sessionName);

      if (!dbSession) {
        return json({ error: "Session not found" }, 404);
      }

      const sessionInfo: WSSessionInfo = {
        name: sessionName,
        project: dbSession.project,
        createdAt: dbSession.created_at,
        lastEvent: dbSession.last_event ?? undefined,
        lastActivity: dbSession.last_activity,
        archivedAt: dbSession.archived_at ?? undefined,
        status: dbSession.status ?? undefined,
        statusSource: dbSession.status_source ?? undefined,
        attentionReason: dbSession.attention_reason ?? undefined,
        lastStatusChange: dbSession.last_status_change ?? undefined,
      };

      return json(sessionInfo);
    }),

    // Acknowledge session - reset needs_attention status
    route(
      "POST",
      "/api/sessions/:sessionName/acknowledge",
      (_req, _url, params) => {
        const { sessionName } = params;

        if (!/^[\w-]+$/.test(sessionName)) {
          return json({ error: "Invalid session name" }, 400);
        }

        const session = sessionsDb.getSession(sessionName);
        if (!session) {
          return json({ error: "Session not found" }, 404);
        }

        // Only reset if currently needs_attention
        if (session.status === "needs_attention") {
          const updatedSession = sessionsDb.upsertSession(sessionName, {
            status: "working",
            attentionReason: null,
          });

          // Broadcast status change to all WebSocket clients
          broadcastStatusUpdate({
            name: sessionName,
            project: updatedSession.project,
            status: "working",
            attentionReason: undefined,
            statusSource: "hook",
            createdAt: updatedSession.created_at,
            lastActivity: updatedSession.last_activity,
          });
        }

        return json({ success: true });
      }
    ),

    // Get terminal preview (last N lines from tmux pane)
    route(
      "GET",
      "/api/sessions/:sessionName/preview",
      async (_req, _url, params) => {
        const { sessionName } = params;
        const { exec } = await import("child_process");
        const { promisify } = await import("util");
        const execAsync = promisify(exec);

        if (!/^[\w-]+$/.test(sessionName)) {
          return json({ error: "Invalid session name" }, 400);
        }

        try {
          const { stdout } = await execAsync(
            `tmux capture-pane -t "${sessionName}" -p -S -20 2>/dev/null`
          );

          const allLines = stdout.split("\n");
          const lines = allLines
            .slice(-16, -1)
            .filter(
              (line) =>
                line.trim() !== "" ||
                allLines.indexOf(line) > allLines.length - 5
            );

          return json({
            lines: lines.length > 0 ? lines : ["(empty terminal)"],
            timestamp: Date.now(),
          });
        } catch {
          return json({ error: "Session not found" }, 404);
        }
      }
    ),

    // Kill a tmux session
    route(
      "DELETE",
      "/api/sessions/:sessionName",
      async (_req, _url, params) => {
        const { sessionName } = params;
        const { exec } = await import("child_process");
        const { promisify } = await import("util");
        const execAsync = promisify(exec);

        if (!/^[\w-]+$/.test(sessionName)) {
          return json({ error: "Invalid session name" }, 400);
        }

        try {
          await execAsync(`tmux kill-session -t "${sessionName}" 2>/dev/null`);
          console.log(`Killed tmux session: ${sessionName}`);

          sessionsDb.deleteSession(sessionName);
          broadcastSessionRemoved(sessionName);

          return json({
            success: true,
            message: `Session ${sessionName} killed`,
          });
        } catch {
          return json({ error: "Session not found or already killed" }, 404);
        }
      }
    ),

    // Archive a session (mark as done and keep in history)
    route(
      "POST",
      "/api/sessions/:sessionName/archive",
      async (_req, _url, params) => {
        const { sessionName } = params;
        const { exec } = await import("child_process");
        const { promisify } = await import("util");
        const execAsync = promisify(exec);

        if (!/^[\w-]+$/.test(sessionName)) {
          return json({ error: "Invalid session name" }, 400);
        }

        const archivedSession = sessionsDb.archiveSession(sessionName);
        if (!archivedSession) {
          return json({ error: "Session not found" }, 404);
        }

        try {
          await execAsync(`tmux kill-session -t "${sessionName}" 2>/dev/null`);
          console.log(`[Archive] Killed tmux session: ${sessionName}`);
        } catch {
          console.log(`[Archive] Tmux session ${sessionName} was already gone`);
        }

        const archivedInfo: WSSessionInfo = {
          name: sessionName,
          project: archivedSession.project,
          createdAt: archivedSession.created_at,
          lastEvent: archivedSession.last_event ?? undefined,
          archivedAt: archivedSession.archived_at ?? undefined,
        };

        broadcastSessionArchived(sessionName, archivedInfo);

        return json({
          success: true,
          message: `Session ${sessionName} archived`,
          session: archivedInfo,
        });
      }
    ),
  ];
}
