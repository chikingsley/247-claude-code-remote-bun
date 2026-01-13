import type { AgentClient } from '../client/agent-client.js';
export interface ToolContext {
    agentClient: AgentClient;
}
export declare const toolDefinitions: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            prompt: {
                type: string;
                description: string;
            };
            project: {
                type: string;
                description: string;
            };
            worktree: {
                type: string;
                description: string;
            };
            branchName: {
                type: string;
                description: string;
            };
            trustMode: {
                type: string;
                description: string;
            };
            model: {
                type: string;
                description: string;
            };
            timeout: {
                type: string;
                description: string;
            };
            status?: undefined;
            name?: undefined;
            lines?: undefined;
            format?: undefined;
            text?: undefined;
            sendEnter?: undefined;
            pollInterval?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            project: {
                type: string;
                description: string;
            };
            status: {
                type: string;
                enum: string[];
                description: string;
            };
            prompt?: undefined;
            worktree?: undefined;
            branchName?: undefined;
            trustMode?: undefined;
            model?: undefined;
            timeout?: undefined;
            name?: undefined;
            lines?: undefined;
            format?: undefined;
            text?: undefined;
            sendEnter?: undefined;
            pollInterval?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            name: {
                type: string;
                description: string;
            };
            prompt?: undefined;
            project?: undefined;
            worktree?: undefined;
            branchName?: undefined;
            trustMode?: undefined;
            model?: undefined;
            timeout?: undefined;
            status?: undefined;
            lines?: undefined;
            format?: undefined;
            text?: undefined;
            sendEnter?: undefined;
            pollInterval?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            name: {
                type: string;
                description: string;
            };
            lines: {
                type: string;
                description: string;
            };
            format: {
                type: string;
                enum: string[];
                description: string;
            };
            prompt?: undefined;
            project?: undefined;
            worktree?: undefined;
            branchName?: undefined;
            trustMode?: undefined;
            model?: undefined;
            timeout?: undefined;
            status?: undefined;
            text?: undefined;
            sendEnter?: undefined;
            pollInterval?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            name: {
                type: string;
                description: string;
            };
            text: {
                type: string;
                description: string;
            };
            sendEnter: {
                type: string;
                description: string;
            };
            prompt?: undefined;
            project?: undefined;
            worktree?: undefined;
            branchName?: undefined;
            trustMode?: undefined;
            model?: undefined;
            timeout?: undefined;
            status?: undefined;
            lines?: undefined;
            format?: undefined;
            pollInterval?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            name: {
                type: string;
                description: string;
            };
            timeout: {
                type: string;
                description: string;
            };
            pollInterval: {
                type: string;
                description: string;
            };
            prompt?: undefined;
            project?: undefined;
            worktree?: undefined;
            branchName?: undefined;
            trustMode?: undefined;
            model?: undefined;
            status?: undefined;
            lines?: undefined;
            format?: undefined;
            text?: undefined;
            sendEnter?: undefined;
        };
        required: string[];
    };
})[];
export declare function handleToolCall(name: string, args: Record<string, unknown>, context: ToolContext): Promise<unknown>;
//# sourceMappingURL=index.d.ts.map