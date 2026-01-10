'use client';

import { useState, useCallback } from 'react';
import { GitPullRequest, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { type SessionInfo } from '@/lib/notifications';
import { buildApiUrl } from '@/lib/utils';

interface CreatePRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: SessionInfo | null;
  agentUrl: string;
}

export function CreatePRModal({ open, onOpenChange, session, agentUrl }: CreatePRModalProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!session || !title.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch(
        buildApiUrl(agentUrl, `/api/sessions/${encodeURIComponent(session.name)}/create-pr`),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: title.trim(), body: body.trim() }),
        }
      );

      const data = await response.json();
      if (response.ok && data.prUrl) {
        toast.success('Pull Request created!');
        window.open(data.prUrl, '_blank');
        onOpenChange(false);
        setTitle('');
        setBody('');
      } else {
        toast.error(data.error || 'Failed to create PR');
      }
    } catch (err) {
      console.error('Failed to create PR:', err);
      toast.error('Could not connect to agent');
    } finally {
      setIsCreating(false);
    }
  }, [session, title, body, agentUrl, onOpenChange]);

  // Reset form when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && session) {
      // Pre-fill title with branch name
      setTitle(session.branchName || '');
      setBody('');
    }
    onOpenChange(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="border-white/10 bg-[#12121a] text-white sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-white">
            <GitPullRequest className="h-5 w-5 text-purple-400" />
            Create Pull Request
          </AlertDialogTitle>
          <AlertDialogDescription className="text-white/60">
            {session?.branchName && (
              <span className="mb-2 block">
                Branch: <code className="text-cyan-400">{session.branchName}</code>
              </span>
            )}
            Create a pull request from your worktree branch.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">PR Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add feature X"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-all placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/20"
              disabled={isCreating}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">
              Description (optional)
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe your changes..."
              rows={4}
              className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-all placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/20"
              disabled={isCreating}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isCreating}
            className="border-white/10 bg-transparent text-white/70 hover:bg-white/5 hover:text-white"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            disabled={isCreating || !title.trim()}
            className="bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50"
          >
            {isCreating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <GitPullRequest className="h-4 w-4" />
                Create PR
              </span>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
