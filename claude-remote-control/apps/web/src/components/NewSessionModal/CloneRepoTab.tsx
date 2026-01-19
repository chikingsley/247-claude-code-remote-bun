'use client';

import { useState } from 'react';
import { Loader2, GitBranch, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CloneRepoTabProps {
  onClone: (url: string) => Promise<{ success: boolean; project?: string; error?: string }>;
  loading: boolean;
  error: string | null;
}

// Validate git URL format (https:// or git@)
function isValidGitUrl(url: string): boolean {
  const httpsPattern = /^https:\/\/.+\/.+/;
  const sshPattern = /^git@.+:.+/;
  return httpsPattern.test(url) || sshPattern.test(url);
}

export function CloneRepoTab({ onClone, loading, error }: CloneRepoTabProps) {
  const [repoUrl, setRepoUrl] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleUrlChange = (value: string) => {
    setRepoUrl(value);
    setValidationError(null);
  };

  const handleClone = async () => {
    if (!repoUrl.trim()) {
      setValidationError('Please enter a repository URL');
      return;
    }

    if (!isValidGitUrl(repoUrl.trim())) {
      setValidationError('Invalid URL format. Use https://... or git@...');
      return;
    }

    await onClone(repoUrl.trim());
  };

  const displayError = validationError || error;

  return (
    <div className="space-y-4">
      <div>
        <span className="mb-3 block text-sm font-medium text-white/60">Clone Repository</span>
        <div className="relative">
          <GitBranch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !loading) {
                handleClone();
              }
            }}
            placeholder="https://github.com/user/repo"
            disabled={loading}
            className={cn(
              'w-full rounded-xl py-3 pl-10 pr-4',
              'border bg-white/5',
              displayError
                ? 'border-red-500/50 focus:border-red-500/70'
                : 'border-white/10 focus:border-white/20',
              'text-white placeholder:text-white/30',
              'focus:outline-none',
              'transition-colors',
              loading && 'opacity-50'
            )}
          />
        </div>
      </div>

      {displayError && (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="h-4 w-4" />
          {displayError}
        </div>
      )}

      <button
        onClick={handleClone}
        disabled={loading || !repoUrl.trim()}
        className={cn(
          'w-full rounded-xl px-4 py-3 font-medium',
          'flex items-center justify-center gap-2',
          'transition-all',
          loading || !repoUrl.trim()
            ? 'cursor-not-allowed bg-white/5 text-white/30'
            : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-400 hover:to-amber-400'
        )}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Cloning...
          </>
        ) : (
          <>
            <GitBranch className="h-4 w-4" />
            Clone & Start Session
          </>
        )}
      </button>

      <p className="text-center text-xs text-white/30">
        Supports GitHub, GitLab, Bitbucket, and other Git providers
      </p>
    </div>
  );
}
