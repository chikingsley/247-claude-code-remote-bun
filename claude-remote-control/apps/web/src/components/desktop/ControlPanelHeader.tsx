'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ControlPanelHeaderProps {
  totalSessions: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function ControlPanelHeader({
  totalSessions,
  isCollapsed,
  onToggleCollapse,
}: ControlPanelHeaderProps) {
  return (
    <div className="border-b border-white/5">
      {/* Header Row */}
      <div className="flex items-center justify-between px-3 py-2">
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded bg-white/5">
                <span className="font-mono text-[10px] text-white/60">▣</span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">
                Sessions
              </span>
              {totalSessions > 0 && (
                <span className="flex h-4 items-center rounded-full bg-emerald-500/20 px-1.5 text-[10px] font-medium text-emerald-400">
                  {totalSessions} active
                </span>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded bg-white/5">
                <span className="font-mono text-[10px] text-white/60">▣</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={onToggleCollapse}
          className={cn(
            'rounded-lg p-1.5 transition-colors',
            'text-white/40 hover:bg-white/5 hover:text-white/60'
          )}
          data-testid="collapse-toggle"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Collapsed Session Count */}
      <AnimatePresence>
        {isCollapsed && totalSessions > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-1 pb-3"
          >
            <div
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full',
                'bg-emerald-500/20 text-[10px] font-bold text-emerald-400'
              )}
            >
              {totalSessions}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
