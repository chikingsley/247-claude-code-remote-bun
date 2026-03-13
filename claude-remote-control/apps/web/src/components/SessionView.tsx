"use client";

import { lazy, Suspense, useCallback, useRef, useState } from "react";
import type { SessionInfo } from "@/lib/types";

const Terminal = lazy(() =>
  import("./Terminal").then((mod) => ({ default: mod.Terminal }))
);

function TerminalLoading() {
  return (
    <div className="flex flex-1 items-center justify-center bg-[#0d0d14]">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500/30 border-t-orange-500" />
    </div>
  );
}

interface SessionViewProps {
  agentUrl: string;
  environmentId?: string;
  /** Mobile mode for responsive styling */
  isMobile?: boolean;
  /** Callback when menu button is clicked (goes back on desktop) */
  onMenuClick: () => void;
  onSessionCreated?: (sessionName: string) => void;
  planningProjectId?: string;
  project: string;
  sessionInfo?: SessionInfo;
  sessionName: string;
}

/**
 * SessionView - Minimalist session container.
 * Renders a Terminal with tmux session.
 */
export function SessionView({
  sessionName,
  project,
  agentUrl,
  sessionInfo,
  environmentId,
  planningProjectId,
  onSessionCreated,
  onMenuClick,
  isMobile = false,
}: SessionViewProps) {
  // Connection state tracked but not displayed (shown in MinimalSessionHeader via Terminal)
  const [_isConnected, setIsConnected] = useState(false);

  const isNewSession = sessionName.endsWith("--new");

  // Use a ref to store the initial key and keep it stable throughout the component's lifecycle.
  // This prevents Terminal remount when sessionName changes from 'project--new' to actual name.
  // Without this, the history clear would happen before Ralph Loop command is written.
  const terminalKeyRef = useRef<string | null>(null);
  if (terminalKeyRef.current === null) {
    terminalKeyRef.current = isNewSession
      ? `${project}-new-session`
      : `${project}-${sessionName}`;
  }
  const terminalKey = terminalKeyRef.current;

  const handleSessionCreated = useCallback(
    (actualSessionName: string) => {
      // Notify parent of session creation
      onSessionCreated?.(actualSessionName);
    },
    [onSessionCreated]
  );

  return (
    <Suspense fallback={<TerminalLoading />}>
      <Terminal
        agentUrl={agentUrl}
        costUsd={sessionInfo?.costUsd}
        environmentId={environmentId}
        isMobile={isMobile}
        key={terminalKey}
        model={sessionInfo?.model}
        onConnectionChange={setIsConnected}
        onMenuClick={onMenuClick}
        onSessionCreated={handleSessionCreated}
        planningProjectId={planningProjectId}
        // StatusLine metrics
        project={project}
        sessionName={isNewSession ? undefined : sessionName}
      />
    </Suspense>
  );
}
