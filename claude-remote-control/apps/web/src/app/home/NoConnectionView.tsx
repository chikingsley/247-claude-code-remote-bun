'use client';

import { motion } from 'framer-motion';
import {
  Zap,
  Wifi,
  HelpCircle,
  Shield,
  HardDrive,
  Globe,
  Server,
  Database,
  Monitor,
  Cloud,
  Lock,
} from 'lucide-react';
import {
  AgentConnectionSettings,
  type saveAgentConnection,
} from '@/components/AgentConnectionSettings';
import { cn } from '@/lib/utils';

interface NoConnectionViewProps {
  modalOpen: boolean;
  onModalOpenChange: (open: boolean) => void;
  onConnectionSaved: (connection: ReturnType<typeof saveAgentConnection>) => void;
}

// Animation variants for staggered entrance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const featureCardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// Feature card data
const features = [
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Zero cloud storage. Your sessions live entirely on your machines.',
    gradient: 'from-emerald-500 to-green-600',
  },
  {
    icon: HardDrive,
    title: 'Local Control',
    description: 'SQLite databases on each agent. Full ownership of your data.',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    icon: Globe,
    title: 'Access Anywhere',
    description: 'Secure tunnels connect you to your agents from any device.',
    gradient: 'from-purple-500 to-violet-600',
  },
  {
    icon: Server,
    title: 'Multi-Machine',
    description: 'Connect unlimited agents. Each with its own database.',
    gradient: 'from-orange-500 to-amber-500',
  },
];

// Animated Architecture Diagram Component
function ArchitectureDiagram() {
  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <svg
        viewBox="0 0 800 300"
        className="h-auto w-full"
        style={{ filter: 'drop-shadow(0 0 40px rgba(249, 115, 22, 0.1))' }}
      >
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>

          <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>

          <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Connection lines with animation */}
        <g className="connection-lines">
          {/* Browser to Dashboard */}
          <motion.line
            x1="140"
            y1="150"
            x2="280"
            y2="150"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          />

          {/* Animated data pulse - Browser to Dashboard */}
          <motion.circle
            r="4"
            fill="url(#orangeGradient)"
            filter="url(#glow)"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              cx: [140, 210, 280, 280],
              cy: [150, 150, 150, 150],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1,
              delay: 1.5,
            }}
          />

          {/* Dashboard to Tunnel zone */}
          <motion.line
            x1="420"
            y1="150"
            x2="520"
            y2="150"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="2"
            strokeDasharray="6 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          />

          {/* Tunnel indicator */}
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
            <rect
              x="445"
              y="135"
              width="50"
              height="30"
              rx="6"
              fill="rgba(249, 115, 22, 0.1)"
              stroke="rgba(249, 115, 22, 0.3)"
              strokeWidth="1"
              className="animate-tunnel-glow"
            />
            <text
              x="470"
              y="155"
              textAnchor="middle"
              className="fill-orange-400 font-mono text-[10px]"
            >
              TLS
            </text>
          </motion.g>

          {/* Tunnel to Agents (split into 2) */}
          {[100, 200].map((y, i) => (
            <g key={i}>
              <motion.path
                d={`M 520 150 Q 580 ${150 + (y - 150) * 0.3} 620 ${y}`}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="2"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, delay: 1 + i * 0.15 }}
              />

              {/* Animated pulse to each agent */}
              <motion.circle
                r="3"
                fill="url(#greenGradient)"
                filter="url(#glow)"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatDelay: 2,
                  delay: 2 + i * 0.5,
                }}
              >
                <animateMotion
                  dur="1.5s"
                  repeatCount="indefinite"
                  path={`M 520 150 Q 580 ${150 + (y - 150) * 0.3} 620 ${y}`}
                  begin={`${2 + i * 0.5}s`}
                />
              </motion.circle>
            </g>
          ))}
        </g>

        {/* Browser Node */}
        <motion.g
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <rect
            x="60"
            y="110"
            width="80"
            height="80"
            rx="16"
            fill="rgba(255,255,255,0.03)"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
          <foreignObject x="80" y="122" width="40" height="40">
            <Monitor className="h-10 w-10 text-white/60" />
          </foreignObject>
          <text
            x="100"
            y="175"
            textAnchor="middle"
            className="fill-white/40 text-[11px] font-medium"
          >
            You
          </text>
        </motion.g>

        {/* Dashboard Node (Vercel) */}
        <motion.g
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <rect
            x="280"
            y="100"
            width="140"
            height="100"
            rx="16"
            fill="rgba(249, 115, 22, 0.05)"
            stroke="rgba(249, 115, 22, 0.2)"
            strokeWidth="1"
          />
          <foreignObject x="330" y="112" width="40" height="40">
            <Cloud className="h-10 w-10 text-orange-400/80" />
          </foreignObject>
          <text
            x="350"
            y="168"
            textAnchor="middle"
            className="fill-white/70 text-[11px] font-semibold"
          >
            Dashboard
          </text>
          <text x="350" y="183" textAnchor="middle" className="fill-white/30 font-mono text-[9px]">
            Stateless / Vercel
          </text>
        </motion.g>

        {/* Agent Nodes */}
        {[
          { y: 70, name: 'Agent 1', status: 'active' },
          { y: 170, name: 'Agent 2', status: 'active' },
        ].map((agent, i) => (
          <motion.g
            key={i}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 + i * 0.15 }}
          >
            <rect
              x="620"
              y={agent.y}
              width="140"
              height="60"
              rx="12"
              fill="rgba(16, 185, 129, 0.05)"
              stroke={
                agent.status === 'active' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)'
              }
              strokeWidth="1"
            />

            {/* Agent icon */}
            <foreignObject x="630" y={agent.y + 12} width="36" height="36">
              <Server className="h-9 w-9 text-emerald-400/70" />
            </foreignObject>

            {/* SQLite indicator */}
            <foreignObject x="713" y={agent.y + 16} width="28" height="28">
              <Database className="h-7 w-7 text-blue-400/50" />
            </foreignObject>

            <text x="680" y={agent.y + 42} className="fill-white/60 text-[10px] font-medium">
              {agent.name}
            </text>

            {/* Status dot */}
            <circle
              cx="635"
              cy={agent.y + 10}
              r="3"
              fill={agent.status === 'active' ? '#10b981' : 'rgba(255,255,255,0.2)'}
            />
          </motion.g>
        ))}

        {/* Labels */}
        <motion.text
          x="690"
          y="265"
          textAnchor="middle"
          className="fill-white/20 font-mono text-[10px] uppercase tracking-wider"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          Local Agents (Your Macs)
        </motion.text>

        <motion.text
          x="350"
          y="265"
          textAnchor="middle"
          className="fill-white/20 font-mono text-[10px] uppercase tracking-wider"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          Cloud (No Data Stored)
        </motion.text>
      </svg>
    </div>
  );
}

// Feature Card Component
function FeatureCard({
  icon: Icon,
  title,
  description,
  gradient,
  index,
}: {
  icon: typeof Shield;
  title: string;
  description: string;
  gradient: string;
  index: number;
}) {
  return (
    <motion.div
      variants={featureCardVariants}
      custom={index}
      className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]"
    >
      {/* Hover glow effect */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div
          className={cn(
            'absolute -inset-px rounded-2xl bg-gradient-to-br opacity-10 blur-xl',
            gradient
          )}
        />
      </div>

      <div className="relative">
        <div className={cn('mb-4 inline-flex rounded-xl bg-gradient-to-br p-3', gradient)}>
          <Icon className="h-5 w-5 text-white" />
        </div>

        <h3 className="mb-2 text-base font-semibold text-white">{title}</h3>

        <p className="text-sm leading-relaxed text-white/40">{description}</p>
      </div>
    </motion.div>
  );
}

export function NoConnectionView({
  modalOpen,
  onModalOpenChange,
  onConnectionSaved,
}: NoConnectionViewProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0a10] selection:bg-orange-500/20">
      {/* Dot Grid Background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Ambient Background Gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-orange-500/[0.08] mix-blend-screen blur-[150px]"
          animate={{
            x: [0, 30, 0],
            y: [0, 20, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-blue-500/[0.08] mix-blend-screen blur-[150px]"
          animate={{
            x: [0, -20, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.05] mix-blend-screen blur-[120px]"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-12 lg:py-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center"
        >
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10">
              <Zap className="h-5 w-5 text-orange-400" />
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-white/50">
              v0.1.0
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="font-display mb-4 text-center text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
              Remote Control for
            </span>
            <br />
            <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              Claude Code
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mb-10 max-w-xl text-center text-base leading-relaxed text-white/40 sm:text-lg"
          >
            Access your local Claude Code agents from anywhere. Monitor sessions, approve commands,
            and stay in control.
          </motion.p>

          {/* Architecture Diagram */}
          <motion.div variants={itemVariants} className="mb-12 w-full">
            <ArchitectureDiagram />
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            variants={itemVariants}
            className="mb-12 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} index={index} />
            ))}
          </motion.div>

          {/* CTA Section */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6"
          >
            <button
              onClick={() => onModalOpenChange(true)}
              className={cn(
                'group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-2xl px-8 py-4 font-semibold transition-all',
                'bg-gradient-to-r from-orange-500 to-amber-500 text-white',
                'hover:scale-[1.02] hover:shadow-[0_0_50px_-12px_rgba(249,115,22,0.5)]',
                'active:scale-[0.98]'
              )}
            >
              {/* Button shine effect */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

              <Wifi className="h-5 w-5" />
              <span>Connect Your Agent</span>
              <div className="mx-1 h-4 w-px bg-white/20" />
              <Lock className="h-4 w-4 opacity-60" />
            </button>

            <a
              href="https://docs.anthropic.com/en/docs/agents-and-tools/claude-code"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 font-medium transition-all',
                'border border-white/5 bg-white/5 text-white/60',
                'hover:border-white/10 hover:bg-white/10 hover:text-white'
              )}
            >
              <HelpCircle className="h-5 w-5" />
              <span>View Guide</span>
            </a>
          </motion.div>

          {/* Bottom tagline */}
          <motion.p
            variants={itemVariants}
            className="mt-12 text-center font-mono text-xs text-white/20"
          >
            Your data stays on your machines. Always.
          </motion.p>
        </motion.div>
      </div>

      {/* Connection Settings Slide-Over */}
      <AgentConnectionSettings
        open={modalOpen}
        onOpenChange={onModalOpenChange}
        onSave={onConnectionSaved}
      />
    </main>
  );
}
