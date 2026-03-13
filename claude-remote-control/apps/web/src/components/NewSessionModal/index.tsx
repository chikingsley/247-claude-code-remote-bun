"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CloneRepoTab } from "./CloneRepoTab";
import { useClone, useFolders } from "./hooks";
import { MachineSelector } from "./MachineSelector";
import { TERMINAL_AT_ROOT } from "./ProjectDropdown";
import { SelectFolderTab } from "./SelectFolderTab";
import { TabSelector, type TabType } from "./TabSelector";

interface Machine {
  config?: {
    projects: string[];
    agentUrl?: string;
  };
  id: string;
  name: string;
  status: string;
}

interface NewSessionModalProps {
  machines: Machine[];
  onOpenChange: (open: boolean) => void;
  onStartSession: (
    machineId: string,
    project: string,
    environmentId?: string
  ) => void;
  open: boolean;
}

export function NewSessionModal({
  open,
  onOpenChange,
  machines,
  onStartSession,
}: NewSessionModalProps) {
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("existing");

  // Custom hooks
  const {
    folders,
    selectedProject,
    setSelectedProject,
    loadingFolders,
    addFolder,
  } = useFolders(selectedMachine);
  const { cloneRepo, cloning, cloneError, clearError } =
    useClone(selectedMachine);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedMachine(null);
      setActiveTab("existing");
      clearError();
    }
  }, [open, clearError]);

  const handleStartSession = useCallback(() => {
    if (selectedMachine && selectedProject) {
      // Pass empty string for root, otherwise pass the project name
      const project =
        selectedProject === TERMINAL_AT_ROOT ? "" : selectedProject;
      onStartSession(selectedMachine.id, project);
      onOpenChange(false);
    }
  }, [selectedMachine, selectedProject, onStartSession, onOpenChange]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
      // Only handle Enter on existing tab (clone tab has its own Enter handler)
      if (
        e.key === "Enter" &&
        activeTab === "existing" &&
        selectedMachine &&
        selectedProject
      ) {
        handleStartSession();
      }
    },
    [
      onOpenChange,
      activeTab,
      selectedMachine,
      selectedProject,
      handleStartSession,
    ]
  );

  useEffect(() => {
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, handleKeyDown]);

  const handleClone = async (url: string) => {
    const result = await cloneRepo(url);
    if (result.success && result.project && selectedMachine) {
      // Add the new folder to the list and start session
      addFolder(result.project);
      onStartSession(selectedMachine.id, result.project);
      onOpenChange(false);
    }
    return result;
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[60] flex items-center justify-center"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          <motion.div
            animate={{ scale: 1, opacity: 1, y: 0 }}
            aria-labelledby="new-session-title"
            aria-modal="true"
            className={cn(
              "relative mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col",
              "rounded-2xl border border-white/10 bg-[#0d0d14]",
              "shadow-2xl shadow-black/50"
            )}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            role="dialog"
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="flex flex-none items-center justify-between border-white/5 border-b px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-500/20 to-amber-500/20">
                  <Plus className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <h2
                    className="font-semibold text-lg text-white"
                    id="new-session-title"
                  >
                    New Session
                  </h2>
                  <p className="text-sm text-white/40">
                    Select a machine and project
                  </p>
                </div>
              </div>
              <button
                aria-label="Close"
                className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white focus-visible:ring-1 focus-visible:ring-orange-500/50"
                onClick={() => onOpenChange(false)}
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              <MachineSelector
                machines={machines}
                onSelectMachine={setSelectedMachine}
                selectedMachine={selectedMachine}
              />

              {selectedMachine && (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                  initial={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <TabSelector
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                  />

                  {activeTab === "existing" ? (
                    <SelectFolderTab
                      folders={folders}
                      loadingFolders={loadingFolders}
                      onSelectProject={setSelectedProject}
                      selectedProject={selectedProject}
                    />
                  ) : (
                    <CloneRepoTab
                      error={cloneError}
                      loading={cloning}
                      onClone={handleClone}
                    />
                  )}
                </motion.div>
              )}
            </div>

            {/* Footer - only show on existing tab */}
            {activeTab === "existing" && (
              <div className="flex flex-none items-center justify-between border-white/5 border-t px-6 py-4">
                <p className="text-white/30 text-xs">
                  Press{" "}
                  <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white/50">
                    Enter
                  </kbd>{" "}
                  to start
                </p>
                <button
                  className={cn(
                    "touch-manipulation active:scale-[0.98]",
                    "flex items-center gap-2 rounded-xl px-5 py-2.5 font-medium transition-all",
                    selectedMachine && selectedProject
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25 hover:from-orange-400 hover:to-amber-400"
                      : "cursor-not-allowed bg-white/5 text-white/30"
                  )}
                  disabled={!(selectedMachine && selectedProject)}
                  onClick={handleStartSession}
                >
                  <Sparkles className="h-4 w-4" />
                  Start Session
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
