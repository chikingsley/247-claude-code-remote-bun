"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronRight,
  Maximize2,
  Menu,
  Minimize2,
  Plus,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { spring } from "@/lib/animations";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface AppHeaderProps {
  currentMachineName?: string;
  currentProjectName?: string;
  isFullscreen?: boolean;
  isMobile?: boolean;
  onMenuClick?: () => void;
  onNewSession?: () => void;
  onOpenNotificationSettings?: () => void;
  onSidebarToggle?: () => void;
  onToggleFullscreen?: () => void;
  sidebarCollapsed?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// User Menu Component (simplified - no auth)
// ═══════════════════════════════════════════════════════════════════════════

interface UserMenuProps {
  onOpenNotificationSettings?: () => void;
}

function UserMenu({ onOpenNotificationSettings }: UserMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Settings menu"
        className={cn(
          "h-8 w-8 rounded-full",
          "bg-gradient-to-br from-orange-500 to-amber-500",
          "flex items-center justify-center",
          "font-bold text-white text-xs",
          "hover:ring-2 hover:ring-primary/30 hover:ring-offset-2 hover:ring-offset-background",
          "transition-all duration-150"
        )}
        onClick={() => setOpen(!open)}
      >
        <Settings className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div
              aria-label="Close menu"
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
              onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
              role="button"
              tabIndex={-1}
            />

            {/* Dropdown */}
            <motion.div
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "absolute top-full right-0 z-50 mt-2",
                "w-56 rounded-xl p-1",
                "border border-white/10 bg-surface-2",
                "shadow-modal"
              )}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={spring.snappy}
            >
              {/* Menu items */}
              <button
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white/90"
                onClick={() => {
                  setOpen(false);
                  onOpenNotificationSettings?.();
                }}
              >
                <Bell className="h-4 w-4" />
                Notifications
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Icon Button Component
// ═══════════════════════════════════════════════════════════════════════════

interface IconButtonProps {
  badge?: number;
  className?: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

function IconButton({
  icon,
  label,
  onClick,
  badge,
  className,
}: IconButtonProps) {
  return (
    <button
      aria-label={badge ? `${label} (${badge > 9 ? "9+" : badge} new)` : label}
      className={cn(
        "relative rounded-lg p-2",
        "text-white/50 hover:bg-white/5 hover:text-white/80",
        "transition-all duration-150",
        className
      )}
      onClick={onClick}
      title={label}
    >
      <span aria-hidden="true">{icon}</span>
      {badge !== undefined && badge > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary font-bold text-[10px] text-white"
        >
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// AppHeader Component
// ═══════════════════════════════════════════════════════════════════════════

export function AppHeader({
  onSidebarToggle: _onSidebarToggle,
  sidebarCollapsed,
  isMobile,
  onMenuClick,
  currentMachineName,
  currentProjectName,
  onNewSession,
  onToggleFullscreen,
  isFullscreen,
  onOpenNotificationSettings,
}: AppHeaderProps) {
  return (
    <header
      aria-label="Application header"
      className={cn(
        "flex h-14 items-center justify-between px-4",
        "border-white/5 border-b",
        "glass-dark",
        "z-40"
      )}
      role="banner"
    >
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        {isMobile && (
          <button
            aria-label="Open navigation menu"
            className="rounded-lg p-2 text-white/70 hover:bg-white/5"
            onClick={onMenuClick}
          >
            <Menu aria-hidden="true" className="h-5 w-5" />
          </button>
        )}

        {/* Logo (only on mobile or when sidebar collapsed or in fullscreen) */}
        {(isMobile || sidebarCollapsed || isFullscreen) && (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500">
              <span className="font-bold text-white text-xs">24</span>
            </div>
            {(isMobile || isFullscreen) && (
              <span className="font-semibold text-white/90">247</span>
            )}
          </div>
        )}
      </div>

      {/* Center - Breadcrumb (desktop only) */}
      {!isMobile && (currentMachineName || currentProjectName) && (
        <div className="flex items-center gap-2 text-sm">
          {currentMachineName && (
            <span className="text-white/50">{currentMachineName}</span>
          )}
          {currentMachineName && currentProjectName && (
            <ChevronRight className="h-4 w-4 text-white/20" />
          )}
          {currentProjectName && (
            <span className="font-medium text-white/70">
              {currentProjectName}
            </span>
          )}
        </div>
      )}

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {!isMobile && (
          <>
            <IconButton
              badge={2}
              icon={<Bell className="h-5 w-5" />}
              label="Notifications"
              onClick={onOpenNotificationSettings}
            />
            {onToggleFullscreen && (
              <IconButton
                icon={
                  isFullscreen ? (
                    <Minimize2 className="h-5 w-5" />
                  ) : (
                    <Maximize2 className="h-5 w-5" />
                  )
                }
                label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                onClick={onToggleFullscreen}
              />
            )}
          </>
        )}

        {/* New Session Button */}
        <button
          className={cn(
            "flex items-center gap-2",
            "rounded-lg px-3 py-1.5",
            "bg-primary font-medium text-sm text-white",
            "hover:bg-primary/90 active:scale-[0.98]",
            "transition-all duration-150",
            "shadow-lg shadow-primary/20"
          )}
          onClick={onNewSession}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Session</span>
        </button>

        {/* User Menu */}
        <UserMenu onOpenNotificationSettings={onOpenNotificationSettings} />
      </div>
    </header>
  );
}
