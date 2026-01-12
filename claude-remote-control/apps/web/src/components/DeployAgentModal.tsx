'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Rocket,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Server,
  HardDrive,
  Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeployAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (agent: DeployedAgent) => void;
}

export interface DeployedAgent {
  id: string;
  hostname: string;
  flyAppName: string;
  region: string;
  status: string;
}

const PROVISIONING_URL = process.env.NEXT_PUBLIC_PROVISIONING_URL;

type DeployStatus =
  | 'idle'
  | 'pending'
  | 'creating_app'
  | 'creating_volume'
  | 'creating_machine'
  | 'success'
  | 'error';

const statusMessages: Record<DeployStatus, string> = {
  idle: 'Ready to deploy',
  pending: 'Initializing...',
  creating_app: 'Creating Fly.io app...',
  creating_volume: 'Creating storage volume...',
  creating_machine: 'Launching machine...',
  success: 'Deployed successfully!',
  error: 'Deployment failed',
};

const REGIONS = [
  { value: 'sjc', label: 'San Jose, CA', flag: '🇺🇸' },
  { value: 'lax', label: 'Los Angeles, CA', flag: '🇺🇸' },
  { value: 'sea', label: 'Seattle, WA', flag: '🇺🇸' },
  { value: 'ord', label: 'Chicago, IL', flag: '🇺🇸' },
  { value: 'iad', label: 'Ashburn, VA', flag: '🇺🇸' },
  { value: 'cdg', label: 'Paris, France', flag: '🇫🇷' },
  { value: 'lhr', label: 'London, UK', flag: '🇬🇧' },
  { value: 'fra', label: 'Frankfurt, Germany', flag: '🇩🇪' },
  { value: 'nrt', label: 'Tokyo, Japan', flag: '🇯🇵' },
  { value: 'sin', label: 'Singapore', flag: '🇸🇬' },
  { value: 'syd', label: 'Sydney, Australia', flag: '🇦🇺' },
];

export function DeployAgentModal({ open, onOpenChange, onSuccess }: DeployAgentModalProps) {
  const [region, setRegion] = useState('sjc');
  const [status, setStatus] = useState<DeployStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [deployedAgent, setDeployedAgent] = useState<DeployedAgent | null>(null);
  const [pollInterval, setPollInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  const handleDeploy = async () => {
    if (!PROVISIONING_URL) return;

    setStatus('pending');
    setErrorMessage('');

    try {
      const response = await fetch(`${PROVISIONING_URL}/api/agents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ region }),
      });

      // Start polling for status updates
      let agentId: string | null = null;

      // Check for immediate success or start polling
      if (response.ok) {
        const agent = await response.json();
        agentId = agent.id;

        // Poll for status updates
        const interval = setInterval(async () => {
          try {
            const statusResponse = await fetch(`${PROVISIONING_URL}/api/agents/${agentId}`, {
              credentials: 'include',
            });

            if (statusResponse.ok) {
              const agentData = await statusResponse.json();

              // Update status based on agent status
              if (agentData.status === 'running') {
                clearInterval(interval);
                setPollInterval(null);
                setStatus('success');
                setDeployedAgent(agentData);
              } else if (agentData.status === 'error') {
                clearInterval(interval);
                setPollInterval(null);
                setStatus('error');
                setErrorMessage(agentData.errorMessage || 'Deployment failed');
              } else if (agentData.status === 'creating_app') {
                setStatus('creating_app');
              } else if (agentData.status === 'creating_volume') {
                setStatus('creating_volume');
              } else if (agentData.status === 'creating_machine') {
                setStatus('creating_machine');
              }
            }
          } catch {
            // Ignore polling errors
          }
        }, 2000);

        setPollInterval(interval);

        // Timeout after 3 minutes
        setTimeout(() => {
          if (interval) {
            clearInterval(interval);
            setPollInterval(null);
            if (status !== 'success' && status !== 'error') {
              setStatus('error');
              setErrorMessage('Deployment timed out');
            }
          }
        }, 180000);
      } else {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to start deployment');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Deployment failed');
    }
  };

  const handleClose = () => {
    if (status !== 'idle' && status !== 'success' && status !== 'error') {
      // Don't close during deployment
      return;
    }

    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }

    setRegion('sjc');
    setStatus('idle');
    setErrorMessage('');
    setDeployedAgent(null);
    onOpenChange(false);
  };

  const handleConnect = () => {
    if (deployedAgent) {
      onSuccess?.(deployedAgent);
      handleClose();
    }
  };

  const isDeploying = status !== 'idle' && status !== 'success' && status !== 'error';

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 px-4"
          >
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a10] shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
                    <Rocket className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-white">Launch Cloud Agent</h2>
                    <p className="text-xs text-white/50">Deploy to your Fly.io account</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isDeploying}
                  className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-5 px-6 py-5">
                {status === 'idle' ? (
                  <>
                    {/* Specs */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl bg-white/5 p-3 text-center">
                        <Cpu className="mx-auto mb-1 h-5 w-5 text-green-400" />
                        <p className="text-xs text-white/60">1 vCPU</p>
                      </div>
                      <div className="rounded-xl bg-white/5 p-3 text-center">
                        <Server className="mx-auto mb-1 h-5 w-5 text-green-400" />
                        <p className="text-xs text-white/60">1GB RAM</p>
                      </div>
                      <div className="rounded-xl bg-white/5 p-3 text-center">
                        <HardDrive className="mx-auto mb-1 h-5 w-5 text-green-400" />
                        <p className="text-xs text-white/60">1GB Storage</p>
                      </div>
                    </div>

                    {/* Region Selector */}
                    <div>
                      <label className="mb-2 block text-sm text-white/60">Select Region</label>
                      <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-green-500/50 focus:outline-none focus:ring-1 focus:ring-green-500/20"
                      >
                        {REGIONS.map((r) => (
                          <option key={r.value} value={r.value} className="bg-[#0a0a10]">
                            {r.flag} {r.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Cost Info */}
                    <div className="rounded-xl bg-green-500/10 p-4">
                      <p className="text-sm text-green-200">
                        <span className="font-medium">~$5/month</span> with scale-to-zero. You only
                        pay when the agent is running.
                      </p>
                    </div>
                  </>
                ) : (
                  /* Deployment Progress */
                  <div className="py-4">
                    <div className="flex flex-col items-center gap-4">
                      {status === 'success' ? (
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                          <CheckCircle2 className="h-8 w-8 text-green-400" />
                        </div>
                      ) : status === 'error' ? (
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                          <AlertCircle className="h-8 w-8 text-red-400" />
                        </div>
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                          <Loader2 className="h-8 w-8 animate-spin text-green-400" />
                        </div>
                      )}

                      <div className="text-center">
                        <p
                          className={cn(
                            'text-lg font-medium',
                            status === 'error' ? 'text-red-400' : 'text-white'
                          )}
                        >
                          {statusMessages[status]}
                        </p>
                        {status === 'error' && errorMessage && (
                          <p className="mt-1 text-sm text-red-400/80">{errorMessage}</p>
                        )}
                        {status === 'success' && deployedAgent && (
                          <p className="mt-1 text-sm text-white/60">
                            Available at{' '}
                            <span className="font-mono text-green-400">
                              {deployedAgent.hostname}
                            </span>
                          </p>
                        )}
                      </div>

                      {/* Progress Steps */}
                      {isDeploying && (
                        <div className="mt-4 w-full space-y-2">
                          <ProgressStep
                            label="Create app"
                            done={['creating_volume', 'creating_machine'].includes(status)}
                            active={status === 'creating_app'}
                          />
                          <ProgressStep
                            label="Create volume"
                            done={status === 'creating_machine'}
                            active={status === 'creating_volume'}
                          />
                          <ProgressStep
                            label="Launch machine"
                            done={false}
                            active={status === 'creating_machine'}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                {status === 'idle' && (
                  <button
                    onClick={handleDeploy}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-green-500/25 transition-all hover:shadow-green-500/40"
                  >
                    <Rocket className="h-4 w-4" />
                    Deploy Agent
                  </button>
                )}

                {status === 'success' && (
                  <button
                    onClick={handleConnect}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-green-500/25 transition-all hover:shadow-green-500/40"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Connect Now
                  </button>
                )}

                {status === 'error' && (
                  <button
                    onClick={() => setStatus('idle')}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ProgressStep({ label, done, active }: { label: string; done: boolean; active: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
          done
            ? 'bg-green-500/20 text-green-400'
            : active
              ? 'bg-green-500/20'
              : 'bg-white/5 text-white/40'
        )}
      >
        {done ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : active ? (
          <Loader2 className="h-4 w-4 animate-spin text-green-400" />
        ) : (
          <div className="h-2 w-2 rounded-full bg-current" />
        )}
      </div>
      <span
        className={cn('text-sm', done ? 'text-green-400' : active ? 'text-white' : 'text-white/40')}
      >
        {label}
      </span>
    </div>
  );
}
