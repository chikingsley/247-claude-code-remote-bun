'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Wifi,
  Shield,
  Globe,
  Lock,
  ArrowRight,
  Database,
  Terminal,
  Code2,
  Server,
  Clock,
  Github,
  Cloud,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import {
  AgentConnectionSettings,
  type saveAgentConnection,
} from '@/components/AgentConnectionSettings';
import { InstallationGuide } from '@/components/InstallationGuide';

// Check if cloud auth is enabled
const isCloudEnabled = !!process.env.NEXT_PUBLIC_PROVISIONING_URL;

interface NoConnectionViewProps {
  modalOpen: boolean;
  onModalOpenChange: (open: boolean) => void;
  onConnectionSaved: (connection: ReturnType<typeof saveAgentConnection>) => void;
  onCloudSignIn?: () => Promise<void>;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

// Giant 247 Background Typography
function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-orange-500/10 blur-[120px]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-32 -right-32 h-[600px] w-[600px] rounded-full bg-amber-500/10 blur-[150px]"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.4, 0.2, 0.4],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Giant 247 Typography */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="relative select-none"
        >
          <motion.span
            className="font-display text-[20vw] font-black leading-none tracking-tighter text-white/[0.03] sm:text-[25vw] lg:text-[30vw]"
            animate={{
              opacity: [0.03, 0.05, 0.03],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            247
          </motion.span>

          {/* Glow layer */}
          <motion.span
            className="font-display absolute inset-0 text-[20vw] font-black leading-none tracking-tighter text-orange-500/[0.02] blur-xl sm:text-[25vw] lg:text-[30vw]"
            animate={{
              opacity: [0.02, 0.04, 0.02],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            247
          </motion.span>
        </motion.div>
      </div>

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}

// Status Badge Component
function StatusBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 backdrop-blur-sm"
    >
      <motion.div
        className="h-2 w-2 rounded-full bg-orange-400"
        animate={{
          opacity: [1, 0.4, 1],
          scale: [1, 0.9, 1],
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <span className="font-mono text-xs font-medium tracking-wide text-orange-400">
        READY TO CONNECT
      </span>
    </motion.div>
  );
}

// Dual CTA Cards - Local vs Cloud
function DualCTACards({
  onLocalClick,
  onCloudClick,
  isCloudLoading,
}: {
  onLocalClick: () => void;
  onCloudClick: () => void;
  isCloudLoading: boolean;
}) {
  return (
    <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
      {/* LOCAL Card */}
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-l-2 border-white/10 border-l-emerald-500/50 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/[0.07]"
        onClick={onLocalClick}
      >
        {/* Icon */}
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
          <Server className="h-6 w-6 text-emerald-400" />
        </div>

        {/* Title */}
        <h3 className="mb-1 text-lg font-semibold text-white">Local</h3>
        <p className="mb-4 text-sm text-white/50">Run on your machine</p>

        {/* Features */}
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400">
            Full privacy
          </span>
          <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-white/50">
            24/7 uptime
          </span>
        </div>

        {/* Button */}
        <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-white/10">
          <Wifi className="h-4 w-4" />
          Connect Agent
        </button>

        {/* Footer */}
        <p className="mt-3 text-center text-xs text-white/30">Already have 247 installed?</p>
      </motion.div>

      {/* CLOUD Card */}
      {isCloudEnabled && (
        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-l-2 border-white/10 border-l-orange-500/50 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-orange-500/30 hover:bg-white/[0.07]"
          onClick={onCloudClick}
        >
          {/* Glow effect */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-orange-500/10 opacity-0 blur-3xl transition-opacity group-hover:opacity-100" />

          {/* Icon */}
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
            <Cloud className="h-6 w-6 text-orange-400" />
          </div>

          {/* Title */}
          <h3 className="mb-1 text-lg font-semibold text-white">Cloud</h3>
          <p className="mb-4 text-sm text-white/50">Run in the cloud</p>

          {/* Features */}
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-xs text-orange-400">
              No setup
            </span>
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-white/50">BYOC</span>
          </div>

          {/* Button */}
          <button
            disabled={isCloudLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40 disabled:opacity-50"
          >
            {isCloudLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Github className="h-4 w-4" />
            )}
            Sign in with GitHub
          </button>

          {/* Footer */}
          <p className="mt-3 text-center text-xs text-white/30">Bring your Fly.io account</p>
        </motion.div>
      )}

      {/* Single card fallback when cloud is disabled */}
      {!isCloudEnabled && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center rounded-2xl border border-dashed border-white/10 p-6"
        >
          <div className="text-center">
            <Cloud className="mx-auto mb-2 h-8 w-8 text-white/20" />
            <p className="text-sm text-white/30">Cloud coming soon</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// How It Works - Architecture Diagram
function HowItWorks() {
  const benefits = [
    { num: '①', icon: Clock, text: 'Runs 24/7' },
    { num: '②', icon: Shield, text: 'Data local' },
    { num: '③', icon: Globe, text: 'Access anywhere' },
  ];

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6 }}
      className="mx-auto w-full max-w-2xl"
    >
      {/* Title */}
      <div className="mb-8 text-center">
        <span className="font-mono text-xs uppercase tracking-widest text-orange-400/60">
          Architecture
        </span>
        <h2 className="mt-2 text-2xl font-semibold text-white">How It Works</h2>
      </div>

      {/* Diagram */}
      <div className="relative flex flex-col items-center">
        {/* Browser Box */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-sm rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10">
              <Globe className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-white">Any Device</p>
              <p className="text-sm text-white/50">Dashboard 247</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-white/40">Just an interface — no data stored</p>
        </motion.div>

        {/* Connection Line */}
        <div className="relative h-24 w-full max-w-sm">
          <svg
            className="absolute inset-0 h-full w-full overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Dashed line */}
            <line
              x1="50"
              y1="0"
              x2="50"
              y2="100"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            {/* Animated dots */}
            {[0, 1, 2].map((i) => (
              <motion.circle
                key={i}
                cx="50"
                r="2"
                fill="#f97316"
                initial={{ cy: 0, opacity: 0 }}
                animate={{
                  cy: [0, 100],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.6,
                  ease: 'linear',
                }}
              />
            ))}
          </svg>
          {/* Lock badge */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="flex items-center gap-1.5 rounded-full bg-[#0a0a10] px-3 py-1.5 text-xs text-white/50 ring-1 ring-white/10">
              <Lock className="h-3 w-3" />
              <span>Secure · Tailscale / Local</span>
            </div>
          </div>
        </div>

        {/* Server Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full max-w-sm rounded-xl border border-orange-500/20 bg-orange-500/5 p-5 shadow-lg shadow-orange-500/10"
        >
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-orange-500/20 bg-orange-500/10">
              <Server className="h-5 w-5 text-orange-400" />
              {/* Live indicator */}
              <motion.div
                className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0a0a10] bg-green-400"
                animate={{ opacity: [1, 0.5, 1], scale: [1, 0.9, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
            <div>
              <p className="font-medium text-white">Your Server</p>
              <p className="text-sm text-white/50">Agent 247 · 24/7</p>
            </div>
          </div>

          {/* Features inside */}
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1 text-xs text-white/60">
              <Database className="h-3 w-3" />
              <span>SQLite</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1 text-xs text-white/60">
              <Terminal className="h-3 w-3" />
              <span>tmux</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1 text-xs text-white/60">
              <Code2 className="h-3 w-3" />
              <span>Claude Code</span>
            </div>
          </div>

          <p className="mt-3 text-xs text-white/40">All your data stays on YOUR machine</p>
        </motion.div>
      </div>

      {/* Benefits */}
      <div className="mt-8 grid grid-cols-3 gap-3 text-center">
        {benefits.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.02] p-3"
            >
              <span className="text-lg text-orange-400">{item.num}</span>
              <Icon className="h-4 w-4 text-white/40" />
              <span className="text-xs text-white/50">{item.text}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}

// Main Component
export function NoConnectionView({
  modalOpen,
  onModalOpenChange,
  onConnectionSaved,
  onCloudSignIn,
}: NoConnectionViewProps) {
  const [isCloudLoading, setIsCloudLoading] = useState(false);

  const handleCloudSignIn = async () => {
    if (!isCloudEnabled || !onCloudSignIn) return;
    setIsCloudLoading(true);
    try {
      await onCloudSignIn();
    } catch (error) {
      console.error('Cloud sign-in error:', error);
    } finally {
      setIsCloudLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0a10] selection:bg-orange-500/20">
      <HeroBackground />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-12 lg:py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center"
        >
          {/* Status Badge */}
          <motion.div variants={itemVariants}>
            <StatusBadge />
          </motion.div>

          {/* Hero Headline */}
          <motion.div variants={itemVariants} className="mt-8 text-center">
            <h1 className="font-display text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Claude Code.
              <br />
              <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                Anywhere. Anytime.
              </span>
            </h1>
          </motion.div>

          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            className="mt-6 max-w-2xl text-balance text-center text-lg leading-relaxed text-white/60 sm:text-xl"
          >
            Access your Claude Code sessions securely from any device,{' '}
            <span className="text-white/80">24 hours a day, 7 days a week</span>.
          </motion.p>

          {/* Dual CTA Cards */}
          <motion.div variants={itemVariants} className="mt-10 flex w-full justify-center">
            <DualCTACards
              onLocalClick={() => onModalOpenChange(true)}
              onCloudClick={handleCloudSignIn}
              isCloudLoading={isCloudLoading}
            />
          </motion.div>

          {/* Security Badge */}
          <motion.div
            variants={itemVariants}
            className="mt-8 flex items-center gap-2 text-sm text-white/40"
          >
            <Lock className="h-4 w-4" />
            <span>End-to-end encrypted. Your data stays on your infrastructure.</span>
          </motion.div>

          {/* Open Source Badge */}
          <motion.a
            variants={itemVariants}
            href="https://github.com/QuivrHQ/247"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-orange-400"
          >
            <Github className="h-4 w-4" />
            <span>100% Open Source</span>
            <ArrowRight className="h-3 w-3" />
          </motion.a>

          {/* Installation Guide */}
          <motion.div variants={itemVariants} className="mt-10 w-full">
            <InstallationGuide />
          </motion.div>

          {/* How It Works - Architecture Diagram */}
          <motion.div variants={itemVariants} className="mt-12 lg:mt-16">
            <HowItWorks />
          </motion.div>

          {/* Footer */}
          <motion.div variants={itemVariants} className="mt-12 flex flex-col items-center gap-3">
            <p className="text-center font-mono text-xs text-white/30">
              Built for developers who value privacy and control.
            </p>
            <a
              href="https://github.com/QuivrHQ/247"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-white/20 transition-colors hover:text-white/40"
            >
              <Github className="h-3.5 w-3.5" />
              <span>Star us on GitHub</span>
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* Connection Settings Modal */}
      <AgentConnectionSettings
        open={modalOpen}
        onOpenChange={onModalOpenChange}
        onSave={onConnectionSaved}
      />
    </main>
  );
}
