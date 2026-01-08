'use client';

import { Keyboard, KeyboardOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KeybarToggleButtonProps {
  isVisible: boolean;
  onToggle: () => void;
}

/**
 * Floating button to toggle mobile keybar visibility.
 * Positioned at bottom-right of terminal, above the keybar when visible.
 */
export function KeybarToggleButton({ isVisible, onToggle }: KeybarToggleButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'absolute z-30',
        'flex items-center justify-center',
        'h-11 w-11 rounded-full',
        'bg-white/10 backdrop-blur-sm',
        'border border-white/10',
        'text-white/60 hover:bg-white/15 hover:text-white',
        'touch-manipulation transition-all duration-200',
        'active:scale-95',
        // Position: bottom-right, moves up when keybar is visible
        isVisible ? 'bottom-[116px] right-3' : 'bottom-4 right-3'
      )}
      aria-label={isVisible ? 'Hide keyboard' : 'Show keyboard'}
    >
      {isVisible ? <KeyboardOff className="h-5 w-5" /> : <Keyboard className="h-5 w-5" />}
    </button>
  );
}
