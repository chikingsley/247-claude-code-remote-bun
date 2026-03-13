"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  Code2,
  Database,
  Github,
  Globe,
  Lock,
  Server,
  Shield,
  Terminal,
  Wifi,
} from "lucide-react";
import {
  AgentConnectionSettings,
  type saveAgentConnection,
} from "@/components/AgentConnectionSettings";
import { InstallationGuide } from "@/components/InstallationGuide";

interface NoConnectionViewProps {
  modalOpen: boolean;
  onConnectionSaved: (
    connection: ReturnType<typeof saveAgentConnection>
  ) => void;
  onModalOpenChange: (open: boolean) => void;
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
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-orange-500/10 blur-[120px]"
        transition={{
          duration: 8,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.4, 0.2, 0.4],
        }}
        className="absolute -right-32 -bottom-32 h-[600px] w-[600px] rounded-full bg-amber-500/10 blur-[150px]"
        transition={{
          duration: 10,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />

      {/* Giant 247 Typography */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className="relative select-none"
          initial={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <motion.span
            animate={{
              opacity: [0.03, 0.05, 0.03],
            }}
            className="font-black font-display text-[20vw] text-white/[0.03] leading-none tracking-tighter sm:text-[25vw] lg:text-[30vw]"
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            247
          </motion.span>

          {/* Glow layer */}
          <motion.span
            animate={{
              opacity: [0.02, 0.04, 0.02],
            }}
            className="absolute inset-0 font-black font-display text-[20vw] text-orange-500/[0.02] leading-none tracking-tighter blur-xl sm:text-[25vw] lg:text-[30vw]"
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            247
          </motion.span>
        </motion.div>
      </div>

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}

// Status Badge Component
function StatusBadge() {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 backdrop-blur-sm"
      initial={{ opacity: 0, y: -20 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      <motion.div
        animate={{
          opacity: [1, 0.4, 1],
          scale: [1, 0.9, 1],
        }}
        className="h-2 w-2 rounded-full bg-orange-400"
        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
      />
      <span className="font-medium font-mono text-orange-400 text-xs tracking-wide">
        READY TO CONNECT
      </span>
    </motion.div>
  );
}

// Connect Agent Card
function ConnectAgentCard({ onConnect }: { onConnect: () => void }) {
  return (
    <motion.div
      className="group relative w-full max-w-md cursor-pointer overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-amber-500/5 p-8 backdrop-blur-sm transition-all hover:border-orange-500/40 hover:from-orange-500/10 hover:to-amber-500/10"
      onClick={onConnect}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Glow effect */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-orange-500/20 opacity-0 blur-3xl transition-opacity group-hover:opacity-100" />

      {/* Icon */}
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20">
        <Server className="h-7 w-7 text-orange-400" />
      </div>

      {/* Title */}
      <h3 className="mb-2 font-semibold text-white text-xl">
        Connect Your Agent
      </h3>
      <p className="mb-6 text-sm text-white/50">
        Run 247 on your machine for full privacy and 24/7 uptime
      </p>

      {/* Features */}
      <div className="mb-6 flex flex-wrap gap-2">
        <span className="rounded-full bg-orange-500/10 px-3 py-1.5 font-medium text-orange-400 text-xs">
          Full privacy
        </span>
        <span className="rounded-full bg-white/5 px-3 py-1.5 text-white/50 text-xs">
          24/7 uptime
        </span>
        <span className="rounded-full bg-white/5 px-3 py-1.5 text-white/50 text-xs">
          Your infrastructure
        </span>
      </div>

      {/* Button */}
      <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3.5 font-medium text-sm text-white shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40">
        <Wifi className="h-4 w-4" />
        Connect Agent
      </button>

      {/* Footer */}
      <p className="mt-4 text-center text-white/30 text-xs">
        Already have 247 installed?
      </p>
    </motion.div>
  );
}

// How It Works - Architecture Diagram
function HowItWorks() {
  const benefits = [
    { num: "①", icon: Clock, text: "Runs 24/7" },
    { num: "②", icon: Shield, text: "Data local" },
    { num: "③", icon: Globe, text: "Access anywhere" },
  ];

  return (
    <motion.section
      className="mx-auto w-full max-w-2xl"
      initial={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true, margin: "-100px" }}
      whileInView={{ opacity: 1 }}
    >
      {/* Title */}
      <div className="mb-8 text-center">
        <span className="font-mono text-orange-400/60 text-xs uppercase tracking-widest">
          Architecture
        </span>
        <h2 className="mt-2 font-semibold text-2xl text-white">How It Works</h2>
      </div>

      {/* Diagram */}
      <div className="relative flex flex-col items-center">
        {/* Browser Box */}
        <motion.div
          className="w-full max-w-sm rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
          initial={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
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
          <p className="mt-3 text-white/40 text-xs">
            Just an interface — no data stored
          </p>
        </motion.div>

        {/* Connection Line */}
        <div className="relative h-24 w-full max-w-sm">
          <svg
            className="absolute inset-0 h-full w-full overflow-visible"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            {/* Dashed line */}
            <line
              stroke="rgba(255,255,255,0.1)"
              strokeDasharray="4 4"
              strokeWidth="1"
              x1="50"
              x2="50"
              y1="0"
              y2="100"
            />
            {/* Animated dots */}
            {[0, 1, 2].map((i) => (
              <motion.circle
                animate={{
                  cy: [0, 100],
                  opacity: [0, 1, 1, 0],
                }}
                cx="50"
                fill="#f97316"
                initial={{ cy: 0, opacity: 0 }}
                key={i}
                r="2"
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 0.6,
                  ease: "linear",
                }}
              />
            ))}
          </svg>
          {/* Lock badge */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="flex items-center gap-1.5 rounded-full bg-[#0a0a10] px-3 py-1.5 text-white/50 text-xs ring-1 ring-white/10">
              <Lock className="h-3 w-3" />
              <span>Secure · Tailscale / Local</span>
            </div>
          </div>
        </div>

        {/* Server Box */}
        <motion.div
          className="w-full max-w-sm rounded-xl border border-orange-500/20 bg-orange-500/5 p-5 shadow-lg shadow-orange-500/10"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-orange-500/20 bg-orange-500/10">
              <Server className="h-5 w-5 text-orange-400" />
              {/* Live indicator */}
              <motion.div
                animate={{ opacity: [1, 0.5, 1], scale: [1, 0.9, 1] }}
                className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0a0a10] bg-green-400"
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
              />
            </div>
            <div>
              <p className="font-medium text-white">Your Server</p>
              <p className="text-sm text-white/50">Agent 247 · 24/7</p>
            </div>
          </div>

          {/* Features inside */}
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1 text-white/60 text-xs">
              <Database className="h-3 w-3" />
              <span>SQLite</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1 text-white/60 text-xs">
              <Terminal className="h-3 w-3" />
              <span>tmux</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1 text-white/60 text-xs">
              <Code2 className="h-3 w-3" />
              <span>Claude Code</span>
            </div>
          </div>

          <p className="mt-3 text-white/40 text-xs">
            All your data stays on YOUR machine
          </p>
        </motion.div>
      </div>

      {/* Benefits */}
      <div className="mt-8 grid grid-cols-3 gap-3 text-center">
        {benefits.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              className="flex flex-col items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.02] p-3"
              initial={{ opacity: 0, y: 10 }}
              key={i}
              transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <span className="text-lg text-orange-400">{item.num}</span>
              <Icon className="h-4 w-4 text-white/40" />
              <span className="text-white/50 text-xs">{item.text}</span>
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
}: NoConnectionViewProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0a10] selection:bg-orange-500/20">
      <HeroBackground />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-12 lg:py-20">
        <motion.div
          animate="visible"
          className="flex flex-col items-center"
          initial="hidden"
          variants={containerVariants}
        >
          {/* Status Badge */}
          <motion.div variants={itemVariants}>
            <StatusBadge />
          </motion.div>

          {/* Hero Headline */}
          <motion.div className="mt-8 text-center" variants={itemVariants}>
            <h1 className="font-bold font-display text-5xl text-white tracking-tight sm:text-6xl lg:text-7xl">
              Claude Code.
              <br />
              <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                Anywhere. Anytime.
              </span>
            </h1>
          </motion.div>

          {/* Subheadline */}
          <motion.p
            className="mt-6 max-w-2xl text-balance text-center text-lg text-white/60 leading-relaxed sm:text-xl"
            variants={itemVariants}
          >
            Access your Claude Code sessions securely from any device,{" "}
            <span className="text-white/80">24 hours a day, 7 days a week</span>
            .
          </motion.p>

          {/* Connect Agent Card */}
          <motion.div
            className="mt-10 flex w-full justify-center"
            variants={itemVariants}
          >
            <ConnectAgentCard onConnect={() => onModalOpenChange(true)} />
          </motion.div>

          {/* Security Badge */}
          <motion.div
            className="mt-8 flex items-center gap-2 text-sm text-white/40"
            variants={itemVariants}
          >
            <Lock className="h-4 w-4" />
            <span>
              End-to-end encrypted. Your data stays on your infrastructure.
            </span>
          </motion.div>

          {/* Open Source Badge */}
          <motion.a
            className="mt-3 inline-flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-orange-400"
            href="https://github.com/QuivrHQ/247"
            rel="noopener noreferrer"
            target="_blank"
            variants={itemVariants}
          >
            <Github className="h-4 w-4" />
            <span>100% Open Source</span>
            <ArrowRight className="h-3 w-3" />
          </motion.a>

          {/* Installation Guide */}
          <motion.div className="mt-10 w-full" variants={itemVariants}>
            <InstallationGuide />
          </motion.div>

          {/* How It Works - Architecture Diagram */}
          <motion.div className="mt-12 lg:mt-16" variants={itemVariants}>
            <HowItWorks />
          </motion.div>

          {/* Footer */}
          <motion.div
            className="mt-12 flex flex-col items-center gap-3"
            variants={itemVariants}
          >
            <p className="text-center font-mono text-white/30 text-xs">
              Built for developers who value privacy and control.
            </p>
            <a
              className="inline-flex items-center gap-1.5 text-white/20 text-xs transition-colors hover:text-white/40"
              href="https://github.com/QuivrHQ/247"
              rel="noopener noreferrer"
              target="_blank"
            >
              <Github className="h-3.5 w-3.5" />
              <span>Star us on GitHub</span>
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* Connection Settings Modal */}
      <AgentConnectionSettings
        onOpenChange={onModalOpenChange}
        onSave={onConnectionSaved}
        open={modalOpen}
      />
    </main>
  );
}
