/**
 * Notification API route: receives hook notifications from Claude Code.
 * Handles permission requests, input prompts, and other attention-requiring events.
 */

import { Router, type Router as RouterType } from 'express';
import path from 'path';
import { execSync } from 'child_process';
import { tmuxSessionStatus, broadcastStatusUpdate, type HookStatus } from '../status.js';
import * as sessionsDb from '../db/sessions.js';
import { getEnvironmentMetadata, getSessionEnvironment } from '../db/environments.js';
import type { AttentionReason } from '247-shared';

const router: RouterType = Router();

/**
 * Check if a tmux session exists.
 * Prevents ghost sessions from being created by stale notifications.
 */
function tmuxSessionExists(sessionName: string): boolean {
  try {
    execSync(`tmux has-session -t "${sessionName}" 2>/dev/null`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Notification hook payload from Claude Code
 * Sent when Claude needs user attention (permission, input, etc.)
 */
interface NotificationPayload {
  tmux_session: string;
  session_id?: string;
  transcript_path?: string;
  cwd?: string;
  permission_mode?: string;
  hook_event_name?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
}

/**
 * Determine attention reason from notification payload
 */
function getAttentionReason(payload: NotificationPayload): AttentionReason {
  // If there's a tool_name, Claude is asking for permission to use that tool
  if (payload.tool_name) {
    return 'permission';
  }
  // Default to input if we can't determine the reason
  return 'input';
}

/**
 * Receive notification from Claude Code hook.
 * Updates session status to 'needs_attention'.
 */
router.post('/', (req, res) => {
  const payload: NotificationPayload = req.body;
  const { tmux_session } = payload;

  if (!tmux_session) {
    return res.status(400).json({ error: 'Missing tmux_session' });
  }

  // Validate that the tmux session actually exists
  if (!tmuxSessionExists(tmux_session)) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const now = Date.now();

  // Extract project from cwd or session name
  const project = payload.cwd
    ? path.basename(payload.cwd)
    : tmux_session.split('--')[0] || undefined;

  const existing = tmuxSessionStatus.get(tmux_session);
  const attentionReason = getAttentionReason(payload);
  const statusChanged = !existing || existing.status !== 'needs_attention';

  const hookData: HookStatus = {
    status: 'needs_attention',
    attentionReason,
    hasBeenWorking: existing?.hasBeenWorking ?? true,
    lastEvent: payload.tool_name ? `Permission: ${payload.tool_name}` : 'Notification',
    lastActivity: now,
    lastStatusChange: statusChanged ? now : existing?.lastStatusChange || now,
    project,
    transcriptPath: payload.transcript_path,
    // Preserve existing metrics
    model: existing?.model,
    costUsd: existing?.costUsd,
    contextUsage: existing?.contextUsage,
    linesAdded: existing?.linesAdded,
    linesRemoved: existing?.linesRemoved,
  };

  tmuxSessionStatus.set(tmux_session, hookData);

  // Persist to database
  const dbSession = sessionsDb.upsertSession(tmux_session, {
    project: project || tmux_session.split('--')[0] || '',
    status: 'needs_attention',
    attentionReason,
    lastEvent: hookData.lastEvent,
    lastActivity: now,
    lastStatusChange: statusChanged ? now : (existing?.lastStatusChange ?? now),
    // Preserve existing metrics
    model: existing?.model,
    costUsd: existing?.costUsd,
    contextUsage: existing?.contextUsage,
    linesAdded: existing?.linesAdded,
    linesRemoved: existing?.linesRemoved,
  });

  // Broadcast status change to dashboard
  if (statusChanged) {
    const envId = getSessionEnvironment(tmux_session);
    const envMeta = envId ? getEnvironmentMetadata(envId) : undefined;

    broadcastStatusUpdate({
      name: tmux_session,
      project: project || '',
      status: 'needs_attention',
      attentionReason,
      statusSource: 'hook',
      lastEvent: hookData.lastEvent,
      lastStatusChange: hookData.lastStatusChange,
      createdAt: dbSession?.created_at || now,
      lastActivity: now,
      environmentId: envId,
      environment: envMeta
        ? {
            id: envMeta.id,
            name: envMeta.name,
            provider: envMeta.provider,
            icon: envMeta.icon,
            isDefault: envMeta.isDefault,
          }
        : undefined,
      model: hookData.model,
      costUsd: hookData.costUsd,
      contextUsage: hookData.contextUsage,
      linesAdded: hookData.linesAdded,
      linesRemoved: hookData.linesRemoved,
    });

    console.log(
      `[Notification] ${tmux_session}: → needs_attention (${attentionReason}${payload.tool_name ? `: ${payload.tool_name}` : ''})`
    );
  }

  res.json({ ok: true });
});

export function createNotificationRoutes(): RouterType {
  return router;
}

export default router;
