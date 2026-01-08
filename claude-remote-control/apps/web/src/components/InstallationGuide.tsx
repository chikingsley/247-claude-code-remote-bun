'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Copy, Check, ChevronDown, Sparkles, Rocket, Settings, Plug } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepProps {
  number: number;
  title: string;
  description: string;
  command?: string;
  icon: React.ReactNode;
  isLast?: boolean;
  delay: number;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.button
      onClick={handleCopy}
      className={cn(
        'absolute right-3 top-1/2 -translate-y-1/2',
        'rounded-lg p-2 transition-all duration-200',
        'opacity-0 group-hover:opacity-100',
        'bg-white/5 hover:bg-white/10',
        'border border-white/10 hover:border-orange-500/30',
        'focus:outline-none focus:ring-2 focus:ring-orange-500/50'
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.div
            key="check"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <Check className="h-4 w-4 text-emerald-400" />
          </motion.div>
        ) : (
          <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
            <Copy className="h-4 w-4 text-white/60" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function InstallStep({ number, title, description, command, icon, isLast, delay }: StepProps) {
  return (
    <motion.div
      className="relative flex gap-4"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        {/* Step number bubble */}
        <motion.div
          className={cn(
            'relative flex h-10 w-10 items-center justify-center rounded-xl',
            'bg-gradient-to-br from-orange-500/20 to-amber-500/10',
            'border border-orange-500/30',
            'shadow-[0_0_20px_rgba(249,115,22,0.15)]'
          )}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: delay + 0.1, type: 'spring', stiffness: 400 }}
        >
          <span className="font-mono text-sm font-bold text-orange-400">{number}</span>
          {/* Glow ring */}
          <motion.div
            className="absolute inset-0 rounded-xl bg-orange-500/20"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: delay }}
          />
        </motion.div>

        {/* Connecting line */}
        {!isLast && (
          <motion.div
            className="min-h-[40px] w-px flex-1 bg-gradient-to-b from-orange-500/30 to-transparent"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: delay + 0.2, duration: 0.3 }}
            style={{ transformOrigin: 'top' }}
          />
        )}
      </div>

      {/* Step content */}
      <div className="flex-1 pb-6">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-white/40">{icon}</span>
          <h4 className="font-medium text-white/90">{title}</h4>
        </div>
        <p className="mb-3 text-sm text-white/50">{description}</p>

        {command && (
          <div className="group relative">
            <motion.div
              className={cn(
                'relative overflow-hidden rounded-lg',
                'bg-black/40 backdrop-blur-sm',
                'border border-white/[0.08]',
                'transition-colors duration-300 hover:border-orange-500/20'
              )}
              whileHover={{ scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              {/* Terminal header dots */}
              <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-3 py-2">
                <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
                <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
                <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
                <span className="ml-2 font-mono text-[10px] text-white/30">terminal</span>
              </div>

              {/* Command */}
              <div className="relative px-4 py-3">
                <code className="font-mono text-sm">
                  <span className="text-emerald-400/80">$</span>
                  <span className="ml-2 text-white/90">{command}</span>
                </code>
                <CopyButton text={command} />
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function InstallationGuide() {
  const [isExpanded, setIsExpanded] = useState(false);

  const steps = [
    {
      number: 1,
      title: 'Install the CLI',
      description: 'Install 247 globally via npm',
      command: 'npm install -g 247-cli',
      icon: <Terminal className="h-4 w-4" />,
    },
    {
      number: 2,
      title: 'Configure',
      description: 'Run the setup wizard to configure your agent',
      command: '247 init',
      icon: <Settings className="h-4 w-4" />,
    },
    {
      number: 3,
      title: 'Start the Agent',
      description: 'Launch your agent in the background',
      command: '247 start',
      icon: <Rocket className="h-4 w-4" />,
    },
    {
      number: 4,
      title: 'Connect',
      description: 'Click the button above to connect to your running agent',
      icon: <Plug className="h-4 w-4" />,
    },
  ];

  return (
    <motion.div
      className="mx-auto w-full max-w-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.5 }}
    >
      {/* Collapse trigger */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'group relative w-full overflow-hidden',
          'rounded-2xl transition-all duration-300',
          'bg-white/[0.02] hover:bg-white/[0.04]',
          'border border-white/[0.06] hover:border-orange-500/20',
          'backdrop-blur-sm',
          'focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:ring-offset-2 focus:ring-offset-[#0a0a10]'
        )}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'rounded-xl p-2',
                'bg-gradient-to-br from-orange-500/20 to-amber-500/10',
                'border border-orange-500/20'
              )}
            >
              <Sparkles className="h-4 w-4 text-orange-400" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-medium text-white/90">
                New here? Get started in 60 seconds
              </h3>
              <p className="text-xs text-white/40">Install and launch your agent with 3 commands</p>
            </div>
          </div>

          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <ChevronDown className="h-5 w-5 text-white/40 transition-colors group-hover:text-orange-400" />
          </motion.div>
        </div>

        {/* Subtle gradient line at bottom when collapsed */}
        {!isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
        )}
      </motion.button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                'mt-2 rounded-2xl p-5',
                'bg-white/[0.02] backdrop-blur-sm',
                'border border-white/[0.06]'
              )}
            >
              {/* Steps */}
              <div className="space-y-0">
                {steps.map((step, index) => (
                  <InstallStep
                    key={step.number}
                    {...step}
                    isLast={index === steps.length - 1}
                    delay={index * 0.1}
                  />
                ))}
              </div>

              {/* Documentation link */}
              <motion.div
                className="mt-4 border-t border-white/[0.06] pt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-center text-xs text-white/30">
                  Need help?{' '}
                  <a
                    href="https://github.com/QuivrHQ/247"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-400/70 underline underline-offset-2 transition-colors hover:text-orange-400"
                  >
                    View documentation
                  </a>
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
