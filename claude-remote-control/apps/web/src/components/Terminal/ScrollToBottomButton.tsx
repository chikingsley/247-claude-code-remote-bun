"use client";

import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScrollToBottomButtonProps {
  onClick: () => void;
  visible: boolean;
}

export function ScrollToBottomButton({
  visible,
  onClick,
}: ScrollToBottomButtonProps) {
  if (!visible) {
    return null;
  }

  return (
    <button
      aria-label="Scroll to bottom"
      className={cn(
        "absolute right-6 bottom-6 p-3",
        "bg-orange-500/90 backdrop-blur-sm hover:bg-orange-400",
        "rounded-full text-white shadow-orange-500/30 shadow-xl",
        "transition-all hover:scale-105 active:scale-95",
        "animate-bounce",
        "focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d14]"
      )}
      onClick={onClick}
    >
      <ArrowDown className="h-5 w-5" />
    </button>
  );
}
