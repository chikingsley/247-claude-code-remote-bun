'use client';

import { cn } from '@/lib/utils';
import { FolderOpen, GitBranch } from 'lucide-react';

export type TabType = 'existing' | 'clone';

interface TabSelectorProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function TabSelector({ activeTab, onTabChange }: TabSelectorProps) {
  const tabs = [
    { id: 'existing' as const, label: 'Existing', icon: FolderOpen },
    { id: 'clone' as const, label: 'Clone', icon: GitBranch },
  ];

  return (
    <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium',
              'transition-all',
              isActive
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:bg-white/5 hover:text-white/70'
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
