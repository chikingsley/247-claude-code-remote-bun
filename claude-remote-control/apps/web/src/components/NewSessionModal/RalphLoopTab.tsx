'use client';

import { Play, Shield, GitBranch, AlertTriangle, Sparkles, Hash, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EnvironmentSelector } from '../EnvironmentSelector';
import { ProjectDropdown } from './ProjectDropdown';
import { ToggleSwitch } from '../ui/toggle-switch';

interface RalphLoopTabProps {
  folders: string[];
  selectedProject: string;
  onSelectProject: (project: string) => void;
  loadingFolders: boolean;
  ralphPrompt: string;
  onRalphPromptChange: (prompt: string) => void;
  ralphMaxIterations: number;
  onRalphMaxIterationsChange: (iterations: number) => void;
  ralphCompletionPromise: string;
  onRalphCompletionPromiseChange: (promise: string) => void;
  ralphUseWorktree: boolean;
  onRalphUseWorktreeChange: (use: boolean) => void;
  ralphTrustMode: boolean;
  onRalphTrustModeChange: (trust: boolean) => void;
  agentUrl: string;
  selectedEnvironment: string | null;
  onSelectEnvironment: (id: string | null) => void;
  onManageEnvironments: () => void;
  envRefreshKey: number;
  onStartRalphLoop: () => void;
  isValid: boolean;
}

export function RalphLoopTab({
  folders,
  selectedProject,
  onSelectProject,
  loadingFolders,
  ralphPrompt,
  onRalphPromptChange,
  ralphMaxIterations,
  onRalphMaxIterationsChange,
  ralphCompletionPromise,
  onRalphCompletionPromiseChange,
  ralphUseWorktree,
  onRalphUseWorktreeChange,
  ralphTrustMode,
  onRalphTrustModeChange,
  agentUrl,
  selectedEnvironment,
  onSelectEnvironment,
  onManageEnvironments,
  envRefreshKey,
  onStartRalphLoop,
  isValid,
}: RalphLoopTabProps) {
  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-violet-500/5 to-transparent px-4 py-3">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-purple-500/10 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
            <Sparkles className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Ralph Loop</h3>
            <p className="text-xs text-white/50">Iterative AI loop that refines until completion</p>
          </div>
        </div>
      </div>

      {/* Project Selection */}
      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-wider text-white/40">
          Project
        </label>
        <ProjectDropdown
          folders={folders}
          selectedProject={selectedProject}
          onSelectProject={onSelectProject}
          loading={loadingFolders}
          accentColor="purple"
        />
      </div>

      {/* Prompt Input */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40">
          Task Prompt
          <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">
            Required
          </span>
        </label>
        <div className="group relative">
          <textarea
            value={ralphPrompt}
            onChange={(e) => onRalphPromptChange(e.target.value)}
            placeholder="Implement feature X with tests. Output <promise>COMPLETE</promise> when done."
            rows={4}
            className={cn(
              'w-full rounded-xl px-4 py-3',
              'border border-white/10 bg-white/5',
              'text-white placeholder:text-white/25',
              'focus:border-purple-500/50 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-purple-500/20',
              'resize-none transition-all duration-200'
            )}
          />
          {ralphPrompt.length > 0 && (
            <div className="absolute bottom-3 right-3 text-xs text-white/30">
              {ralphPrompt.length} chars
            </div>
          )}
        </div>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Max Iterations */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40">
            <Hash className="h-3 w-3" />
            Max Iterations
          </label>
          <div className="relative">
            <input
              type="number"
              value={ralphMaxIterations}
              onChange={(e) => onRalphMaxIterationsChange(parseInt(e.target.value) || 0)}
              min={1}
              max={100}
              className={cn(
                'w-full rounded-xl px-4 py-3',
                'border border-white/10 bg-white/5',
                'text-white placeholder:text-white/30',
                'focus:border-purple-500/50 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-purple-500/20',
                'transition-all duration-200',
                '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
              )}
            />
          </div>
          <p className="text-[10px] text-white/30">Safety limit for iterations</p>
        </div>

        {/* Completion Promise */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40">
            <Check className="h-3 w-3" />
            Completion Signal
          </label>
          <input
            type="text"
            value={ralphCompletionPromise}
            onChange={(e) => onRalphCompletionPromiseChange(e.target.value)}
            placeholder="COMPLETE"
            className={cn(
              'w-full rounded-xl px-4 py-3',
              'border border-white/10 bg-white/5',
              'text-white placeholder:text-white/30',
              'focus:border-purple-500/50 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-purple-500/20',
              'transition-all duration-200'
            )}
          />
          <p className="text-[10px] text-white/30">Text that signals task completion</p>
        </div>
      </div>

      {/* Toggle Options */}
      <div className="space-y-3">
        {/* Trust Mode Toggle */}
        <ToggleSwitch
          checked={ralphTrustMode}
          onCheckedChange={onRalphTrustModeChange}
          label="Trust Mode"
          description="Auto-accept all Claude tool permissions"
          icon={<Shield className="h-4 w-4" />}
          accentColor="amber"
          warningIcon={<AlertTriangle className="h-3 w-3" />}
          warningText="Full autonomy - Claude will execute all actions without confirmation"
        />

        {/* Git Worktree Toggle */}
        <ToggleSwitch
          checked={ralphUseWorktree}
          onCheckedChange={onRalphUseWorktreeChange}
          label="Use Git Worktree"
          description="Create an isolated branch for parallel loops"
          icon={<GitBranch className="h-4 w-4" />}
          accentColor="purple"
        />
      </div>

      {/* Environment Selection */}
      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-wider text-white/40">
          Environment
        </label>
        <EnvironmentSelector
          key={`ralph-${envRefreshKey}`}
          agentUrl={agentUrl}
          selectedId={selectedEnvironment}
          onSelect={onSelectEnvironment}
          onManageClick={onManageEnvironments}
        />
      </div>

      {/* Start Button */}
      <button
        onClick={onStartRalphLoop}
        disabled={!selectedProject || !isValid}
        className={cn(
          'group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-5 py-3.5 font-medium transition-all duration-300',
          selectedProject && isValid
            ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30'
            : 'cursor-not-allowed bg-white/5 text-white/30'
        )}
      >
        {/* Animated background */}
        {selectedProject && isValid && (
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-violet-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        )}

        <span className="relative flex items-center gap-2">
          <Play
            className={cn(
              'h-4 w-4',
              selectedProject && isValid && 'transition-transform group-hover:scale-110'
            )}
          />
          Start Ralph Loop
        </span>
      </button>
    </div>
  );
}
