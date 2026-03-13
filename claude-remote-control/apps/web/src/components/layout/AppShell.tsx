"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState } from "react";
import { spring } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { AppHeader } from "./AppHeader";
import { type SessionListItem, SessionListPanel } from "./SessionListPanel";
import { Sidebar, type SidebarMachine, type SidebarProject } from "./Sidebar";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface AppShellProps {
  canRemoveMachine?: (machine: SidebarMachine) => boolean;
  children: React.ReactNode;
  // Header props
  currentMachineName?: string;
  currentProjectName?: string;
  isFullscreen?: boolean;
  // Sidebar props
  machines?: SidebarMachine[];
  onAddMachine?: () => void;
  onArchiveSession?: (session: SessionListItem) => void;
  onEditMachine?: (machine: SidebarMachine) => void;
  onKillSession?: (session: SessionListItem) => void;
  onNewSession?: () => void;
  onOpenNotificationSettings?: () => void;
  onRemoveMachine?: (machine: SidebarMachine) => void;
  onSelectMachine?: (id: string) => void;
  onSelectProject?: (projectName: string) => void;
  onSelectSession?: (session: SessionListItem) => void;
  onToggleFullscreen?: () => void;
  projects?: SidebarProject[];
  selectedMachineId?: string | null;
  selectedProjectName?: string | null;
  selectedSessionId?: string | null;
  // Session list props
  sessions?: SessionListItem[];
}

// ═══════════════════════════════════════════════════════════════════════════
// Resize Handle Component
// ═══════════════════════════════════════════════════════════════════════════

function ResizeHandle({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-1 flex-shrink-0 cursor-col-resize",
        "transition-colors duration-150 hover:bg-primary/20",
        className
      )}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// AppShell Component
// ═══════════════════════════════════════════════════════════════════════════

export function AppShell({
  children,
  // Sidebar props
  machines = [],
  projects = [],
  selectedMachineId,
  onSelectMachine,
  onAddMachine,
  onSelectProject,
  selectedProjectName,
  onEditMachine,
  onRemoveMachine,
  canRemoveMachine,
  // Session list props
  sessions = [],
  selectedSessionId,
  onSelectSession,
  onNewSession,
  onKillSession,
  onArchiveSession,
  // Header props
  currentMachineName,
  currentProjectName,
  onToggleFullscreen,
  isFullscreen = false,
  onOpenNotificationSettings,
}: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  // In fullscreen mode, hide the sidebar and session list
  if (isFullscreen) {
    return (
      <div className="flex h-screen-safe flex-col overflow-hidden bg-background">
        <AppHeader
          currentMachineName={currentMachineName}
          currentProjectName={currentProjectName}
          isFullscreen={isFullscreen}
          onNewSession={onNewSession}
          onOpenNotificationSettings={onOpenNotificationSettings}
          onSidebarToggle={handleSidebarToggle}
          onToggleFullscreen={onToggleFullscreen}
          sidebarCollapsed={sidebarCollapsed}
        />
        <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex h-screen-safe flex-col overflow-hidden bg-background">
      {/* Header */}
      <AppHeader
        currentMachineName={currentMachineName}
        currentProjectName={currentProjectName}
        isFullscreen={isFullscreen}
        onNewSession={onNewSession}
        onOpenNotificationSettings={onOpenNotificationSettings}
        onSidebarToggle={handleSidebarToggle}
        onToggleFullscreen={onToggleFullscreen}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Main Content - 3 Panel Layout */}
      <div className="flex flex-1 gap-1 overflow-hidden p-2">
        {/* Panel 1: Sidebar (Machines & Projects) - Fixed width */}
        <AnimatePresence mode="wait">
          <motion.div
            animate={{ width: sidebarCollapsed ? 56 : 240 }}
            className="h-full flex-shrink-0"
            exit={{ opacity: 0 }}
            initial={{ width: sidebarCollapsed ? 56 : 240 }}
            key={sidebarCollapsed ? "collapsed" : "expanded"}
            transition={spring.snappy}
          >
            <Sidebar
              canRemoveMachine={canRemoveMachine}
              collapsed={sidebarCollapsed}
              machines={machines}
              onAddMachine={onAddMachine}
              onEditMachine={onEditMachine}
              onRemoveMachine={onRemoveMachine}
              onSelectMachine={onSelectMachine}
              onSelectProject={onSelectProject}
              onToggle={handleSidebarToggle}
              projects={projects}
              selectedMachineId={selectedMachineId}
              selectedProjectName={selectedProjectName}
            />
          </motion.div>
        </AnimatePresence>

        <ResizeHandle />

        {/* Panel 2: Session List - Fixed width */}
        <div className="h-full flex-shrink-0" style={{ width: 320 }}>
          <SessionListPanel
            onArchiveSession={onArchiveSession}
            onKillSession={onKillSession}
            onNewSession={onNewSession}
            onSelectSession={onSelectSession}
            selectedSessionId={selectedSessionId}
            sessions={sessions}
          />
        </div>

        <ResizeHandle />

        {/* Panel 3: Main Content (Terminal) - Flex grow */}
        <main className="panel flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
