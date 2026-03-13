"use client";

import { motion } from "framer-motion";
import { Archive, Clock, DollarSign, X } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatRelativeTime } from "@/lib/time";
import type { SessionInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface SessionMiniCardProps {
  isActive: boolean;
  onArchive?: () => Promise<void>;
  onClick: () => void;
  onKill?: () => Promise<void>;
  session: SessionInfo & {
    machineId: string;
  };
}

export function SessionMiniCard({
  session,
  isActive,
  onClick,
  onKill,
  onArchive,
}: SessionMiniCardProps) {
  const [showKillConfirm, setShowKillConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [isKilling, setIsKilling] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const displayName = session.name.split("--")[1] || session.name;

  const handleKillClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowKillConfirm(true);
  };

  const handleKillConfirm = async () => {
    if (!onKill) {
      return;
    }
    setIsKilling(true);
    try {
      await onKill();
      setShowKillConfirm(false);
    } finally {
      setIsKilling(false);
    }
  };

  const handleArchiveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowArchiveConfirm(true);
  };

  const handleArchiveConfirm = async () => {
    if (!onArchive) {
      return;
    }
    setIsArchiving(true);
    try {
      await onArchive();
      setShowArchiveConfirm(false);
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <>
      <motion.button
        className={cn(
          "relative w-full rounded-xl p-3 text-left transition-all",
          "min-h-[72px] touch-manipulation border",
          isActive
            ? "border-orange-500/30 bg-white/10 shadow-lg shadow-orange-500/10"
            : "border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/10"
        )}
        data-active={isActive}
        data-testid="session-mini-card"
        onClick={onClick}
        whileTap={{ scale: 0.97 }}
      >
        {/* Action buttons */}
        {(onKill || onArchive) && (
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
            {onArchive && (
              <button
                aria-label="Archive session"
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md",
                  "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60",
                  "touch-manipulation transition-all active:scale-90"
                )}
                data-testid="archive-button"
                onClick={handleArchiveClick}
              >
                <Archive className="h-3.5 w-3.5" />
              </button>
            )}
            {onKill && (
              <button
                aria-label="Kill session"
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md",
                  "bg-red-500/10 text-red-400/70 hover:bg-red-500/20 hover:text-red-400",
                  "touch-manipulation transition-all active:scale-90"
                )}
                data-testid="kill-button"
                onClick={handleKillClick}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        <div className="flex items-start gap-2.5">
          {/* Simple session indicator */}
          <div
            className={cn(
              "h-6 w-6 flex-shrink-0 rounded-full",
              isActive ? "bg-orange-500/30" : "bg-white/10"
            )}
          />

          <div className="min-w-0 flex-1 pr-14">
            <div
              className="truncate font-mono text-sm text-white"
              data-testid="session-name"
            >
              {displayName}
            </div>
            <div
              className="mt-0.5 truncate text-[11px] text-white/40"
              data-testid="session-project"
            >
              {session.project}
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-[10px] text-white/30">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span data-testid="session-time">
                  {formatRelativeTime(session.createdAt)}
                </span>
              </span>
              {/* Cost badge */}
              {session.costUsd !== undefined && (
                <span className="flex items-center gap-0.5 text-emerald-400/60">
                  <DollarSign className="h-2.5 w-2.5" />
                  {session.costUsd < 0.01
                    ? "<0.01"
                    : session.costUsd.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Active indicator */}
        {isActive && (
          <motion.div
            className="absolute top-3 bottom-3 left-0 w-0.5 rounded-r-full bg-gradient-to-b from-orange-400 to-amber-500"
            data-testid="active-indicator"
            layoutId="mobileActiveSessionIndicator"
          />
        )}
      </motion.button>

      <ConfirmDialog
        confirmText="Terminate"
        description={`This will kill the session "${displayName}" (${session.project}). This action cannot be undone.`}
        isLoading={isKilling}
        onConfirm={handleKillConfirm}
        onOpenChange={setShowKillConfirm}
        open={showKillConfirm}
        title="Terminate session?"
        variant="destructive"
      />

      <ConfirmDialog
        confirmText="Archive"
        description={`Archive "${displayName}" (${session.project})? The terminal will be closed but the session will be kept in history.`}
        isLoading={isArchiving}
        onConfirm={handleArchiveConfirm}
        onOpenChange={setShowArchiveConfirm}
        open={showArchiveConfirm}
        title="Archive session?"
        variant="default"
      />
    </>
  );
}
