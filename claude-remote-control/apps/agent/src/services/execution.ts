/**
 * ExecutionManager - Manages parallel session execution limits.
 * Limits the number of concurrent Claude sessions to prevent resource exhaustion.
 */

export interface SessionInfo {
  project: string;
  worktreePath: string | null;
  startedAt: number;
}

export interface CapacityInfo {
  max: number;
  running: number;
  available: number;
}

export class ExecutionManager {
  private maxParallel: number;
  private running: Map<string, SessionInfo>;

  constructor(maxParallel: number = 3) {
    this.maxParallel = maxParallel;
    this.running = new Map();
  }

  /**
   * Check if a new session can be started.
   */
  canStart(): boolean {
    return this.running.size < this.maxParallel;
  }

  /**
   * Register a running session.
   */
  register(sessionName: string, project: string, worktreePath: string | null): void {
    this.running.set(sessionName, {
      project,
      worktreePath,
      startedAt: Date.now(),
    });
    console.log(
      `[Execution] Registered session ${sessionName} (${this.running.size}/${this.maxParallel})`
    );
  }

  /**
   * Unregister a session when it stops.
   */
  unregister(sessionName: string): void {
    if (this.running.delete(sessionName)) {
      console.log(
        `[Execution] Unregistered session ${sessionName} (${this.running.size}/${this.maxParallel})`
      );
    }
  }

  /**
   * Get current capacity information.
   */
  getCapacity(): CapacityInfo {
    return {
      max: this.maxParallel,
      running: this.running.size,
      available: this.maxParallel - this.running.size,
    };
  }

  /**
   * Get information about a specific running session.
   */
  getSession(sessionName: string): SessionInfo | undefined {
    return this.running.get(sessionName);
  }

  /**
   * Get all running sessions.
   */
  getRunningSessions(): Map<string, SessionInfo> {
    return new Map(this.running);
  }

  /**
   * Check if a specific session is running.
   */
  isRunning(sessionName: string): boolean {
    return this.running.has(sessionName);
  }

  /**
   * Update the maximum parallel sessions limit.
   */
  setMaxParallel(max: number): void {
    this.maxParallel = max;
    console.log(`[Execution] Max parallel sessions set to ${max}`);
  }
}

// Singleton instance with default max of 3
export const executionManager = new ExecutionManager(3);
