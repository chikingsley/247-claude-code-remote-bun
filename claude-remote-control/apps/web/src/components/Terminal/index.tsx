"use client";

import { useEffect, useRef, useState } from "react";
import "@xterm/xterm/css/xterm.css";
import { MinimalSessionHeader } from "@/components/MinimalSessionHeader";
import { useKeybarVisibility } from "@/hooks/useKeybarVisibility";
import { generateSessionName } from "./constants";
import { useTerminalConnection, useTerminalSearch } from "./hooks";
import { KeybarToggleButton } from "./KeybarToggleButton";
import { MobileKeybar } from "./MobileKeybar";
import { ScrollToBottomButton } from "./ScrollToBottomButton";
import { SearchBar } from "./SearchBar";

interface TerminalProps {
  agentUrl: string;
  costUsd?: number;
  environmentId?: string;
  /** Mobile mode for responsive styling and smaller font */
  isMobile?: boolean;
  // StatusLine metrics
  model?: string;
  onConnectionChange?: (connected: boolean) => void;
  /** Callback when menu button is clicked (opens sidebar) */
  onMenuClick: () => void;
  onSessionCreated?: (sessionName: string) => void;
  planningProjectId?: string;
  project: string;
  sessionName?: string;
}

export function Terminal({
  agentUrl,
  project,
  sessionName,
  environmentId,
  planningProjectId,
  onConnectionChange,
  onSessionCreated,
  onMenuClick,
  isMobile = false,
  model,
  costUsd,
}: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const { isVisible: keybarVisible, toggle: toggleKeybar } =
    useKeybarVisibility();

  // Generate session name ONCE on first render, persisted across re-mounts
  const generatedSessionRef = useRef<string | null>(null);
  if (!(sessionName || generatedSessionRef.current)) {
    generatedSessionRef.current = generateSessionName(project);
  }
  const effectiveSessionName = sessionName || generatedSessionRef.current || "";

  const handleCopySuccess = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const {
    connected,
    connectionState,
    isAtBottom,
    xtermRef,
    searchAddonRef,
    scrollToBottom,
    copySelection,
    startClaude,
    sendInput,
    triggerResize,
  } = useTerminalConnection({
    terminalRef,
    agentUrl,
    project,
    sessionName: effectiveSessionName,
    environmentId,
    planningProjectId,
    onSessionCreated,
    onCopySuccess: handleCopySuccess,
    isMobile,
  });

  // Handle paste from clipboard (for mobile header button)
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        sendInput(text);
      }
    } catch {
      // Clipboard access denied - silently fail
    }
  };

  const {
    searchVisible,
    searchQuery,
    setSearchQuery,
    searchInputRef,
    toggleSearch,
    closeSearch,
    findNext,
    findPrevious,
  } = useTerminalSearch(searchAddonRef, xtermRef);

  // Notify parent of connection changes
  useEffect(() => {
    onConnectionChange?.(connected);
  }, [connected, onConnectionChange]);

  // Trigger terminal resize when keybar visibility changes (mobile only)
  useEffect(() => {
    if (!isMobile) {
      return;
    }
    // Small delay to allow CSS transition to start
    const timer = setTimeout(() => {
      triggerResize();
    }, 50);
    return () => clearTimeout(timer);
  }, [keybarVisible, isMobile, triggerResize]);

  return (
    <div className="relative flex w-full flex-1 flex-col overflow-hidden">
      <MinimalSessionHeader
        connected={connected}
        connectionState={connectionState}
        copied={copied}
        costUsd={costUsd}
        isMobile={isMobile}
        model={model}
        onCopySelection={copySelection}
        onMenuClick={onMenuClick}
        onPaste={isMobile ? handlePaste : undefined}
        onStartClaude={startClaude}
        onToggleSearch={toggleSearch}
        searchVisible={searchVisible}
        sessionName={effectiveSessionName}
      />

      <SearchBar
        onClose={closeSearch}
        onFindNext={findNext}
        onFindPrevious={findPrevious}
        onQueryChange={setSearchQuery}
        query={searchQuery}
        ref={searchInputRef}
        visible={searchVisible}
      />

      {/* Terminal container - NO padding! FitAddon reads offsetHeight which includes padding,
          but xterm renders inside padding box, causing dimension mismatch */}
      {/* touch-action: none is CRITICAL for mobile - prevents browser from intercepting touch events */}
      <div
        className="min-h-0 w-full flex-1 overflow-hidden bg-[#0a0a10]"
        ref={terminalRef}
        style={isMobile ? { touchAction: "none" } : undefined}
      />

      <ScrollToBottomButton onClick={scrollToBottom} visible={!isAtBottom} />

      {/* Mobile: Keybar toggle button and virtual keyboard */}
      {isMobile && (
        <>
          <KeybarToggleButton
            isVisible={keybarVisible}
            onToggle={toggleKeybar}
          />
          <MobileKeybar onKeyPress={sendInput} visible={keybarVisible} />
        </>
      )}
    </div>
  );
}
