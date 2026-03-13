"use client";

import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onClose: () => void;
  onFindNext: () => void;
  onFindPrevious: () => void;
  onQueryChange: (query: string) => void;
  query: string;
  visible: boolean;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  (
    { visible, query, onQueryChange, onFindNext, onFindPrevious, onClose },
    ref
  ) => {
    if (!visible) {
      return null;
    }

    return (
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-2",
          "bg-[#0d0d14]/90 backdrop-blur-sm",
          "border-white/5 border-b"
        )}
      >
        <Search className="h-4 w-4 text-white/30" />
        <input
          aria-label="Search in terminal"
          className={cn(
            "flex-1 bg-transparent text-sm text-white placeholder:text-white/30",
            "focus:outline-none focus-visible:ring-1 focus-visible:ring-orange-500/50"
          )}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search in terminal..."
          ref={ref}
          type="text"
          value={query}
        />
        <div className="flex items-center gap-1">
          <button
            aria-label="Find previous"
            className="rounded p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-1 focus-visible:ring-orange-500/50"
            onClick={onFindPrevious}
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            aria-label="Find next"
            className="rounded p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-1 focus-visible:ring-orange-500/50"
            onClick={onFindNext}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            aria-label="Close search"
            className="rounded p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-1 focus-visible:ring-orange-500/50"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }
);

SearchBar.displayName = "SearchBar";
