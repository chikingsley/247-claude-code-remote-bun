"use client";

import { format, isToday, isYesterday, startOfDay } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, Clock, Plus, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  type SessionStatus,
  StatusBadge,
  StatusDot,
} from "@/components/ui/status-indicator";
import { interactive, stagger, variants } from "@/lib/animations";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface SessionListItem {
  cost?: number;
  createdAt: Date;
  id: string;
  machineId?: string;
  model?: string;
  name: string;
  project: string;
  status: SessionStatus;
  updatedAt: Date;
}

interface DateGroup {
  date: Date;
  label: string;
  sessions: SessionListItem[];
}

interface SessionListPanelProps {
  onArchiveSession?: (session: SessionListItem) => void;
  onKillSession?: (session: SessionListItem) => void;
  onNewSession?: () => void;
  onSelectSession?: (session: SessionListItem) => void;
  selectedSessionId?: string | null;
  sessions?: SessionListItem[];
}

// ═══════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════

function groupSessionsByDate(sessions: SessionListItem[]): DateGroup[] {
  const groups = new Map<string, SessionListItem[]>();

  sessions.forEach((session) => {
    const date = startOfDay(session.updatedAt);
    let label: string;

    if (isToday(date)) {
      label = "Today";
    } else if (isYesterday(date)) {
      label = "Yesterday";
    } else {
      label = format(date, "MMM d");
    }

    if (!groups.has(label)) {
      groups.set(label, []);
    }
    groups.get(label)!.push(session);
  });

  return Array.from(groups.entries())
    .map(([label, sessions]) => ({
      label,
      date: sessions[0].updatedAt,
      sessions: sessions.sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
      ),
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

function formatTime(date: Date): string {
  if (isToday(date)) {
    return format(date, "h:mm a");
  }
  return format(date, "MMM d, h:mm a");
}

// ═══════════════════════════════════════════════════════════════════════════
// Search Input Component
// ═══════════════════════════════════════════════════════════════════════════

interface SearchInputProps {
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}

function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
}: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/30" />
      <input
        className={cn(
          "w-full rounded-lg py-2 pr-8 pl-9 text-sm",
          "border border-white/10 bg-white/5",
          "text-white placeholder:text-white/30",
          "focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
          "transition-all duration-150"
        )}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
      {value && (
        <button
          aria-label="Clear search"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1.5 hover:bg-white/10"
          onClick={() => onChange("")}
        >
          <X aria-hidden="true" className="h-3 w-3 text-white/40" />
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Session Card Component
// ═══════════════════════════════════════════════════════════════════════════

interface SessionCardProps {
  onArchive?: () => void;
  onClick?: () => void;
  onKill?: () => void;
  selected?: boolean;
  session: SessionListItem;
}

function SessionCard({
  session,
  selected,
  onClick,
  onKill,
  onArchive,
}: SessionCardProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <motion.button
      className={cn(
        "w-full rounded-lg p-3 text-left",
        "transition-all duration-150",
        "hover:bg-surface-1/50 hover:shadow-thin active:scale-[0.99]",
        "group relative",
        selected && "bg-surface-1/50 shadow-thin ring-1 ring-primary/30"
      )}
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      variants={variants.fadeInUp}
      {...interactive.subtle}
    >
      <div className="flex items-start gap-3">
        {/* Status indicator */}
        <div className="pt-1">
          <StatusDot status={session.status} />
          <span className="sr-only">
            Status: {session.status.replace("_", " ")}
          </span>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Name and badge */}
          <div className="mb-0.5 flex items-center gap-2">
            <span className="truncate font-medium text-white/90">
              {session.name}
            </span>
            {session.status === "needs_attention" && (
              <StatusBadge showDot={false} size="sm" status={session.status} />
            )}
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-2 text-white/40 text-xs">
            <span className="truncate">{session.project}</span>
            <span className="text-white/20">•</span>
            <Clock className="h-3 w-3" />
            <span>{formatTime(session.updatedAt)}</span>
          </div>

          {/* Cost (if available) */}
          {session.cost !== undefined && (
            <div className="mt-1.5 flex items-center gap-2 text-xs">
              <span className="text-white/30">{session.model}</span>
              <span className="text-emerald-400/70">
                ${session.cost.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Actions on hover */}
        <AnimatePresence>
          {showActions && (onKill || onArchive) && (
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1"
              exit={{ opacity: 0, scale: 0.9 }}
              initial={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              transition={{ duration: 0.1 }}
            >
              {onArchive && (
                <button
                  aria-label={`Archive session ${session.name}`}
                  className="rounded-md p-2 text-white/40 hover:bg-white/10 hover:text-white/70"
                  onClick={onArchive}
                  title="Archive session"
                >
                  <Archive aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
              )}
              {onKill && (
                <button
                  aria-label={`Kill session ${session.name}`}
                  className="rounded-md p-2 text-white/40 hover:bg-red-500/20 hover:text-red-400"
                  onClick={onKill}
                  title="Kill session"
                >
                  <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Date Group Component
// ═══════════════════════════════════════════════════════════════════════════

interface DateGroupProps {
  group: DateGroup;
  onArchive?: (session: SessionListItem) => void;
  onKill?: (session: SessionListItem) => void;
  onSelect?: (session: SessionListItem) => void;
  selectedId?: string | null;
}

function DateGroupSection({
  group,
  selectedId,
  onSelect,
  onKill,
  onArchive,
}: DateGroupProps) {
  return (
    <div className="mb-2">
      {/* Date header */}
      <div className="date-group-header sticky top-0 z-10">{group.label}</div>

      {/* Sessions */}
      <motion.div
        animate="animate"
        className="space-y-1 px-2"
        initial="initial"
        variants={stagger.fast}
      >
        {group.sessions.map((session) => (
          <SessionCard
            key={session.id}
            onArchive={onArchive ? () => onArchive(session) : undefined}
            onClick={() => onSelect?.(session)}
            onKill={onKill ? () => onKill(session) : undefined}
            selected={selectedId === session.id}
            session={session}
          />
        ))}
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SessionListPanel Component
// ═══════════════════════════════════════════════════════════════════════════

export function SessionListPanel({
  sessions = [],
  selectedSessionId,
  onSelectSession,
  onNewSession,
  onKillSession,
  onArchiveSession,
}: SessionListPanelProps) {
  const [search, setSearch] = useState("");

  // Filter sessions by search
  const filteredSessions = useMemo(() => {
    if (!search.trim()) {
      return sessions;
    }
    const query = search.toLowerCase();
    return sessions.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.project.toLowerCase().includes(query)
    );
  }, [search, sessions]);

  // Group by date
  const groupedSessions = useMemo(
    () => groupSessionsByDate(filteredSessions),
    [filteredSessions]
  );

  return (
    <div className="panel flex h-full w-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-white/5 border-b p-4">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm text-white/90">Sessions</h2>
          <span className="rounded bg-white/10 px-1.5 py-0.5 font-medium text-white/50 text-xs">
            {sessions.length}
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="border-white/5 border-b p-3">
        <SearchInput
          onChange={setSearch}
          placeholder="Search sessions..."
          value={search}
        />
      </div>

      {/* Sessions List */}
      <div className="scrollbar-hide flex-1 overflow-y-auto py-2">
        {groupedSessions.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-white/30">
            <Search className="mb-2 h-8 w-8" />
            <p className="text-sm">
              {sessions.length === 0 ? "No sessions yet" : "No sessions found"}
            </p>
          </div>
        ) : (
          groupedSessions.map((group) => (
            <DateGroupSection
              group={group}
              key={group.label}
              onArchive={onArchiveSession}
              onKill={onKillSession}
              onSelect={onSelectSession}
              selectedId={selectedSessionId}
            />
          ))
        )}
      </div>

      {/* New Session Button */}
      {onNewSession && (
        <div className="border-white/5 border-t p-3">
          <button
            className={cn(
              "flex w-full items-center justify-center gap-2",
              "rounded-lg px-4 py-2.5 font-medium text-sm",
              "bg-primary text-white",
              "hover:bg-primary/90 active:scale-[0.98]",
              "transition-all duration-150",
              "shadow-lg shadow-primary/20"
            )}
            onClick={onNewSession}
          >
            <Plus className="h-4 w-4" />
            New Session
          </button>
        </div>
      )}
    </div>
  );
}
