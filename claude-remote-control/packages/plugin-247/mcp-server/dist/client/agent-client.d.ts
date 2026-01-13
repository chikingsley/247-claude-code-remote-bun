import type { Config } from '../config/index.js';
export interface SessionInfo {
    name: string;
    project: string;
    status: 'init' | 'working' | 'needs_attention' | 'idle';
    attentionReason?: 'permission' | 'input' | 'plan_approval' | 'task_complete';
    lastEvent?: string;
    lastStatusChange?: number;
    createdAt: number;
    lastActivity?: number;
    model?: string;
    costUsd?: number;
    contextUsage?: number;
    worktreePath?: string;
    branchName?: string;
}
export interface SpawnRequest {
    prompt: string;
    project: string;
    parentSession?: string;
    taskId?: string;
    worktree?: boolean;
    branchName?: string;
    environmentId?: string;
    timeout?: number;
    trustMode?: boolean;
    model?: string;
}
export interface SpawnResponse {
    success: boolean;
    sessionName?: string;
    taskId?: string;
    worktreePath?: string;
    branchName?: string;
    error?: string;
}
export interface SessionOutputResponse {
    sessionName: string;
    output: string;
    totalLines: number;
    returnedLines: number;
    isRunning: boolean;
}
export interface SessionInputResponse {
    success: boolean;
    sessionName: string;
    error?: string;
}
export declare class AgentClient {
    private baseUrl;
    private timeout;
    constructor(config: Config);
    private fetch;
    listSessions(): Promise<SessionInfo[]>;
    getSession(name: string): Promise<SessionInfo | null>;
    spawnSession(request: SpawnRequest): Promise<SpawnResponse>;
    getSessionOutput(name: string, lines?: number, format?: 'raw' | 'plain'): Promise<SessionOutputResponse>;
    sendInput(name: string, text: string, sendEnter?: boolean): Promise<SessionInputResponse>;
    stopSession(name: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    archiveSession(name: string): Promise<{
        success: boolean;
        session?: SessionInfo;
    }>;
    getCapacity(): Promise<{
        max: number;
        running: number;
        available: number;
    }>;
    listProjects(): Promise<string[]>;
}
//# sourceMappingURL=agent-client.d.ts.map