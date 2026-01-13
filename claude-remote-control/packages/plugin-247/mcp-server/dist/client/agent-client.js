export class AgentClient {
    baseUrl;
    timeout;
    constructor(config) {
        this.baseUrl = config.agentUrl;
        this.timeout = config.timeout;
    }
    async fetch(path, options) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        try {
            const response = await fetch(`${this.baseUrl}${path}`, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...options?.headers,
                },
            });
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`HTTP ${response.status}: ${error}`);
            }
            return response.json();
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    async listSessions() {
        return this.fetch('/api/sessions');
    }
    async getSession(name) {
        try {
            const sessions = await this.listSessions();
            return sessions.find((s) => s.name === name) || null;
        }
        catch {
            return null;
        }
    }
    async spawnSession(request) {
        return this.fetch('/api/sessions/spawn', {
            method: 'POST',
            body: JSON.stringify(request),
        });
    }
    async getSessionOutput(name, lines = 1000, format = 'plain') {
        return this.fetch(`/api/sessions/${encodeURIComponent(name)}/output?lines=${lines}&format=${format}`);
    }
    async sendInput(name, text, sendEnter = true) {
        return this.fetch(`/api/sessions/${encodeURIComponent(name)}/input`, {
            method: 'POST',
            body: JSON.stringify({ text, sendEnter }),
        });
    }
    async stopSession(name) {
        return this.fetch(`/api/sessions/${encodeURIComponent(name)}`, {
            method: 'DELETE',
        });
    }
    async archiveSession(name) {
        return this.fetch(`/api/sessions/${encodeURIComponent(name)}/archive`, {
            method: 'POST',
        });
    }
    async getCapacity() {
        return this.fetch('/api/capacity');
    }
    async listProjects() {
        const data = await this.fetch('/api/projects');
        return data.projects;
    }
}
//# sourceMappingURL=agent-client.js.map