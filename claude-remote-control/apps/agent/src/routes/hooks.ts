/**
 * Hook API routes for Claude Code / Codex hook notifications.
 * Receives status updates from hook scripts and broadcasts to WebSocket subscribers.
 */

import type {
  AttentionNotification,
  AttentionReason,
  SessionStatus,
  StatusSource,
} from "247-shared";
import { loadConfig } from "../config.js";
import * as sessionsDb from "../db/sessions.js";
import { json, type Route, route } from "../router.js";
import { broadcastStatusUpdate } from "../websocket-handlers.js";

const WEB_PUSH_URL = "https://247.quivr.com/api/push/notify";

/**
 * Send push notification to web API
 */
async function sendPushNotification(sessionName: string): Promise<void> {
  try {
    const config = loadConfig();
    const machineId = config.machine.id;

    if (!machineId) {
      console.log("[Hooks] No machineId configured, skipping push");
      return;
    }

    const response = await fetch(WEB_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ machineId, sessionName }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(
        `[Hooks] Push notification failed: ${response.status} ${error}`
      );
      return;
    }

    const result = await response.json();
    console.log(`[Hooks] Push notification: ${result.sent} sent`);
  } catch (_err) {
    // Don't log full error to avoid noise - push is best effort
    console.log("[Hooks] Push notification skipped (web unreachable)");
  }
}

/**
 * Validate that a value is a valid SessionStatus
 */
function isValidStatus(value: unknown): value is SessionStatus {
  return (
    value === "init" ||
    value === "working" ||
    value === "needs_attention" ||
    value === "idle"
  );
}

/**
 * Validate that a value is a valid AttentionReason (accepts any string for pass-through)
 */
function isValidAttentionReason(value: unknown): value is AttentionReason {
  return typeof value === "string" || value === null || value === undefined;
}

/**
 * Validate that a value is a valid StatusSource
 */
function isValidStatusSource(value: unknown): value is StatusSource {
  return value === "hook" || value === "tmux";
}

export function hooksRoutes(): Route[] {
  return [
    route("POST", "/api/hooks/status", async (req) => {
      try {
        const notification = (await req.json()) as AttentionNotification;

        // Validate required fields
        if (
          !notification.sessionId ||
          typeof notification.sessionId !== "string"
        ) {
          return json({ error: "sessionId is required" }, 400);
        }

        if (!isValidStatus(notification.status)) {
          return json({ error: "Invalid status value" }, 400);
        }

        if (!isValidAttentionReason(notification.attentionReason)) {
          return json({ error: "Invalid attentionReason value" }, 400);
        }

        if (!isValidStatusSource(notification.source)) {
          return json({ error: "Invalid source value" }, 400);
        }

        const sessionName = notification.sessionId;
        const now = Date.now();

        console.log(
          `[Hooks] Received status update: session=${sessionName} status=${notification.status} reason=${notification.attentionReason} event=${notification.eventType}`
        );

        // Check if session exists in DB
        let session = sessionsDb.getSession(sessionName);

        if (session) {
          session = sessionsDb.upsertSession(sessionName, {
            status: notification.status,
            statusSource: notification.source,
            attentionReason: notification.attentionReason,
            lastEvent: notification.eventType,
            lastActivity: now,
          });
        } else {
          const [project] = sessionName.split("--");
          session = sessionsDb.upsertSession(sessionName, {
            project,
            status: notification.status,
            statusSource: notification.source,
            attentionReason: notification.attentionReason,
            lastEvent: notification.eventType,
            lastActivity: now,
          });
          console.log(`[Hooks] Created new session from hook: ${sessionName}`);
        }

        // Broadcast status update to WebSocket subscribers
        broadcastStatusUpdate({
          name: session.name,
          project: session.project,
          createdAt: session.created_at,
          lastActivity: session.last_activity,
          lastEvent: session.last_event ?? undefined,
          archivedAt: session.archived_at ?? undefined,
          status: session.status ?? undefined,
          statusSource: session.status_source ?? undefined,
          attentionReason: session.attention_reason ?? undefined,
          lastStatusChange: session.last_status_change ?? undefined,
        });

        // Send push notification if needs_attention
        if (notification.status === "needs_attention") {
          sendPushNotification(sessionName).catch(() => {});
        }

        return json({
          success: true,
          sessionName,
          status: notification.status,
          attentionReason: notification.attentionReason,
        });
      } catch (err) {
        console.error("[Hooks] Error processing status update:", err);
        return json({ error: "Internal server error" }, 500);
      }
    }),
  ];
}
