/**
 * Type definitions for web app
 */
import type { WSSessionInfo } from "247-shared";

/**
 * Session info with optional additional fields from StatusLine
 */
export interface SessionInfo extends WSSessionInfo {
  /** Cost in USD from StatusLine */
  costUsd?: number;
  /** Model name from StatusLine */
  model?: string;
}

/**
 * Session info with machine context
 */
export interface SessionWithMachine extends SessionInfo {
  agentUrl: string;
  machineId: string;
  machineName: string;
}
