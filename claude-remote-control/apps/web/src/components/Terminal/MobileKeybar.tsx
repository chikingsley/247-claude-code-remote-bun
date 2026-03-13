"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CornerDownLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ANSI escape sequences for arrow keys
const KEYS = {
  UP: "\x1b[A",
  DOWN: "\x1b[B",
  LEFT: "\x1b[D",
  RIGHT: "\x1b[C",
  ENTER: "\r",
  ESC: "\x1b",
  SHIFT_TAB: "\x1b[Z",
  CTRL_C: "\x03",
} as const;

interface MobileKeybarProps {
  onKeyPress: (key: string) => void;
  /** Controls visibility with slide animation */
  visible?: boolean;
}

interface KeyButtonProps {
  children: React.ReactNode;
  className?: string;
  label?: string;
  onClick: () => void;
}

function KeyButton({ onClick, children, label, className }: KeyButtonProps) {
  return (
    <button
      aria-label={label}
      className={cn(
        "flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center",
        "rounded-lg bg-white/5 text-white/70 transition-all",
        "active:scale-95 active:bg-white/10 active:text-white",
        "hover:bg-white/8",
        "focus-visible:ring-2 focus-visible:ring-orange-500/50 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0d0d14]",
        className
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function MobileKeybar({
  onKeyPress,
  visible = true,
}: MobileKeybarProps) {
  // When hidden, completely remove from layout (h-0 + overflow-hidden)
  // This allows the terminal to expand and fill the space
  if (!visible) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 border-white/5 border-t bg-[#0d0d14]/95 px-2 py-2 backdrop-blur-sm"
      )}
    >
      {/* Row 1: Arrow Navigation */}
      <div className="flex items-center justify-end gap-1">
        <KeyButton label="Left Arrow" onClick={() => onKeyPress(KEYS.LEFT)}>
          <ChevronLeft className="h-5 w-5" />
        </KeyButton>
        <KeyButton label="Up Arrow" onClick={() => onKeyPress(KEYS.UP)}>
          <ChevronUp className="h-5 w-5" />
        </KeyButton>
        <KeyButton label="Down Arrow" onClick={() => onKeyPress(KEYS.DOWN)}>
          <ChevronDown className="h-5 w-5" />
        </KeyButton>
        <KeyButton label="Right Arrow" onClick={() => onKeyPress(KEYS.RIGHT)}>
          <ChevronRight className="h-5 w-5" />
        </KeyButton>
      </div>

      {/* Row 2: Action keys */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex gap-1">
          <KeyButton
            className="px-3"
            label="Escape"
            onClick={() => onKeyPress(KEYS.ESC)}
          >
            <span className="font-medium text-xs">Esc</span>
          </KeyButton>
          <KeyButton
            className="px-2"
            label="Shift+Tab"
            onClick={() => onKeyPress(KEYS.SHIFT_TAB)}
          >
            <span className="font-medium text-xs">⇧Tab</span>
          </KeyButton>
        </div>

        <div className="flex gap-1">
          <KeyButton
            className="bg-orange-500/20 px-4 text-orange-400 hover:bg-orange-500/30 active:bg-orange-500/40"
            label="Enter"
            onClick={() => onKeyPress(KEYS.ENTER)}
          >
            <CornerDownLeft className="h-5 w-5" />
          </KeyButton>
          <KeyButton
            className="px-3 text-red-400/70 hover:text-red-400 active:text-red-300"
            label="Ctrl+C (Interrupt)"
            onClick={() => onKeyPress(KEYS.CTRL_C)}
          >
            <span className="font-medium text-xs">^C</span>
          </KeyButton>
        </div>
      </div>
    </div>
  );
}
