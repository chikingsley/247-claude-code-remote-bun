'use client';

import { Search, Sparkles, Copy, Check, ArrowLeft, DollarSign, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SessionStatus } from './ui/status-badge';

interface MinimalSessionHeaderProps {
  sessionName: string;
  status?: SessionStatus;
  connectionState: 'connected' | 'disconnected' | 'reconnecting';
  connected: boolean;
  copied: boolean;
  searchVisible: boolean;
  claudeStatus?: 'init' | 'working' | 'needs_attention' | 'idle';
  isMobile?: boolean;
  onMenuClick: () => void;
  onStartClaude: () => void;
  onCopySelection: () => void;
  onToggleSearch: () => void;
  // StatusLine metrics
  model?: string;
  costUsd?: number;
  contextUsage?: number;
}

const STATUS_COLORS: Record<SessionStatus, string> = {
  working: 'bg-orange-500',
  needs_attention: 'bg-amber-500 animate-pulse',
  idle: 'bg-emerald-500',
  init: 'bg-blue-500',
};

/**
 * Ultra-minimal session header - single line with essential controls only.
 * Replaces both SessionView header and Terminal Toolbar.
 */
export function MinimalSessionHeader({
  sessionName,
  status,
  connectionState,
  connected,
  copied,
  searchVisible,
  claudeStatus,
  isMobile = false,
  onMenuClick,
  onStartClaude,
  onCopySelection,
  onToggleSearch,
  model,
  costUsd,
  contextUsage,
}: MinimalSessionHeaderProps) {
  const displayName = sessionName.split('--')[1] || sessionName;
  const isNewSession = sessionName.endsWith('--new');

  // On mobile, only show action buttons (session info is in MobileStatusStrip)
  if (isMobile) {
    return (
      <div className="flex h-10 items-center justify-end gap-1 border-b border-white/5 bg-[#0d0d14]/90 px-2 backdrop-blur-sm">
        {/* Reconnecting indicator */}
        {connectionState === 'reconnecting' && (
          <span className="mr-auto flex items-center gap-1.5 text-xs text-amber-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
            Reconnecting...
          </span>
        )}

        {/* Start Claude Button - only when not working */}
        {claudeStatus !== 'working' && (
          <button
            onClick={onStartClaude}
            disabled={!connected}
            className={cn(
              'flex h-8 w-8 touch-manipulation items-center justify-center rounded-lg transition-all',
              connected
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20 hover:from-orange-400 hover:to-amber-400'
                : 'cursor-not-allowed bg-white/5 text-white/30'
            )}
            title="Start Claude"
          >
            <Sparkles className="h-4 w-4" />
          </button>
        )}

        {/* Copy Button */}
        <button
          onClick={onCopySelection}
          className="flex h-8 w-8 touch-manipulation items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/5 hover:text-white"
          title="Copy selection"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
        </button>

        {/* Search Button */}
        <button
          onClick={onToggleSearch}
          className={cn(
            'flex h-8 w-8 touch-manipulation items-center justify-center rounded-lg transition-colors',
            searchVisible
              ? 'bg-white/10 text-white'
              : 'text-white/40 hover:bg-white/5 hover:text-white'
          )}
          title="Search"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Desktop: Full header with menu button and session name
  const hasMetrics = model !== undefined || costUsd !== undefined || contextUsage !== undefined;

  return (
    <div className="flex h-12 items-center gap-3 border-b border-white/5 bg-[#0d0d14]/90 px-3 backdrop-blur-sm">
      {/* Left: Back button */}
      <button
        onClick={onMenuClick}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/5 hover:text-white"
        aria-label="Back to sessions"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      {/* Center: Session name + Status indicator */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {/* Status dot */}
        {status && (
          <span
            className={cn('h-2 w-2 flex-shrink-0 rounded-full', STATUS_COLORS[status])}
            title={status}
          />
        )}

        {/* Reconnecting indicator */}
        {connectionState === 'reconnecting' && (
          <span className="h-2 w-2 flex-shrink-0 animate-pulse rounded-full bg-amber-500" />
        )}

        {/* Session name */}
        <span className="truncate font-mono text-sm text-white/70">
          {isNewSession ? 'New Session' : displayName}
        </span>

        {/* StatusLine Metrics - elegant inline display */}
        {hasMetrics && (
          <div className="ml-2 hidden items-center gap-1.5 md:flex">
            <span className="text-white/10">·</span>

            {/* Model */}
            {model && (
              <span
                className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px] font-medium text-white/40 transition-colors hover:bg-white/10 hover:text-white/60"
                title="Model"
              >
                {model}
              </span>
            )}

            {/* Cost */}
            {costUsd !== undefined && (
              <span
                className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-medium text-emerald-400/80"
                title="Session cost"
              >
                <DollarSign className="h-2.5 w-2.5" />
                {costUsd < 0.01 ? '<0.01' : costUsd.toFixed(2)}
              </span>
            )}

            {/* Context Usage */}
            {contextUsage !== undefined && (
              <span
                className={cn(
                  'flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-medium',
                  contextUsage > 80
                    ? 'bg-red-500/10 text-red-400/80'
                    : contextUsage > 60
                      ? 'bg-yellow-500/10 text-yellow-400/80'
                      : 'bg-blue-500/10 text-blue-400/80'
                )}
                title="Context window usage"
              >
                <Cpu className="h-2.5 w-2.5" />
                {contextUsage}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: Action buttons */}
      <div className="flex flex-shrink-0 items-center gap-1">
        {/* Start Claude Button - only when not working */}
        {claudeStatus !== 'working' && (
          <button
            onClick={onStartClaude}
            disabled={!connected}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
              connected
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20 hover:from-orange-400 hover:to-amber-400'
                : 'cursor-not-allowed bg-white/5 text-white/30'
            )}
            title="Start Claude"
          >
            <Sparkles className="h-4 w-4" />
          </button>
        )}

        {/* Copy Button */}
        <button
          onClick={onCopySelection}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/5 hover:text-white"
          title="Copy selection"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
        </button>

        {/* Search Button */}
        <button
          onClick={onToggleSearch}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
            searchVisible
              ? 'bg-white/10 text-white'
              : 'text-white/40 hover:bg-white/5 hover:text-white'
          )}
          title="Search"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
