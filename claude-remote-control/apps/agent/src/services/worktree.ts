import { execa } from 'execa';
import { existsSync } from 'fs';
import { mkdir, stat, copyFile, cp } from 'fs/promises';
import { join } from 'path';

const WORKTREES_BASE = '/tmp/247-workspaces';

export interface WorktreeInfo {
  worktreePath: string;
  branch: string;
}

/**
 * Manages Git worktrees for session isolation.
 * Each session gets its own worktree with a dedicated branch.
 */
export class WorktreeManager {
  private basePath: string;

  constructor(basePath: string = WORKTREES_BASE) {
    this.basePath = basePath;
  }

  /**
   * Create a new worktree for a session.
   * If branchName is not provided, creates a branch named `session/<sessionName>`.
   */
  async create(
    projectPath: string,
    sessionName: string,
    branchName?: string
  ): Promise<WorktreeInfo> {
    const branch = branchName || `session/${sessionName}`;
    const worktreePath = join(this.basePath, sessionName);

    // Ensure base directory exists
    await mkdir(this.basePath, { recursive: true });

    // Check if worktree already exists
    if (existsSync(worktreePath)) {
      console.log(`[Worktree] Worktree already exists at ${worktreePath}`);
      return { worktreePath, branch };
    }

    // Check if branch already exists
    const { exitCode } = await execa('git', ['rev-parse', '--verify', branch], {
      cwd: projectPath,
      reject: false,
    });

    if (exitCode !== 0) {
      // Branch doesn't exist - create new branch with worktree
      console.log(`[Worktree] Creating new worktree with branch ${branch}`);
      await execa('git', ['worktree', 'add', '-b', branch, worktreePath], {
        cwd: projectPath,
      });
    } else {
      // Branch exists - create worktree on existing branch
      console.log(`[Worktree] Creating worktree on existing branch ${branch}`);
      await execa('git', ['worktree', 'add', worktreePath, branch], {
        cwd: projectPath,
      });
    }

    // Copy Claude configuration files
    await this.copyClaudeConfig(projectPath, worktreePath);

    console.log(`[Worktree] Created worktree at ${worktreePath} on branch ${branch}`);
    return { worktreePath, branch };
  }

  /**
   * Remove a worktree.
   * Uses --force to remove even if there are uncommitted changes.
   */
  async remove(projectPath: string, worktreePath: string): Promise<boolean> {
    try {
      // First try to prune any stale worktrees
      await execa('git', ['worktree', 'prune'], {
        cwd: projectPath,
        reject: false,
      });

      // Then remove the specific worktree
      await execa('git', ['worktree', 'remove', worktreePath, '--force'], {
        cwd: projectPath,
        reject: false,
      });

      console.log(`[Worktree] Removed worktree at ${worktreePath}`);
      return true;
    } catch (error) {
      console.error(`[Worktree] Failed to remove worktree at ${worktreePath}:`, error);
      return false;
    }
  }

  /**
   * List all worktrees for a project.
   */
  async list(projectPath: string): Promise<string[]> {
    try {
      const { stdout } = await execa('git', ['worktree', 'list', '--porcelain'], {
        cwd: projectPath,
      });

      const worktrees: string[] = [];
      for (const line of stdout.split('\n')) {
        if (line.startsWith('worktree ')) {
          worktrees.push(line.replace('worktree ', ''));
        }
      }
      return worktrees;
    } catch (error) {
      console.error(`[Worktree] Failed to list worktrees:`, error);
      return [];
    }
  }

  /**
   * Check if a worktree exists for a session.
   */
  async exists(sessionName: string): Promise<boolean> {
    const worktreePath = join(this.basePath, sessionName);
    return existsSync(worktreePath);
  }

  /**
   * Get the worktree path for a session.
   */
  getPath(sessionName: string): string {
    return join(this.basePath, sessionName);
  }

  /**
   * Copy Claude configuration files (CLAUDE.md, .claude/) from source to destination.
   * These files contain project-specific context that Claude needs.
   */
  private async copyClaudeConfig(src: string, dest: string): Promise<void> {
    const filesToCopy = ['CLAUDE.md', '.claude'];

    for (const file of filesToCopy) {
      const srcPath = join(src, file);
      const destPath = join(dest, file);

      try {
        const fileStat = await stat(srcPath);

        if (fileStat.isDirectory()) {
          await cp(srcPath, destPath, { recursive: true });
          console.log(`[Worktree] Copied directory ${file}`);
        } else {
          await copyFile(srcPath, destPath);
          console.log(`[Worktree] Copied file ${file}`);
        }
      } catch {
        // File doesn't exist, skip silently
      }
    }
  }
}

// Singleton instance
export const worktreeManager = new WorktreeManager();
