'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ToggleSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  warningIcon?: React.ReactNode;
  warningText?: string;
  disabled?: boolean;
  accentColor?: 'purple' | 'amber' | 'green' | 'blue';
  className?: string;
}

const accentColors = {
  purple: {
    bg: 'bg-purple-500',
    border: 'border-purple-500/30',
    shadow: 'shadow-purple-500/20',
    ring: 'focus-within:ring-purple-500/30',
  },
  amber: {
    bg: 'bg-amber-500',
    border: 'border-amber-500/30',
    shadow: 'shadow-amber-500/20',
    ring: 'focus-within:ring-amber-500/30',
  },
  green: {
    bg: 'bg-green-500',
    border: 'border-green-500/30',
    shadow: 'shadow-green-500/20',
    ring: 'focus-within:ring-green-500/30',
  },
  blue: {
    bg: 'bg-blue-500',
    border: 'border-blue-500/30',
    shadow: 'shadow-blue-500/20',
    ring: 'focus-within:ring-blue-500/30',
  },
};

export function ToggleSwitch({
  checked,
  onCheckedChange,
  label,
  description,
  icon,
  warningIcon,
  warningText,
  disabled = false,
  accentColor = 'purple',
  className,
}: ToggleSwitchProps) {
  const colors = accentColors[accentColor];

  return (
    <div
      className={cn(
        'group relative rounded-xl border bg-white/5 px-4 py-3 transition-all duration-200',
        checked ? colors.border : 'border-white/10',
        checked && `shadow-lg ${colors.shadow}`,
        disabled && 'cursor-not-allowed opacity-50',
        'hover:bg-white/[0.07]',
        'focus-within:ring-2',
        colors.ring,
        className
      )}
    >
      <label className="flex cursor-pointer items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {icon && (
            <div className={cn('text-white/60 transition-colors', checked && 'text-white')}>
              {icon}
            </div>
          )}
          <div className="flex-1">
            <span className="block text-sm font-medium text-white">{label}</span>
            {description && <span className="text-xs text-white/40">{description}</span>}
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onCheckedChange(!checked)}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full',
            'transition-all duration-200 ease-in-out',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
            checked ? colors.bg : 'bg-white/20',
            disabled && 'cursor-not-allowed'
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg',
              'transition-transform duration-200 ease-in-out',
              checked ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
      </label>

      {/* Warning message when enabled */}
      {warningText && checked && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2">
          {warningIcon && <div className="text-amber-400">{warningIcon}</div>}
          <span className="text-xs text-amber-300">{warningText}</span>
        </div>
      )}
    </div>
  );
}
