import { getCleanableWorktreeSessions, clearSessionWorktree } from '../db/sessions.js';
import { worktreeManager } from './worktree.js';

// Default: 72 hours before cleaning up archived session worktrees
const DEFAULT_MAX_IDLE_MS = 72 * 60 * 60 * 1000;
// Default: run cleanup every 30 minutes
const DEFAULT_CLEANUP_INTERVAL_MS = 30 * 60 * 1000;

export interface CleanupConfig {
  maxIdleMs: number;
  intervalMs: number;
}

export interface CleanupResult {
  cleanedSessions: string[];
  errors: Array<{ session: string; error: string }>;
}

/**
 * CleanupService - Automatically cleans up stale worktrees.
 * Runs periodically to remove worktrees from archived sessions.
 */
export class CleanupService {
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private config: CleanupConfig;
  private projectPathResolver: (project: string) => string;

  constructor(
    projectPathResolver: (project: string) => string,
    config: Partial<CleanupConfig> = {}
  ) {
    this.projectPathResolver = projectPathResolver;
    this.config = {
      maxIdleMs: config.maxIdleMs ?? DEFAULT_MAX_IDLE_MS,
      intervalMs: config.intervalMs ?? DEFAULT_CLEANUP_INTERVAL_MS,
    };
  }

  /**
   * Start the cleanup job.
   */
  start(): void {
    if (this.intervalHandle) {
      console.log('[Cleanup] Already running');
      return;
    }

    console.log(
      `[Cleanup] Starting cleanup job (interval: ${this.config.intervalMs / 1000 / 60}min, max idle: ${this.config.maxIdleMs / 1000 / 60 / 60}h)`
    );

    // Run immediately on start
    this.runCleanup().catch((err) => {
      console.error('[Cleanup] Initial cleanup failed:', err);
    });

    // Then run periodically
    this.intervalHandle = setInterval(() => {
      this.runCleanup().catch((err) => {
        console.error('[Cleanup] Periodic cleanup failed:', err);
      });
    }, this.config.intervalMs);
  }

  /**
   * Stop the cleanup job.
   */
  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
      console.log('[Cleanup] Stopped cleanup job');
    }
  }

  /**
   * Run a cleanup cycle.
   * Returns info about what was cleaned up.
   */
  async runCleanup(): Promise<CleanupResult> {
    const result: CleanupResult = {
      cleanedSessions: [],
      errors: [],
    };

    try {
      // Get archived sessions with worktrees that are old enough to clean
      const sessions = getCleanableWorktreeSessions(this.config.maxIdleMs);

      if (sessions.length === 0) {
        return result;
      }

      console.log(`[Cleanup] Found ${sessions.length} sessions to clean up`);

      for (const session of sessions) {
        if (!session.worktree_path) continue;

        try {
          const projectPath = this.projectPathResolver(session.project);

          // Remove the worktree
          const removed = await worktreeManager.remove(projectPath, session.worktree_path);

          if (removed) {
            // Clear worktree info in DB
            clearSessionWorktree(session.name);
            result.cleanedSessions.push(session.name);
            console.log(`[Cleanup] Cleaned up worktree for session ${session.name}`);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          result.errors.push({ session: session.name, error: errorMsg });
          console.error(`[Cleanup] Failed to clean up session ${session.name}:`, error);
        }
      }

      if (result.cleanedSessions.length > 0) {
        console.log(`[Cleanup] Cleaned up ${result.cleanedSessions.length} worktrees`);
      }
    } catch (error) {
      console.error('[Cleanup] Error during cleanup:', error);
    }

    return result;
  }

  /**
   * Check if cleanup job is running.
   */
  isRunning(): boolean {
    return this.intervalHandle !== null;
  }

  /**
   * Update cleanup configuration.
   */
  updateConfig(config: Partial<CleanupConfig>): void {
    if (config.maxIdleMs !== undefined) {
      this.config.maxIdleMs = config.maxIdleMs;
    }
    if (config.intervalMs !== undefined) {
      this.config.intervalMs = config.intervalMs;
      // Restart with new interval if running
      if (this.isRunning()) {
        this.stop();
        this.start();
      }
    }
  }
}

// Factory function to create cleanup service
// Needs to be initialized with project path resolver
let cleanupService: CleanupService | null = null;

export function initCleanupService(
  projectPathResolver: (project: string) => string,
  config?: Partial<CleanupConfig>
): CleanupService {
  cleanupService = new CleanupService(projectPathResolver, config);
  return cleanupService;
}

export function getCleanupService(): CleanupService | null {
  return cleanupService;
}
