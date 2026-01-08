'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { FileExplorer } from './FileExplorer';
import type { SessionStatus } from './ui/status-badge';
import { type SessionInfo } from '@/lib/notifications';
import type { RalphLoopConfig } from '@vibecompany/247-shared';

const Terminal = dynamic(() => import('./Terminal').then((mod) => mod.Terminal), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center bg-[#0d0d14]">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500/30 border-t-orange-500" />
    </div>
  ),
});

export type ActiveTab = 'terminal' | 'editor';

interface SessionViewProps {
  sessionName: string;
  project: string;
  agentUrl: string;
  sessionInfo?: SessionInfo;
  environmentId?: string;
  ralphConfig?: RalphLoopConfig;
  onSessionCreated?: (sessionName: string) => void;
  /** Callback when menu button is clicked (opens sidebar on mobile, goes back on desktop) */
  onMenuClick: () => void;
  /** Currently active tab - controlled by parent/sidebar */
  activeTab?: ActiveTab;
  /** Mobile mode for responsive styling */
  isMobile?: boolean;
}

/**
 * SessionView - Minimalist session container.
 * Header and tabs have been moved to MinimalSessionHeader and HomeSidebar.
 * This component just renders the Terminal or FileExplorer based on activeTab.
 */
export function SessionView({
  sessionName,
  project,
  agentUrl,
  sessionInfo,
  environmentId,
  ralphConfig,
  onSessionCreated,
  onMenuClick,
  activeTab = 'terminal',
  isMobile = false,
}: SessionViewProps) {
  // Connection state tracked but not displayed (shown in MinimalSessionHeader via Terminal)
  const [_isConnected, setIsConnected] = useState(false);

  const isNewSession = sessionName.endsWith('--new');

  const handleSessionCreated = useCallback(
    (actualSessionName: string) => {
      onSessionCreated?.(actualSessionName);
    },
    [onSessionCreated]
  );

  // Terminal or FileExplorer fills the entire container
  if (activeTab === 'terminal') {
    return (
      <Terminal
        key={`${project}-${sessionName}`}
        agentUrl={agentUrl}
        project={project}
        sessionName={isNewSession ? undefined : sessionName}
        environmentId={environmentId}
        ralphConfig={ralphConfig}
        onConnectionChange={setIsConnected}
        onSessionCreated={handleSessionCreated}
        claudeStatus={sessionInfo?.status}
        status={sessionInfo?.status as SessionStatus}
        onMenuClick={onMenuClick}
        isMobile={isMobile}
      />
    );
  }

  return <FileExplorer key={`files-${project}`} agentUrl={agentUrl} project={project} />;
}
