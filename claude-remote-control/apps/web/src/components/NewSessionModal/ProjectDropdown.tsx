"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Home, Loader2, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Special value for "Terminal at root" option
export const TERMINAL_AT_ROOT = "__ROOT__";

interface ProjectDropdownProps {
  accentColor?: "orange" | "purple";
  folders: string[];
  loading: boolean;
  onSelectProject: (project: string) => void;
  selectedProject: string;
  showRootOption?: boolean;
}

export function ProjectDropdown({
  folders,
  selectedProject,
  onSelectProject,
  loading,
  accentColor = "orange",
  showRootOption = true,
}: ProjectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Auto-focus search input when dropdown opens, reset search when closed
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const rafId = requestAnimationFrame(() => {
      menuRef.current?.scrollIntoView({ block: "nearest" });
    });
    return () => cancelAnimationFrame(rafId);
  }, [open]);

  // Filter folders based on search query
  const filteredFolders = folders.filter((folder) =>
    folder.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedClass =
    accentColor === "purple"
      ? "bg-purple-500/10 text-purple-400"
      : "bg-orange-500/10 text-orange-400";

  return (
    <div className="relative">
      <button
        className={cn(
          "w-full rounded-xl px-4 py-3 text-left",
          "border border-white/10 bg-white/5",
          "hover:border-white/20 hover:bg-white/10",
          "flex items-center justify-between",
          "transition-all"
        )}
        onClick={() => setOpen(!open)}
      >
        <span
          className={cn(
            "flex items-center gap-2",
            selectedProject ? "text-white" : "text-white/40"
          )}
        >
          {selectedProject === TERMINAL_AT_ROOT && (
            <Home className="h-4 w-4 text-white/60" />
          )}
          {selectedProject === TERMINAL_AT_ROOT
            ? "Terminal at root"
            : selectedProject || "Choose a project..."}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-white/40 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "absolute top-full right-0 left-0 z-10 mt-2",
              "rounded-xl border border-white/10 bg-[#12121a]",
              "shadow-black/50 shadow-xl",
              "flex max-h-[50vh] flex-col overflow-hidden sm:max-h-64"
            )}
            exit={{ opacity: 0, y: -5 }}
            initial={{ opacity: 0, y: -5 }}
            ref={menuRef}
            transition={{ duration: 0.15 }}
          >
            {/* Search input */}
            <div className="flex-shrink-0 border-white/10 border-b p-2">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  className={cn(
                    "w-full rounded-lg py-2 pr-3 pl-9 text-sm",
                    "border border-white/10 bg-white/5",
                    "text-white placeholder:text-white/30",
                    "focus:border-white/20 focus:outline-none"
                  )}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects..."
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                />
              </div>
            </div>

            {/* Folders list */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center gap-2 px-4 py-3 text-sm text-white/30">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading folders...
                </div>
              ) : (
                <>
                  {/* Terminal at root option */}
                  {showRootOption && !searchQuery && (
                    <>
                      <button
                        className={cn(
                          "flex w-full items-center gap-2 px-4 py-2.5 text-left",
                          "transition-colors hover:bg-white/5",
                          selectedProject === TERMINAL_AT_ROOT
                            ? selectedClass
                            : "text-white/60"
                        )}
                        onClick={() => {
                          onSelectProject(TERMINAL_AT_ROOT);
                          setOpen(false);
                        }}
                      >
                        <Home className="h-4 w-4" />
                        Terminal at root
                      </button>
                      {filteredFolders.length > 0 && (
                        <div className="mx-4 my-1 border-white/10 border-t" />
                      )}
                    </>
                  )}

                  {/* Project folders */}
                  {filteredFolders.length > 0 ? (
                    filteredFolders.map((folder) => (
                      <button
                        className={cn(
                          "w-full px-4 py-2.5 text-left",
                          "transition-colors hover:bg-white/5",
                          selectedProject === folder
                            ? selectedClass
                            : "text-white/80"
                        )}
                        key={folder}
                        onClick={() => {
                          onSelectProject(folder);
                          setOpen(false);
                        }}
                      >
                        {folder}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-white/30">
                      {folders.length > 0
                        ? "No matching projects"
                        : "No folders found"}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
