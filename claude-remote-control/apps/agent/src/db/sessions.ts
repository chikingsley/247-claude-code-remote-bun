import { getDatabase } from './index.js';
import type { DbSession, UpsertSessionInput } from './schema.js';

/**
 * Get a session by name
 */
export function getSession(name: string): DbSession | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM sessions WHERE name = ?').get(name) as
    | DbSession
    | undefined;
  return row ?? null;
}

/**
 * Get all active (non-archived) sessions
 */
export function getAllSessions(): DbSession[] {
  const db = getDatabase();
  return db
    .prepare('SELECT * FROM sessions WHERE archived_at IS NULL ORDER BY last_activity DESC')
    .all() as DbSession[];
}

/**
 * Get all archived sessions
 */
export function getArchivedSessions(): DbSession[] {
  const db = getDatabase();
  return db
    .prepare('SELECT * FROM sessions WHERE archived_at IS NOT NULL ORDER BY archived_at DESC')
    .all() as DbSession[];
}

/**
 * Get sessions by project
 */
export function getSessionsByProject(project: string): DbSession[] {
  const db = getDatabase();
  return db
    .prepare('SELECT * FROM sessions WHERE project = ? ORDER BY last_activity DESC')
    .all(project) as DbSession[];
}

/**
 * Upsert a session (insert or update)
 */
export function upsertSession(name: string, input: UpsertSessionInput): DbSession {
  const db = getDatabase();
  const now = Date.now();

  const existing = getSession(name);

  const stmt = db.prepare(`
    INSERT INTO sessions (
      name, project, last_event,
      last_activity, created_at, updated_at
    )
    VALUES (
      @name, @project, @lastEvent,
      @lastActivity, @createdAt, @updatedAt
    )
    ON CONFLICT(name) DO UPDATE SET
      last_event = COALESCE(@lastEvent, last_event),
      last_activity = COALESCE(@lastActivity, last_activity),
      updated_at = @updatedAt
  `);

  stmt.run({
    name,
    project: input.project ?? existing?.project ?? 'unknown',
    lastEvent: input.lastEvent ?? null,
    lastActivity: input.lastActivity ?? now,
    createdAt: existing?.created_at ?? now,
    updatedAt: now,
  });

  return getSession(name)!;
}

/**
 * Delete a session
 */
export function deleteSession(name: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM sessions WHERE name = ?').run(name);
  return result.changes > 0;
}

/**
 * Archive a session (mark as done and keep in history)
 * Returns the archived session or null if not found
 */
export function archiveSession(name: string): DbSession | null {
  const db = getDatabase();
  const now = Date.now();

  const existing = getSession(name);
  if (!existing) {
    return null;
  }

  // Already archived
  if (existing.archived_at) {
    return existing;
  }

  db.prepare(
    `
    UPDATE sessions SET
      archived_at = ?,
      updated_at = ?
    WHERE name = ?
  `
  ).run(now, now, name);

  console.log(`[DB] Archived session: ${name}`);
  return getSession(name);
}

/**
 * Cleanup stale sessions (older than maxAge)
 * - Non-archived sessions: delete if last_activity older than maxAge
 * - Archived sessions: delete if archived_at older than archivedMaxAge
 * Returns number of deleted sessions
 */
export function cleanupStaleSessions(maxAge: number, archivedMaxAge?: number): number {
  const db = getDatabase();
  const now = Date.now();
  const cutoff = now - maxAge;

  // Delete stale non-archived sessions
  const activeResult = db
    .prepare('DELETE FROM sessions WHERE archived_at IS NULL AND last_activity < ?')
    .run(cutoff);

  let archivedDeleted = 0;
  if (archivedMaxAge) {
    const archivedCutoff = now - archivedMaxAge;
    const archivedResult = db
      .prepare('DELETE FROM sessions WHERE archived_at IS NOT NULL AND archived_at < ?')
      .run(archivedCutoff);
    archivedDeleted = archivedResult.changes;
  }

  const totalDeleted = activeResult.changes + archivedDeleted;

  if (totalDeleted > 0) {
    console.log(
      `[DB] Cleaned up ${activeResult.changes} stale sessions, ${archivedDeleted} old archived sessions`
    );
  }

  return totalDeleted;
}

/**
 * Reconcile sessions with active tmux sessions
 * - Sessions in DB but not in tmux: delete if old
 * - Sessions in tmux but not in DB: will be created when they connect
 * - Archived sessions are skipped (they don't have tmux sessions)
 */
export function reconcileWithTmux(activeTmuxSessions: Set<string>): void {
  const dbSessions = getAllSessions(); // Only gets non-archived sessions
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  console.log(
    `[DB] Reconciling ${dbSessions.length} DB sessions with ${activeTmuxSessions.size} tmux sessions`
  );

  // Handle sessions in DB but not in tmux (skip archived - they're already handled)
  for (const session of dbSessions) {
    if (!activeTmuxSessions.has(session.name)) {
      const age = now - session.last_activity;

      if (age > maxAge) {
        // Delete old sessions
        deleteSession(session.name);
        console.log(`[DB] Deleted stale session: ${session.name}`);
      }
    }
  }

  // Handle sessions in tmux but not in DB
  // These will be created when they receive their first connection
  // We don't create them here because we don't have project info
}
