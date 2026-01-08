'use client';

import { Menu, Search, Sparkles, Copy, Check, ArrowLeft } from 'lucide-react';
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
}: MinimalSessionHeaderProps) {
  const displayName = sessionName.split('--')[1] || sessionName;
  const isNewSession = sessionName.endsWith('--new');

  return (
    <div
      className={cn(
        'flex items-center border-b border-white/5 bg-[#0d0d14]/90 backdrop-blur-sm',
        'safe-area-top', // Respects iOS notch
        isMobile ? 'h-11 gap-2 px-2' : 'h-12 gap-3 px-3'
      )}
    >
      {/* Left: Menu button */}
      <button
        onClick={onMenuClick}
        className={cn(
          'flex items-center justify-center rounded-lg',
          'text-white/50 hover:bg-white/5 hover:text-white',
          'touch-manipulation transition-colors',
          isMobile ? 'h-9 w-9' : 'h-8 w-8'
        )}
        aria-label={isMobile ? 'Open menu' : 'Back to sessions'}
      >
        {isMobile ? <Menu className="h-5 w-5" /> : <ArrowLeft className="h-4 w-4" />}
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
        <span className={cn('truncate font-mono text-white/70', isMobile ? 'text-sm' : 'text-sm')}>
          {isNewSession ? 'New Session' : displayName}
        </span>
      </div>

      {/* Right: Action buttons */}
      <div className={cn('flex flex-shrink-0 items-center', isMobile ? 'gap-0.5' : 'gap-1')}>
        {/* Start Claude Button - only when not working */}
        {claudeStatus !== 'working' && (
          <button
            onClick={onStartClaude}
            disabled={!connected}
            className={cn(
              'flex touch-manipulation items-center justify-center rounded-lg transition-all',
              isMobile ? 'h-9 w-9' : 'h-8 w-8',
              connected
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20 hover:from-orange-400 hover:to-amber-400'
                : 'cursor-not-allowed bg-white/5 text-white/30'
            )}
            title="Start Claude"
          >
            <Sparkles className={isMobile ? 'h-4 w-4' : 'h-4 w-4'} />
          </button>
        )}

        {/* Copy Button */}
        <button
          onClick={onCopySelection}
          className={cn(
            'flex touch-manipulation items-center justify-center rounded-lg transition-colors',
            'text-white/40 hover:bg-white/5 hover:text-white',
            isMobile ? 'h-9 w-9' : 'h-8 w-8'
          )}
          title="Copy selection"
        >
          {copied ? (
            <Check className={cn('text-emerald-400', isMobile ? 'h-4 w-4' : 'h-4 w-4')} />
          ) : (
            <Copy className={isMobile ? 'h-4 w-4' : 'h-4 w-4'} />
          )}
        </button>

        {/* Search Button */}
        <button
          onClick={onToggleSearch}
          className={cn(
            'flex touch-manipulation items-center justify-center rounded-lg transition-colors',
            isMobile ? 'h-9 w-9' : 'h-8 w-8',
            searchVisible
              ? 'bg-white/10 text-white'
              : 'text-white/40 hover:bg-white/5 hover:text-white'
          )}
          title="Search"
        >
          <Search className={isMobile ? 'h-4 w-4' : 'h-4 w-4'} />
        </button>
      </div>
    </div>
  );
}
