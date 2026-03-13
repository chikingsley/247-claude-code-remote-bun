"use client";

import { ArrowDown, Loader2, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AgentConnectionSettings } from "@/components/AgentConnectionSettings";
import { ConnectionGuide } from "@/components/ConnectionGuide";
import { EditAgentModal } from "@/components/EditAgentModal";
import { InstallBanner } from "@/components/InstallBanner";
// New layout components
import { AppShell } from "@/components/layout";
import type { SessionListItem } from "@/components/layout/SessionListPanel";
import type {
  SidebarMachine,
  SidebarProject,
} from "@/components/layout/Sidebar";
import { MobileStatusStrip } from "@/components/mobile";
import { NewSessionModal } from "@/components/NewSessionModal";
import { NotificationSettingsPanel } from "@/components/NotificationSettingsPanel";
import { SessionView } from "@/components/SessionView";
import { UnifiedAgentManager } from "@/components/UnifiedAgentManager";
import { SlideOverPanel } from "@/components/ui/SlideOverPanel";
import type { SessionStatus } from "@/components/ui/status-indicator";
import {
  type SessionWithMachine,
  useSessionPolling,
} from "@/contexts/SessionPollingContext";
import { useInAppNotifications } from "@/hooks/useInAppNotifications";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useNotificationDeeplink } from "@/hooks/useNotificationDeeplink";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useSessionActions } from "@/hooks/useSessionActions";
import { useSoundNotifications } from "@/hooks/useSoundNotifications";
import { useViewportHeight } from "@/hooks/useViewportHeight";
import { LoadingView } from "./LoadingView";
import { NoConnectionView } from "./NoConnectionView";
import { useHomeState } from "./useHomeState";

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

function mapMachineType(method: string): SidebarMachine["type"] {
  if (method === "localhost" || method === "local") {
    return "localhost";
  }
  if (method === "tailscale") {
    return "tailscale";
  }
  if (method === "fly") {
    return "fly";
  }
  return "custom";
}

function mapSessionStatus(session: SessionWithMachine): SessionStatus {
  if (session.status === "working") {
    return "working";
  }
  if (session.status === "needs_attention") {
    return "needs_attention";
  }
  if (session.status === "init") {
    return "init";
  }
  return "idle";
}

export function HomeContent() {
  const isMobile = useIsMobile();

  // Set CSS variable for viewport height (handles mobile keyboard)
  useViewportHeight();

  // Handle notification deep links (iOS PWA fallback)
  useNotificationDeeplink();

  // Notification preferences and sound
  const { soundEnabled, getSelectedSoundPath } = useNotificationPreferences();
  const { playSound } = useSoundNotifications({
    soundPath: getSelectedSoundPath(),
  });

  // Handle in-app notifications when app is in foreground (from push notifications)
  useInAppNotifications({
    onNotification: soundEnabled ? playSound : undefined,
  });

  const {
    loading,
    agentConnection,
    agentConnections,
    connectionModalOpen,
    setConnectionModalOpen,
    newSessionOpen,
    setNewSessionOpen,
    selectedSession,
    setSelectedSession,
    isFullscreen,
    setIsFullscreen,
    allSessions,
    currentMachine,
    machines,
    getArchivedSessions: _getArchivedSessions,
    getAgentUrl,
    getSelectedSessionInfo,
    handleSelectSession,
    handleStartSession,
    handleSessionCreated,
    handleSessionKilled,
    handleSessionArchived,
    handleConnectionSaved,
    handleConnectionRemoved,
    handleConnectionEdited,
    handleConnectionCleared,
    clearSessionFromUrl,
  } = useHomeState();

  // Shared session actions hook (used by both desktop SessionListPanel and mobile MobileStatusStrip)
  const { killSession, archiveSession, acknowledgeSession } =
    useSessionActions(agentConnections);

  // Get session count per agent for the header
  const {
    sessionsByMachine,
    isWsConnected,
    refreshMachine,
    setOnNeedsAttention,
  } = useSessionPolling();

  // Register sound notification callback for needs_attention status changes
  useEffect(() => {
    if (soundEnabled) {
      setOnNeedsAttention(() => {
        playSound();
      });
    } else {
      setOnNeedsAttention(undefined);
    }
    return () => setOnNeedsAttention(undefined);
  }, [soundEnabled, playSound, setOnNeedsAttention]);

  // Slide-over panel states
  const [guideOpen, setGuideOpen] = useState(false);
  const [unifiedManagerOpen, setUnifiedManagerOpen] = useState(false);
  const [notificationSettingsOpen, setNotificationSettingsOpen] =
    useState(false);

  // Edit machine modal state (for sidebar context menu)
  const [editingMachine, setEditingMachine] = useState<SidebarMachine | null>(
    null
  );

  // Filter states for sidebar
  const [machineFilter, setMachineFilter] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // Data transformations for new layout
  // ═══════════════════════════════════════════════════════════════════════════

  // Transform agentConnections → SidebarMachine[]
  const sidebarMachines: SidebarMachine[] = useMemo(
    () =>
      agentConnections.map((conn) => {
        const machineData = sessionsByMachine.get(conn.id);
        const wsConnected = isWsConnected(conn.id);
        return {
          id: conn.id,
          name: conn.name,
          type: mapMachineType(conn.method),
          status: machineData?.error
            ? "offline"
            : wsConnected
              ? "online"
              : "connecting",
          sessionCount: machineData?.sessions?.length ?? 0,
          color: conn.color,
        };
      }),
    [agentConnections, sessionsByMachine, isWsConnected]
  );

  // Transform allSessions → SessionListItem[]
  const sessionListItems: SessionListItem[] = useMemo(
    () =>
      allSessions.map((session) => ({
        id: `${session.machineId}-${session.name}`,
        name: session.name,
        project: session.project,
        status: mapSessionStatus(session),
        updatedAt: new Date(session.lastActivity || session.createdAt),
        createdAt: new Date(session.createdAt),
        model: session.model,
        cost: session.costUsd,
        machineId: session.machineId,
      })),
    [allSessions]
  );

  // Extract unique projects from sessions
  const sidebarProjects: SidebarProject[] = useMemo(() => {
    const projectMap = new Map<string, number>();
    allSessions.forEach((s) => {
      projectMap.set(s.project, (projectMap.get(s.project) || 0) + 1);
    });
    return Array.from(projectMap.entries()).map(([name, count]) => ({
      name,
      path: name,
      activeSessionCount: count,
    }));
  }, [allSessions]);

  // Compute selectedSessionId for the new layout
  const selectedSessionId = selectedSession
    ? `${selectedSession.machineId}-${selectedSession.sessionName}`
    : null;

  // Filter sessions by machine and project
  const filteredSessionListItems = useMemo(() => {
    let filtered = sessionListItems;
    if (machineFilter) {
      filtered = filtered.filter((s) => s.machineId === machineFilter);
    }
    if (projectFilter) {
      filtered = filtered.filter((s) => s.project === projectFilter);
    }
    return filtered;
  }, [sessionListItems, machineFilter, projectFilter]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Callback handlers for new layout
  // ═══════════════════════════════════════════════════════════════════════════

  // Handler for machine selection (toggle filter)
  const handleSelectMachine = useCallback((machineId: string) => {
    setMachineFilter((prev) => (prev === machineId ? null : machineId));
  }, []);

  // Handler for project selection (toggle filter)
  const handleSelectProject = useCallback((projectName: string) => {
    setProjectFilter((prev) => (prev === projectName ? null : projectName));
  }, []);

  // Handler for editing machine from sidebar
  const handleEditMachineFromSidebar = useCallback(
    (machine: SidebarMachine) => {
      setEditingMachine(machine);
    },
    []
  );

  // Handler for removing machine from sidebar
  const handleRemoveMachineFromSidebar = useCallback(
    async (machine: SidebarMachine) => {
      await handleConnectionRemoved(machine.id);
    },
    [handleConnectionRemoved]
  );

  // Check if machine can be removed (not the last one)
  const canRemoveMachine = useCallback(() => {
    return agentConnections.length > 1;
  }, [agentConnections.length]);

  // Handler pour sélection depuis SessionListPanel
  const handleSelectSessionFromList = useCallback(
    (item: SessionListItem) => {
      // Auto-acknowledge if needs_attention (replicate HomeSidebar behavior)
      if (item.status === "needs_attention" && item.machineId) {
        acknowledgeSession(item.machineId, item.name);
      }
      handleSelectSession(item.machineId!, item.name, item.project);
    },
    [handleSelectSession, acknowledgeSession]
  );

  // Handler pour kill depuis SessionListPanel (uses shared hook)
  const handleKillSessionFromList = useCallback(
    async (item: SessionListItem) => {
      const success = await killSession(item.machineId!, item.name);
      if (success) {
        handleSessionKilled(item.machineId!, item.name);
      }
    },
    [killSession, handleSessionKilled]
  );

  // Handler pour archive depuis SessionListPanel (uses shared hook)
  const handleArchiveSessionFromList = useCallback(
    async (item: SessionListItem) => {
      const success = await archiveSession(item.machineId!, item.name);
      if (success) {
        handleSessionArchived(item.machineId!, item.name);
      }
    },
    [archiveSession, handleSessionArchived]
  );

  // Create agent status and session count maps for UnifiedAgentManager
  const agentStatuses = new Map<string, "online" | "offline" | "connecting">();
  const sessionCountsMap = new Map<string, number>();
  agentConnections.forEach((conn) => {
    const machineData = sessionsByMachine.get(conn.id);
    const wsConnected = isWsConnected(conn.id);
    agentStatuses.set(
      conn.id,
      machineData?.error ? "offline" : wsConnected ? "online" : "connecting"
    );
    sessionCountsMap.set(conn.id, machineData?.sessions?.length ?? 0);
  });

  // Pull-to-refresh for mobile PWA
  const {
    pullDistance,
    isRefreshing,
    isPulling,
    isThresholdReached,
    handlers,
  } = usePullToRefresh({
    onRefresh: async () => {
      if (currentMachine) {
        await refreshMachine(currentMachine.id);
      }
    },
    disabled: !isMobile,
  });

  if (loading) {
    return <LoadingView />;
  }

  // Show NoConnectionView if no agent connected
  if (!agentConnection) {
    return (
      <NoConnectionView
        modalOpen={connectionModalOpen}
        onConnectionSaved={handleConnectionSaved}
        onModalOpenChange={setConnectionModalOpen}
      />
    );
  }

  // Handler for menu button in session view (desktop only - goes back to session list)
  const handleMenuClick = () => {
    setSelectedSession(null);
    clearSessionFromUrl();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Shared Modals (rendered outside main layout)
  // ═══════════════════════════════════════════════════════════════════════════

  const modals = (
    <>
      {/* Connection Settings Modal */}
      <AgentConnectionSettings
        hasConnection={!!agentConnection}
        onDisconnect={handleConnectionCleared}
        onOpenChange={setConnectionModalOpen}
        onSave={handleConnectionSaved}
        open={connectionModalOpen}
      />

      {/* Unified Agent Manager */}
      <UnifiedAgentManager
        agentStatuses={agentStatuses}
        connectedAgents={agentConnections}
        onClose={() => setUnifiedManagerOpen(false)}
        onConnectNewAgent={handleConnectionSaved}
        onDisconnectAgent={handleConnectionRemoved}
        onEditAgent={handleConnectionEdited}
        open={unifiedManagerOpen}
        sessionCounts={sessionCountsMap}
      />

      {/* New Session Modal */}
      <NewSessionModal
        machines={machines}
        onOpenChange={setNewSessionOpen}
        onStartSession={handleStartSession}
        open={newSessionOpen}
      />

      {/* Guide Slide-Over Panel */}
      <SlideOverPanel
        onClose={() => setGuideOpen(false)}
        open={guideOpen}
        title="Connection Guide"
      >
        <ConnectionGuide />
      </SlideOverPanel>

      {/* Notification Settings Slide-Over Panel */}
      <SlideOverPanel
        onClose={() => setNotificationSettingsOpen(false)}
        open={notificationSettingsOpen}
        title="Notification Settings"
      >
        <NotificationSettingsPanel />
      </SlideOverPanel>

      {/* Edit Machine Modal - triggered from Sidebar */}
      {editingMachine && (
        <EditAgentModal
          agentColor={editingMachine.color}
          agentId={editingMachine.id}
          agentName={editingMachine.name}
          onClose={() => setEditingMachine(null)}
          onSave={async (id, data) => {
            await handleConnectionEdited(id, data);
            setEditingMachine(null);
          }}
          open={!!editingMachine}
        />
      )}
    </>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // Desktop Layout - New 3-Panel AppShell
  // ═══════════════════════════════════════════════════════════════════════════

  if (!isMobile) {
    return (
      <>
        <AppShell
          // Sidebar props
          canRemoveMachine={canRemoveMachine}
          currentMachineName={currentMachine?.name}
          currentProjectName={selectedSession?.project}
          isFullscreen={isFullscreen}
          machines={sidebarMachines}
          onAddMachine={() => setUnifiedManagerOpen(true)}
          onArchiveSession={handleArchiveSessionFromList}
          onEditMachine={handleEditMachineFromSidebar}
          onKillSession={handleKillSessionFromList}
          onNewSession={() => setNewSessionOpen(true)}
          // Session list props
          onOpenNotificationSettings={() => setNotificationSettingsOpen(true)}
          onRemoveMachine={handleRemoveMachineFromSidebar}
          onSelectMachine={handleSelectMachine}
          onSelectProject={handleSelectProject}
          onSelectSession={handleSelectSessionFromList}
          onToggleFullscreen={() => setIsFullscreen((prev) => !prev)}
          // Header props
          projects={sidebarProjects}
          selectedMachineId={machineFilter}
          selectedProjectName={projectFilter}
          selectedSessionId={selectedSessionId}
          sessions={filteredSessionListItems}
        >
          {/* Main content */}
          {selectedSession ? (
            <SessionView
              agentUrl={getAgentUrl()}
              environmentId={selectedSession.environmentId}
              isMobile={false}
              key={`${selectedSession.machineId}-${selectedSession.project}-${selectedSession.sessionName.endsWith("--new") ? "new" : selectedSession.sessionName}`}
              onMenuClick={handleMenuClick}
              onSessionCreated={handleSessionCreated}
              planningProjectId={selectedSession.planningProjectId}
              project={selectedSession.project}
              sessionInfo={getSelectedSessionInfo()}
              sessionName={selectedSession.sessionName}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-500/10 bg-orange-500/5">
                  <Zap className="h-8 w-8 text-orange-500/30" />
                </div>
                <p className="text-sm text-white/40">
                  Select a session or create a new one
                </p>
              </div>
            </div>
          )}
        </AppShell>
        {modals}
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Mobile Layout - Existing layout with MobileStatusStrip
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <main
      className="flex h-screen-safe flex-col overflow-hidden bg-[#0a0a10]"
      onTouchEnd={handlers.onTouchEnd}
      onTouchMove={handlers.onTouchMove}
      onTouchStart={handlers.onTouchStart}
    >
      {/* Pull-to-refresh indicator */}
      {(isPulling || isRefreshing) && (
        <div
          className="pointer-events-none fixed right-0 left-0 z-50 flex justify-center"
          style={{
            top: 0,
            transform: `translateY(${Math.min(pullDistance - 30, 50)}px)`,
            opacity: Math.min(pullDistance / 40, 1),
            transition: isRefreshing ? "none" : "opacity 0.1s ease-out",
          }}
        >
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              isThresholdReached || isRefreshing
                ? "bg-orange-500/20 text-orange-400"
                : "bg-white/10 text-white/60"
            }`}
            style={{
              transition: "background-color 0.15s, color 0.15s",
            }}
          >
            {isRefreshing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ArrowDown
                className="h-5 w-5 transition-transform duration-150"
                style={{
                  transform: isThresholdReached
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Mobile Status Strip */}
      <MobileStatusStrip
        currentSession={selectedSession}
        machineFilter={machineFilter}
        machines={sidebarMachines.map((m) => ({
          id: m.id,
          name: m.name,
          color: m.color,
        }))}
        onArchiveSession={archiveSession}
        onConnectionSettingsClick={() => setUnifiedManagerOpen(true)}
        onKillSession={killSession}
        // Session actions from shared hook
        onNewSession={() => setNewSessionOpen(true)}
        onSelectMachine={(id) => setMachineFilter(id)}
        // Filtering
        onSelectProject={(name) => setProjectFilter(name)}
        onSelectSession={handleSelectSession}
        onSessionKilled={handleSessionKilled}
        projectFilter={projectFilter}
        projects={sidebarProjects.map((p) => p.name)}
        sessions={allSessions}
      />

      {/* Main Content Area */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {selectedSession ? (
          <SessionView
            agentUrl={getAgentUrl()}
            environmentId={selectedSession.environmentId}
            isMobile={true}
            key={`${selectedSession.machineId}-${selectedSession.project}-${selectedSession.sessionName.endsWith("--new") ? "new" : selectedSession.sessionName}`}
            onMenuClick={handleMenuClick}
            onSessionCreated={handleSessionCreated}
            planningProjectId={selectedSession.planningProjectId}
            project={selectedSession.project}
            sessionInfo={getSelectedSessionInfo()}
            sessionName={selectedSession.sessionName}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-500/10 bg-orange-500/5">
                <Zap className="h-8 w-8 text-orange-500/30" />
              </div>
              <p className="text-sm text-white/40">
                Select a session or create a new one
              </p>
            </div>
          </div>
        )}
      </div>

      {modals}

      {/* PWA Install Banner - only on mobile */}
      <InstallBanner />
    </main>
  );
}
