'use client';

import { useState } from 'react';
import { HomeSidebar, type ViewTab } from '@/components/HomeSidebar';
import { DashboardContent } from '@/components/DashboardContent';
import { SessionView } from '@/components/SessionView';
import { NewSessionModal } from '@/components/NewSessionModal';
import { AgentConnectionSettings } from '@/components/AgentConnectionSettings';
import { MobileSidebarDrawer } from '@/components/MobileSidebarDrawer';
import { InstallBanner } from '@/components/InstallBanner';
import { LoadingView } from './LoadingView';
import { NoConnectionView } from './NoConnectionView';
import { Header } from './Header';
import { useHomeState } from './useHomeState';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useViewportHeight } from '@/hooks/useViewportHeight';

export function HomeContent() {
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewTab, setViewTab] = useState<ViewTab>('terminal');

  // Set CSS variable for viewport height (handles mobile keyboard)
  useViewportHeight();

  const {
    loading,
    agentConnection,
    connectionModalOpen,
    setConnectionModalOpen,
    newSessionOpen,
    setNewSessionOpen,
    activeTab,
    setActiveTab,
    selectedSession,
    setSelectedSession,
    isFullscreen,
    setIsFullscreen,
    allSessions,
    needsAttention,
    currentMachine,
    getArchivedSessions,
    getAgentUrl,
    getSelectedSessionInfo,
    handleSelectSession,
    handleStartSession,
    handleSessionCreated,
    handleSessionKilled,
    handleSessionArchived,
    handleConnectionSaved,
    clearSessionFromUrl,
  } = useHomeState();

  if (loading) {
    return <LoadingView />;
  }

  if (!agentConnection) {
    return (
      <NoConnectionView
        modalOpen={connectionModalOpen}
        onModalOpenChange={setConnectionModalOpen}
        onConnectionSaved={handleConnectionSaved}
      />
    );
  }

  // Handler for menu button in session view
  const handleMenuClick = () => {
    if (isMobile) {
      // On mobile: open sidebar drawer
      setMobileMenuOpen(true);
    } else {
      // On desktop: go back to session list
      setSelectedSession(null);
      clearSessionFromUrl();
    }
  };

  // Connected state - Split View Layout
  return (
    <main className="h-screen-safe flex flex-col overflow-hidden bg-[#0a0a10]">
      {/* Header - hidden when a session is selected (minimalist design) */}
      {!selectedSession && (
        <Header
          agentUrl={agentConnection.url}
          sessionCount={allSessions.length}
          needsAttention={needsAttention}
          selectedSession={selectedSession}
          isFullscreen={isFullscreen}
          onConnectionSettingsClick={() => setConnectionModalOpen(true)}
          onToggleFullscreen={() => setIsFullscreen((prev) => !prev)}
          onNewSession={() => setNewSessionOpen(true)}
          isMobile={isMobile}
          onMobileMenuClick={() => setMobileMenuOpen(true)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      {isMobile && (
        <MobileSidebarDrawer
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          title={`${allSessions.length} Session${allSessions.length !== 1 ? 's' : ''}`}
        >
          <HomeSidebar
            sessions={allSessions}
            archivedSessions={getArchivedSessions()}
            selectedSession={selectedSession}
            onSelectSession={handleSelectSession}
            onNewSession={() => {
              setMobileMenuOpen(false);
              setNewSessionOpen(true);
            }}
            onSessionKilled={handleSessionKilled}
            onSessionArchived={handleSessionArchived}
            isMobileDrawer={true}
            onMobileSessionSelect={() => setMobileMenuOpen(false)}
            activeTab={viewTab}
            onTabChange={setViewTab}
          />
        </MobileSidebarDrawer>
      )}

      {/* Main Split View */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar - hidden on mobile and in fullscreen */}
        {!isFullscreen && !isMobile && (
          <HomeSidebar
            sessions={allSessions}
            archivedSessions={getArchivedSessions()}
            selectedSession={selectedSession}
            onSelectSession={handleSelectSession}
            onNewSession={() => setNewSessionOpen(true)}
            onSessionKilled={handleSessionKilled}
            onSessionArchived={handleSessionArchived}
            activeTab={viewTab}
            onTabChange={setViewTab}
          />
        )}

        {/* Main Content Area */}
        <div className="relative flex flex-1 flex-col overflow-hidden">
          {selectedSession ? (
            <SessionView
              sessionName={selectedSession.sessionName}
              project={selectedSession.project}
              agentUrl={getAgentUrl()}
              sessionInfo={getSelectedSessionInfo()}
              environmentId={selectedSession.environmentId}
              ralphConfig={selectedSession.ralphConfig}
              onMenuClick={handleMenuClick}
              onSessionCreated={handleSessionCreated}
              activeTab={viewTab}
              isMobile={isMobile}
            />
          ) : (
            <DashboardContent
              machines={currentMachine ? [currentMachine] : []}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onSelectSession={(machineId, sessionName) => {
                const session = allSessions.find(
                  (s) => s.machineId === machineId && s.name === sessionName
                );
                if (session) {
                  handleSelectSession(machineId, sessionName, session.project);
                }
              }}
              onNewSession={() => setNewSessionOpen(true)}
              isMobile={isMobile}
            />
          )}
        </div>
      </div>

      {/* Connection Settings Modal */}
      <AgentConnectionSettings
        open={connectionModalOpen}
        onOpenChange={setConnectionModalOpen}
        onSave={handleConnectionSaved}
      />

      {/* New Session Modal */}
      <NewSessionModal
        open={newSessionOpen}
        onOpenChange={setNewSessionOpen}
        machines={currentMachine ? [currentMachine] : []}
        onStartSession={handleStartSession}
      />

      {/* PWA Install Banner - only on mobile */}
      {isMobile && <InstallBanner />}
    </main>
  );
}
