'use client';

import { forwardRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Circle,
  X,
  Archive,
  DollarSign,
  Code,
  GitBranch,
  GitPullRequest,
  Loader2,
} from 'lucide-react';
import { type SessionInfo } from '@/lib/types';
import { ConfirmDialog } from './ui/confirm-dialog';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/time';

interface SessionCardProps {
  session: SessionInfo;
  isActive: boolean;
  isCollapsed: boolean;
  index: number;
  onClick: () => void;
  onKill?: () => Promise<void>;
  onArchive?: () => Promise<void>;
  onPushBranch?: () => Promise<void>;
  onCreatePR?: () => void;
  /** Session has a worktree with a branch */
  hasWorktree?: boolean;
  /** Branch name for display */
  branchName?: string;
  /** Mobile mode - larger touch targets */
  isMobile?: boolean;
}

export const SessionCard = forwardRef<HTMLButtonElement, SessionCardProps>(
  (
    {
      session,
      isActive,
      isCollapsed,
      index,
      onClick,
      onKill,
      onArchive,
      onPushBranch,
      onCreatePR,
      hasWorktree,
      branchName,
      isMobile = false,
    },
    ref
  ) => {
    const [showKillConfirm, setShowKillConfirm] = useState(false);
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
    const [isKilling, setIsKilling] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);
    const [isPushing, setIsPushing] = useState(false);
    const [, setTick] = useState(0);

    // Update time display every 10 seconds
    useEffect(() => {
      const interval = setInterval(() => setTick((t) => t + 1), 10000);
      return () => clearInterval(interval);
    }, []);

    // Extract readable session name (part after --)
    const displayName = session.name.split('--')[1] || session.name;
    const shortcut = index < 9 ? index + 1 : null;

    const handleKillClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowKillConfirm(true);
    };

    const handleKillConfirm = async () => {
      if (!onKill) return;
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
      if (!onArchive) return;
      setIsArchiving(true);
      try {
        await onArchive();
        setShowArchiveConfirm(false);
      } finally {
        setIsArchiving(false);
      }
    };

    const handlePushClick = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!onPushBranch || isPushing) return;
      setIsPushing(true);
      try {
        await onPushBranch();
      } finally {
        setIsPushing(false);
      }
    };

    const handleCreatePRClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onCreatePR?.();
    };

    if (isCollapsed) {
      return (
        <>
          <button
            ref={ref}
            onClick={onClick}
            title={displayName}
            className={cn(
              'group relative w-full rounded-lg p-2 transition-all',
              'flex items-center justify-center',
              isActive
                ? 'border border-orange-500/30 bg-white/10'
                : 'border border-transparent hover:bg-white/5'
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
              <Circle className="h-4 w-4 text-white/40" />
            </div>

            {/* Kill button - collapsed mode */}
            {onKill && (
              <button
                onClick={handleKillClick}
                className={cn(
                  'absolute -right-1 -top-1 rounded-full p-1',
                  'bg-red-500/80 text-white hover:bg-red-500',
                  'opacity-0 transition-opacity group-hover:opacity-100',
                  'shadow-lg'
                )}
                title="Kill session"
              >
                <X className="h-3 w-3" />
              </button>
            )}

            {/* Active indicator line */}
            {isActive && (
              <motion.div
                layoutId="activeSidebarIndicator"
                className={cn(
                  'absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full',
                  'bg-gradient-to-b from-orange-400 to-orange-600'
                )}
              />
            )}
          </button>

          <ConfirmDialog
            open={showKillConfirm}
            onOpenChange={setShowKillConfirm}
            title="Terminate session?"
            description={`This will kill the session "${displayName}" (${session.project}). This action cannot be undone.`}
            confirmText="Terminate"
            variant="destructive"
            onConfirm={handleKillConfirm}
            isLoading={isKilling}
          />
        </>
      );
    }

    return (
      <>
        <div
          ref={ref as any}
          onClick={onClick}
          className={cn(
            'group relative w-full cursor-pointer rounded-xl p-3 text-left transition-all',
            'touch-manipulation border',
            // Mobile: larger padding and minimum height for touch
            isMobile && 'min-h-[72px] p-4',
            isActive
              ? 'border-orange-500/30 bg-gradient-to-r from-white/10 to-white/5 shadow-lg shadow-orange-500/20'
              : 'border-transparent hover:border-white/10 hover:bg-white/5'
          )}
        >
          {/* Action buttons - expanded mode (always visible on mobile) */}
          <div
            className={cn(
              'absolute right-2 top-2 z-10 flex items-center gap-1 transition-opacity',
              // Mobile: always visible; Desktop: show on hover
              isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            )}
          >
            {/* Git buttons - only show for worktree sessions */}
            {hasWorktree && (
              <>
                {/* Push branch button */}
                {onPushBranch && (
                  <button
                    onClick={handlePushClick}
                    disabled={isPushing}
                    className={cn(
                      'rounded-lg',
                      'bg-transparent text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300',
                      'touch-manipulation transition-all',
                      'disabled:cursor-not-allowed disabled:opacity-50',
                      isMobile ? 'min-h-[44px] min-w-[44px] p-2.5' : 'p-1.5'
                    )}
                    title={branchName ? `Push ${branchName}` : 'Push branch'}
                  >
                    {isPushing ? (
                      <Loader2 className={cn('animate-spin', isMobile ? 'h-5 w-5' : 'h-4 w-4')} />
                    ) : (
                      <GitBranch className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />
                    )}
                  </button>
                )}
                {/* Create PR button */}
                {onCreatePR && (
                  <button
                    onClick={handleCreatePRClick}
                    className={cn(
                      'rounded-lg',
                      'bg-transparent text-purple-400 hover:bg-purple-500/20 hover:text-purple-300',
                      'touch-manipulation transition-all',
                      isMobile ? 'min-h-[44px] min-w-[44px] p-2.5' : 'p-1.5'
                    )}
                    title="Create Pull Request"
                  >
                    <GitPullRequest className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />
                  </button>
                )}
              </>
            )}
            {/* Archive button */}
            {onArchive && (
              <button
                onClick={handleArchiveClick}
                className={cn(
                  'rounded-lg',
                  'bg-transparent text-gray-400 hover:bg-gray-500/20 hover:text-gray-300',
                  'touch-manipulation transition-all',
                  // Mobile: larger touch target
                  isMobile ? 'min-h-[44px] min-w-[44px] p-2.5' : 'p-1.5'
                )}
                title="Archive session"
              >
                <Archive className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />
              </button>
            )}
            {/* Kill button */}
            {onKill && (
              <button
                onClick={handleKillClick}
                className={cn(
                  'rounded-lg',
                  'bg-transparent text-red-400 hover:bg-red-500/20 hover:text-red-300',
                  'touch-manipulation transition-all',
                  // Mobile: larger touch target
                  isMobile ? 'min-h-[44px] min-w-[44px] p-2.5' : 'p-1.5'
                )}
                title="Kill session"
              >
                <X className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />
              </button>
            )}
          </div>

          {/* Active indicator line */}
          {isActive && (
            <motion.div
              layoutId="activeSidebarIndicator"
              className={cn(
                'absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full',
                'bg-gradient-to-b from-orange-400 to-orange-600'
              )}
            />
          )}

          <div className="flex items-start gap-3">
            {/* Session Icon */}
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
                  'border border-white/10 bg-white/5'
                )}
              >
                <Circle className="h-5 w-5 text-white/40" />
              </motion.div>
            </AnimatePresence>

            {/* Content */}
            <div className="min-w-0 flex-1 pr-6">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-white">{displayName}</span>
                {shortcut && (
                  <kbd className="hidden rounded border border-white/10 bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/40 group-hover:inline-flex">
                    ⌥{shortcut}
                  </kbd>
                )}
              </div>

              {/* Session info */}
              <div className="mt-1.5 flex items-center gap-2">
                <span className="truncate text-xs text-white/30">{session.project}</span>
                <span className="text-white/20">·</span>
                <div className="flex items-center gap-1 text-xs text-white/30">
                  <Clock className="h-3 w-3" />
                  <span>{formatRelativeTime(session.createdAt)}</span>
                </div>
                {branchName && (
                  <span
                    className="flex items-center gap-1 text-cyan-400/60"
                    title={`Branch: ${branchName}`}
                  >
                    <GitBranch className="h-3 w-3" />
                    <span className="max-w-[100px] truncate text-xs">{branchName}</span>
                  </span>
                )}
              </div>

              {/* StatusLine metrics */}
              {(session.costUsd !== undefined ||
                session.linesAdded !== undefined ||
                session.linesRemoved !== undefined) && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  {/* Cost */}
                  {session.costUsd !== undefined && (
                    <span
                      className="flex items-center gap-1 text-emerald-400/70"
                      title="Session cost"
                    >
                      <DollarSign className="h-3 w-3" />
                      {session.costUsd < 0.01 ? '<$0.01' : `$${session.costUsd.toFixed(2)}`}
                    </span>
                  )}
                  {/* Lines changed */}
                  {(session.linesAdded !== undefined || session.linesRemoved !== undefined) && (
                    <span
                      className="flex items-center gap-1 text-white/40"
                      title="Lines of code changed"
                    >
                      <Code className="h-3 w-3" />
                      <span className="text-green-400/70">+{session.linesAdded || 0}</span>
                      <span className="text-red-400/70">-{session.linesRemoved || 0}</span>
                    </span>
                  )}
                  {/* Model name */}
                  {session.model && (
                    <span className="text-white/30" title="Model">
                      {session.model}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <ConfirmDialog
          open={showKillConfirm}
          onOpenChange={setShowKillConfirm}
          title="Terminate session?"
          description={`This will kill the session "${displayName}" (${session.project}). This action cannot be undone.`}
          confirmText="Terminate"
          variant="destructive"
          onConfirm={handleKillConfirm}
          isLoading={isKilling}
        />

        <ConfirmDialog
          open={showArchiveConfirm}
          onOpenChange={setShowArchiveConfirm}
          title="Archive session?"
          description={`Archive "${displayName}" (${session.project})? The terminal will be closed but the session will be kept in history.`}
          confirmText="Archive"
          variant="default"
          onConfirm={handleArchiveConfirm}
          isLoading={isArchiving}
        />
      </>
    );
  }
);

SessionCard.displayName = 'SessionCard';
