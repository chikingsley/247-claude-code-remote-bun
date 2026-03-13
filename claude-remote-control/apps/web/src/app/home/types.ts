export interface LocalMachine {
  color?: string;
  config?: {
    projects: string[];
    agentUrl: string;
  };
  id: string;
  name: string;
  status: "online" | "offline";
}

export interface SelectedSession {
  environmentId?: string;
  machineId: string;
  planningProjectId?: string;
  project: string;
  sessionName: string;
}

// Re-export StoredAgentConnection from AgentConnectionSettings for convenience
export type { StoredAgentConnection } from "@/components/AgentConnectionSettings";

// Fallback machine ID when no ?machine= param is in the URL
export const DEFAULT_MACHINE_ID = "local-agent";
