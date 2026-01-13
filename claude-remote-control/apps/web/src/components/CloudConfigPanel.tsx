'use client';

import { Cloud, Rocket, Unplug, CheckCircle2, Loader2, Github } from 'lucide-react';
import { DeployedAgentsList } from './DeployedAgentsList';
import type { FlyioStatus } from '@/hooks/useFlyioStatus';
import type { CloudAgent } from '@/hooks/useAgents';

interface CloudConfigPanelProps {
  isAuthenticated: boolean;
  flyioStatus: FlyioStatus | null;
  flyioLoading?: boolean;
  agents: CloudAgent[];
  agentsLoading?: boolean;
  onSignIn?: () => void;
  onFlyioDisconnect: () => void;
  onLaunchAgent: () => void;
  onConnectAgent: (agent: CloudAgent) => void;
  onStartAgent: (id: string) => Promise<boolean>;
  onStopAgent: (id: string) => Promise<boolean>;
  onDeleteAgent: (id: string) => Promise<boolean>;
  onReconnectFlyio: () => void;
}

export function CloudConfigPanel({
  isAuthenticated,
  flyioStatus,
  flyioLoading,
  agents,
  agentsLoading,
  onSignIn,
  onFlyioDisconnect,
  onLaunchAgent,
  onConnectAgent,
  onStartAgent,
  onStopAgent,
  onDeleteAgent,
  onReconnectFlyio,
}: CloudConfigPanelProps) {
  const isConnected = flyioStatus?.connected === true;

  // Not authenticated - show sign in prompt
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col gap-5">
        {/* Sign In Card */}
        <div className="relative overflow-hidden rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-violet-500/10 p-5">
          {/* Background glow */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl" />

          <div className="relative text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/20">
              <Cloud className="h-7 w-7 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Cloud Agents</h3>
            <p className="mt-2 text-sm text-white/50">
              Deploy and manage Claude Code agents in the cloud with Fly.io
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs text-purple-300">
                ~$5/month
              </span>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/50">
                Scale to zero
              </span>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/50">
                Your infrastructure
              </span>
            </div>

            {onSignIn && (
              <button
                onClick={onSignIn}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-black shadow-lg transition-all hover:bg-white/90"
              >
                <Github className="h-4 w-4" />
                Sign in with GitHub
              </button>
            )}
          </div>
        </div>

        {/* Info footer */}
        <div className="rounded-lg bg-white/[0.02] px-3 py-2.5">
          <p className="text-[10px] leading-relaxed text-white/30">
            Sign in to deploy cloud agents on your own Fly.io infrastructure. You pay Fly.io
            directly and maintain full control of your data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Fly.io Connection Status Card */}
      <div
        className={`relative overflow-hidden rounded-xl border p-4 ${
          isConnected
            ? 'border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-violet-500/5'
            : 'border-white/10 bg-white/5'
        }`}
      >
        {/* Subtle glow effect for connected state */}
        {isConnected && (
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-purple-500/10 blur-2xl" />
        )}

        <div className="relative flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              isConnected ? 'bg-purple-500/20' : 'bg-white/10'
            }`}
          >
            {flyioLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
            ) : isConnected ? (
              <CheckCircle2 className="h-5 w-5 text-purple-400" />
            ) : (
              <Cloud className="h-5 w-5 text-white/40" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Fly.io</h3>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  isConnected ? 'bg-purple-500/20 text-purple-300' : 'bg-white/10 text-white/40'
                }`}
              >
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {isConnected && flyioStatus?.orgName && (
              <p className="mt-1 truncate font-mono text-xs text-white/50">{flyioStatus.orgName}</p>
            )}

            {!isConnected && (
              <p className="mt-1 text-xs text-white/40">
                Connect your Fly.io account to deploy cloud agents
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex gap-2">
          {isConnected ? (
            <>
              <button
                onClick={onLaunchAgent}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-violet-500 px-3 py-2 text-xs font-medium text-white shadow-lg shadow-purple-500/20 transition-all hover:shadow-purple-500/30"
              >
                <Rocket className="h-3.5 w-3.5" />
                Launch New Agent
              </button>
              <button
                onClick={onFlyioDisconnect}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs text-white/50 transition-colors hover:bg-white/10 hover:text-white/70"
                title="Disconnect Fly.io"
              >
                <Unplug className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <button
              onClick={onReconnectFlyio}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-purple-500/20 px-3 py-2 text-xs font-medium text-purple-300 transition-colors hover:bg-purple-500/30"
            >
              <Cloud className="h-3.5 w-3.5" />
              Connect Fly.io
            </button>
          )}
        </div>
      </div>

      {/* Deployed Agents Section */}
      {isConnected && (
        <>
          {agentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-white/30" />
            </div>
          ) : agents.length > 0 ? (
            /* DeployedAgentsList has its own container styling */
            <DeployedAgentsList
              agents={agents}
              isLoading={agentsLoading}
              onConnect={onConnectAgent}
              onStart={onStartAgent}
              onStop={onStopAgent}
              onDelete={onDeleteAgent}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
                <Rocket className="h-5 w-5 text-purple-400/50" />
              </div>
              <p className="text-sm text-white/40">No cloud agents deployed</p>
              <p className="mt-1 text-xs text-white/25">Launch your first agent to get started</p>
            </div>
          )}
        </>
      )}

      {/* Info footer */}
      <div className="rounded-lg bg-white/[0.02] px-3 py-2.5">
        <p className="text-[10px] leading-relaxed text-white/30">
          Cloud agents run on your Fly.io infrastructure. You pay Fly.io directly (~$5/month per
          agent) and maintain full control of your data.
        </p>
      </div>
    </div>
  );
}
