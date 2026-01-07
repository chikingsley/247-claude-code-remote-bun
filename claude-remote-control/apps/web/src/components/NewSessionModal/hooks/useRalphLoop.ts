'use client';

import { useState } from 'react';
import type { RalphLoopConfig } from '@vibecompany/247-shared';

interface UseRalphLoopResult {
  ralphPrompt: string;
  setRalphPrompt: (prompt: string) => void;
  ralphMaxIterations: number;
  setRalphMaxIterations: (iterations: number) => void;
  ralphCompletionPromise: string;
  setRalphCompletionPromise: (promise: string) => void;
  ralphUseWorktree: boolean;
  setRalphUseWorktree: (use: boolean) => void;
  ralphTrustMode: boolean;
  setRalphTrustMode: (trust: boolean) => void;
  getRalphConfig: () => RalphLoopConfig;
  isValid: boolean;
  resetRalphState: () => void;
}

export function useRalphLoop(): UseRalphLoopResult {
  const [ralphPrompt, setRalphPrompt] = useState('');
  const [ralphMaxIterations, setRalphMaxIterations] = useState<number>(10);
  const [ralphCompletionPromise, setRalphCompletionPromise] = useState('COMPLETE');
  const [ralphUseWorktree, setRalphUseWorktree] = useState(false);
  const [ralphTrustMode, setRalphTrustMode] = useState(false);

  const getRalphConfig = (): RalphLoopConfig => ({
    prompt: ralphPrompt.trim(),
    maxIterations: ralphMaxIterations > 0 ? ralphMaxIterations : undefined,
    completionPromise: ralphCompletionPromise.trim() || undefined,
    useWorktree: ralphUseWorktree,
    trustMode: ralphTrustMode,
  });

  const isValid = ralphPrompt.trim().length > 0;

  const resetRalphState = () => {
    setRalphPrompt('');
    setRalphMaxIterations(10);
    setRalphCompletionPromise('COMPLETE');
    setRalphUseWorktree(false);
    setRalphTrustMode(false);
  };

  return {
    ralphPrompt,
    setRalphPrompt,
    ralphMaxIterations,
    setRalphMaxIterations,
    ralphCompletionPromise,
    setRalphCompletionPromise,
    ralphUseWorktree,
    setRalphUseWorktree,
    ralphTrustMode,
    setRalphTrustMode,
    getRalphConfig,
    isValid,
    resetRalphState,
  };
}
