"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Globe,
  Home,
  Info,
  Loader2,
  Server,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { buildWebSocketUrl, cn, stripProtocol } from "@/lib/utils";

// Old storage key (for migration)
const OLD_STORAGE_KEY = "agentConnection";
// New storage key for multiple connections
const STORAGE_KEY = "agentConnections";

export interface AgentConnection {
  cloudAgentId?: string;
  isCloud?: boolean;
  method: "localhost" | "tailscale" | "custom" | "cloud";
  name?: string;
  url: string;
}

// New type with unique ID for multi-agent support
export interface StoredAgentConnection {
  cloudAgentId?: string;
  color?: string;
  createdAt: number;
  id: string;
  isCloud?: boolean;
  method: "localhost" | "tailscale" | "custom" | "cloud";
  name: string;
  url: string;
}

// Generate a unique ID for connections
function generateConnectionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Migrate from old single-connection format to new array format
export function migrateStorageIfNeeded(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const oldConnection = localStorage.getItem(OLD_STORAGE_KEY);
    const newConnections = localStorage.getItem(STORAGE_KEY);

    // Only migrate if old format exists and new format doesn't
    if (oldConnection && !newConnections) {
      const old = JSON.parse(oldConnection) as AgentConnection;
      const migrated: StoredAgentConnection = {
        id: generateConnectionId(),
        url: old.url,
        name: old.name || "Local Agent",
        method: old.method,
        createdAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([migrated]));
      localStorage.removeItem(OLD_STORAGE_KEY);
      // Migration complete - single agent connection converted to multi-agent format
    }
  } catch (err) {
    console.error("[Migration] Failed to migrate agent connections:", err);
  }
}

// Load all agent connections
export function loadAgentConnections(): StoredAgentConnection[] {
  if (typeof window === "undefined") {
    return [];
  }

  // Run migration on first load
  migrateStorageIfNeeded();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Add a new agent connection
export function addAgentConnection(
  connection: Omit<StoredAgentConnection, "id" | "createdAt">
): StoredAgentConnection {
  const connections = loadAgentConnections();

  // Check for duplicate URLs
  const existingIndex = connections.findIndex(
    (c) => c.url.toLowerCase() === connection.url.toLowerCase()
  );

  const newConnection: StoredAgentConnection = {
    ...connection,
    id: generateConnectionId(),
    createdAt: Date.now(),
  };

  if (existingIndex >= 0) {
    // Update existing connection with same URL
    connections[existingIndex] = {
      ...newConnection,
      id: connections[existingIndex].id, // Keep existing ID
      createdAt: connections[existingIndex].createdAt, // Keep original timestamp
    };
  } else {
    // Add new connection
    connections.push(newConnection);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(connections));
  return existingIndex >= 0 ? connections[existingIndex] : newConnection;
}

// Clear all agent connections
export function clearAllAgentConnections(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// Get the first connection in single-connection format
export function loadAgentConnection(): AgentConnection | null {
  const connections = loadAgentConnections();
  if (connections.length === 0) {
    return null;
  }
  const first = connections[0];
  return {
    url: first.url,
    name: first.name,
    method: first.method === "cloud" ? "custom" : first.method,
  };
}

// Save a single connection (delegates to addAgentConnection)
export function saveAgentConnection(
  connection: AgentConnection
): AgentConnection {
  addAgentConnection({
    url: connection.url,
    name: connection.name || "Agent",
    method: connection.method,
  });
  return connection;
}

interface AgentConnectionSettingsProps {
  /** Whether there's an existing connection that can be disconnected */
  hasConnection?: boolean;
  onDisconnect?: () => void;
  onOpenChange: (open: boolean) => void;
  onSave?: (connection: AgentConnection) => void;
  open: boolean;
}

type ConnectionType = "local" | "remote" | null;
type RemoteMethod = "tailscale" | "custom";
type TestState = "idle" | "testing" | "success" | "error";

// Slide-over animation
const slideVariants = {
  hidden: { x: "100%" },
  visible: {
    x: 0,
    transition: { type: "spring", damping: 30, stiffness: 300 },
  },
  exit: { x: "100%", transition: { duration: 0.2, ease: "easeIn" } },
};

// Step transition animation
const stepVariants = {
  enter: { x: 50, opacity: 0 },
  center: { x: 0, opacity: 1, transition: { duration: 0.3 } },
  exit: { x: -50, opacity: 0, transition: { duration: 0.2 } },
};

// Confetti component for success celebration
function Confetti() {
  const colors = ["#f97316", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    size: Math.random() * 8 + 4,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          animate={{
            y: "100vh",
            opacity: 0,
            rotate: 720,
          }}
          className="absolute rounded-full"
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          key={p.id}
          style={{
            backgroundColor: p.color,
            left: `${p.left}%`,
            top: -20,
            width: p.size,
            height: p.size,
          }}
          transition={{
            duration: 2,
            delay: p.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

// Step indicator component
function StepIndicator({ currentStep }: { currentStep: 1 | 2 }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full font-medium text-sm transition-colors",
          currentStep >= 1
            ? "bg-orange-500 text-white"
            : "bg-white/10 text-white/40"
        )}
      >
        1
      </div>
      <div
        className={cn(
          "h-0.5 w-12 rounded-full transition-colors",
          currentStep >= 2 ? "bg-orange-500" : "bg-white/10"
        )}
      />
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full font-medium text-sm transition-colors",
          currentStep >= 2
            ? "bg-orange-500 text-white"
            : "bg-white/10 text-white/40"
        )}
      >
        2
      </div>
    </div>
  );
}

// Connection type card
function ConnectionTypeCard({
  icon: Icon,
  title,
  description,
  badge,
  badgeColor,
  selected,
  onClick,
}: {
  icon: typeof Home;
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "relative flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition-all",
        selected
          ? "border-orange-500/50 bg-orange-500/10 ring-2 ring-orange-500/20"
          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          "rounded-xl p-3 transition-all",
          selected
            ? "bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/20"
            : "bg-white/10"
        )}
      >
        <Icon
          className={cn("h-6 w-6", selected ? "text-white" : "text-white/60")}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <h3 className="font-semibold text-white">{title}</h3>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 font-medium text-[10px] uppercase tracking-wide",
              badgeColor
            )}
          >
            {badge}
          </span>
        </div>
        <p className="text-sm text-white/50">{description}</p>
      </div>

      <ChevronRight
        className={cn(
          "mt-1 h-5 w-5 transition-all",
          selected ? "rotate-90 text-orange-400" : "text-white/20"
        )}
      />
    </button>
  );
}

// Tailscale guide accordion
function TailscaleGuide() {
  const [expanded, setExpanded] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const steps = [
    { label: "Install Tailscale", command: "brew install tailscale" },
    { label: "Login to your tailnet", command: "tailscale up" },
    {
      label: "Enable Funnel",
      command: "tailscale funnel --bg --https=4678 localhost:4678",
    },
    { label: "Get your URL", command: "tailscale funnel status" },
  ];

  return (
    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5">
      <button
        className="flex w-full items-center justify-between p-4 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 font-medium text-blue-400 text-sm">
          <Info className="h-4 w-4" />
          <span>Setup Tailscale Funnel</span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-blue-400 transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            animate={{ height: "auto", opacity: 1 }}
            className="overflow-hidden"
            exit={{ height: 0, opacity: 0 }}
            initial={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="space-y-3 border-blue-500/10 border-t p-4 pt-3">
              {steps.map((step, i) => (
                <div className="flex items-start gap-3" key={i}>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 font-medium text-[10px] text-blue-400">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-white/60 text-xs">{step.label}</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 truncate rounded bg-white/5 px-2 py-1 font-mono text-white/80 text-xs">
                        {step.command}
                      </code>
                      <button
                        className="rounded p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                        onClick={() => copyToClipboard(step.command)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AgentConnectionSettings({
  open,
  onOpenChange,
  onSave,
  onDisconnect,
  hasConnection = false,
}: AgentConnectionSettingsProps) {
  // Step state
  const [step, setStep] = useState<1 | 2>(1);
  const [connectionType, setConnectionType] = useState<ConnectionType>(null);
  const [remoteMethod, setRemoteMethod] = useState<RemoteMethod>("tailscale");

  // Input state
  const [localhostPort, setLocalhostPort] = useState("4678");
  const [customUrl, setCustomUrl] = useState("");

  // Connection testing
  const [testState, setTestState] = useState<TestState>("idle");
  const [showSuccess, setShowSuccess] = useState(false);

  // Load existing connection on mount
  useEffect(() => {
    if (open) {
      const existing = loadAgentConnection();
      if (existing) {
        if (existing.method === "localhost") {
          setConnectionType("local");
          const port = existing.url.split(":")[1] || "4678";
          setLocalhostPort(port);
        } else {
          setConnectionType("remote");
          // Cloud connections use the custom URL input
          setRemoteMethod(
            existing.method === "cloud" ? "custom" : existing.method
          );
          setCustomUrl(existing.url);
        }
        setStep(2);
      } else {
        // Reset for new connection
        setStep(1);
        setConnectionType(null);
        setLocalhostPort("4678");
        setCustomUrl("");
        setTestState("idle");
      }
    }
  }, [open]);

  // Get the current URL based on state
  const getCurrentUrl = useCallback(() => {
    if (connectionType === "local") {
      return `localhost:${localhostPort}`;
    }
    return customUrl;
  }, [connectionType, localhostPort, customUrl]);

  // Test connection
  const handleTest = async () => {
    const url = getCurrentUrl();
    if (!url) {
      return;
    }

    setTestState("testing");

    try {
      const wsUrl = buildWebSocketUrl(
        url,
        "/terminal?project=test&session=test-connection"
      );
      const ws = new WebSocket(wsUrl);

      const timeout = setTimeout(() => {
        ws.close();
        setTestState("error");
      }, 5000);

      ws.onopen = () => {
        clearTimeout(timeout);
        ws.close();
        setTestState("success");
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        setTestState("error");
      };
    } catch {
      setTestState("error");
    }
  };

  // Save connection - only calls callback, parent handles persistence
  const handleSave = () => {
    let url = getCurrentUrl();
    if (!url) {
      return;
    }

    // Strip protocol prefix if user entered one (https://, wss://, etc.)
    url = stripProtocol(url);

    const method = connectionType === "local" ? "localhost" : remoteMethod;

    const connection: AgentConnection = {
      url,
      name:
        connectionType === "local"
          ? "Same Computer"
          : remoteMethod === "tailscale"
            ? "Tailscale Funnel"
            : "Custom URL",
      method,
    };

    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
      onSave?.(connection);
      onOpenChange(false);
    }, 1500);
  };

  // Handle disconnect - only calls callback, parent handles persistence
  const handleDisconnect = () => {
    onDisconnect?.();
    onOpenChange(false);
  };

  // Handle type selection and advance to step 2
  const handleTypeSelect = (type: ConnectionType) => {
    setConnectionType(type);
    setStep(2);
    setTestState("idle");
  };

  // Go back to step 1
  const handleBack = () => {
    setStep(1);
    setTestState("idle");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          />

          {/* Slide-over panel */}
          <motion.div
            animate="visible"
            className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-[#0a0a10] shadow-2xl sm:max-w-md"
            exit="exit"
            initial="hidden"
            variants={slideVariants}
          >
            {/* Success celebration overlay */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a10]"
                  exit={{ opacity: 0 }}
                  initial={{ opacity: 0 }}
                >
                  <Confetti />

                  <motion.div
                    animate={{ scale: 1, rotate: 0 }}
                    className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-500 shadow-emerald-500/30 shadow-lg"
                    initial={{ scale: 0, rotate: -45 }}
                    transition={{
                      type: "spring",
                      damping: 15,
                      stiffness: 200,
                      delay: 0.1,
                    }}
                  >
                    <Check className="h-12 w-12 text-white" />
                  </motion.div>

                  <motion.h2
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-2 font-bold text-2xl text-white"
                    initial={{ opacity: 0, y: 20 }}
                    transition={{ delay: 0.3 }}
                  >
                    Connected!
                  </motion.h2>

                  <motion.p
                    animate={{ opacity: 1, y: 0 }}
                    className="text-white/50"
                    initial={{ opacity: 0, y: 20 }}
                    transition={{ delay: 0.4 }}
                  >
                    {getCurrentUrl()}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex items-center justify-between border-white/5 border-b px-6 py-4">
              <div className="flex items-center gap-4">
                {step === 2 && (
                  <button
                    className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
                    onClick={handleBack}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                )}
                <div>
                  <h2 className="font-semibold text-lg text-white">
                    Connect Agent
                  </h2>
                  <p className="text-sm text-white/40">
                    {step === 1
                      ? "Choose connection type"
                      : "Configure your connection"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <StepIndicator currentStep={step} />
                <button
                  className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    animate="center"
                    className="space-y-4 p-6"
                    exit="exit"
                    initial="enter"
                    key="step1"
                    variants={stepVariants}
                  >
                    <p className="mb-6 text-white/60">
                      How will you connect to your agent?
                    </p>

                    <ConnectionTypeCard
                      badge="Safest"
                      badgeColor="bg-emerald-500/20 text-emerald-400"
                      description="Agent running on this device"
                      icon={Home}
                      onClick={() => handleTypeSelect("local")}
                      selected={connectionType === "local"}
                      title="Same Computer"
                    />

                    <ConnectionTypeCard
                      badge="Secure"
                      badgeColor="bg-blue-500/20 text-blue-400"
                      description="Connect from anywhere via tunnel"
                      icon={Globe}
                      onClick={() => handleTypeSelect("remote")}
                      selected={connectionType === "remote"}
                      title="Remote Access"
                    />

                    {/* Pairing code divider */}
                    <div className="flex items-center gap-3 pt-4">
                      <div className="h-px flex-1 bg-white/10" />
                      <span className="text-white/40 text-xs">or</span>
                      <div className="h-px flex-1 bg-white/10" />
                    </div>

                    {/* Pairing code input */}
                    <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4">
                      <p className="mb-3 font-medium text-purple-400 text-sm">
                        Have a pairing code?
                      </p>
                      <p className="mb-4 text-white/50 text-xs">
                        Enter the 6-digit code shown on your agent&apos;s
                        pairing page
                      </p>
                      <div className="flex gap-2">
                        <input
                          className={cn(
                            "flex-1 rounded-lg px-4 py-2.5",
                            "border border-white/10 bg-white/5",
                            "text-center font-mono text-lg text-white tracking-widest placeholder:text-white/30",
                            "focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                          )}
                          maxLength={6}
                          onChange={(e) => {
                            // Only allow digits
                            e.target.value = e.target.value.replace(/\D/g, "");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const input = e.target as HTMLInputElement;
                              if (input.value.length === 6) {
                                window.location.href = `/connect?code=${input.value}`;
                              }
                            }
                          }}
                          placeholder="000000"
                          type="text"
                        />
                        <button
                          className={cn(
                            "rounded-lg px-4 py-2.5",
                            "bg-purple-500/20 text-purple-400",
                            "transition-colors hover:bg-purple-500/30"
                          )}
                          onClick={(e) => {
                            const input = (e.target as HTMLElement)
                              .closest("div")
                              ?.querySelector("input") as HTMLInputElement;
                            if (input?.value.length === 6) {
                              window.location.href = `/connect?code=${input.value}`;
                            }
                          }}
                        >
                          Pair
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && connectionType === "local" && (
                  <motion.div
                    animate="center"
                    className="space-y-6 p-6"
                    exit="exit"
                    initial="enter"
                    key="step2-local"
                    variants={stepVariants}
                  >
                    <div>
                      <label className="mb-2 block font-medium text-sm text-white/70">
                        Agent Port
                      </label>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-white/50">
                          localhost:
                        </span>
                        <input
                          className={cn(
                            "w-24 rounded-xl px-4 py-2.5",
                            "border border-white/10 bg-white/5",
                            "text-white placeholder:text-white/30",
                            "focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20",
                            "font-mono text-lg"
                          )}
                          onChange={(e) =>
                            setLocalhostPort(e.target.value.replace(/\D/g, ""))
                          }
                          placeholder="4678"
                          type="text"
                          value={localhostPort}
                        />
                      </div>
                    </div>

                    {/* Quick port buttons */}
                    <div>
                      <label className="mb-2 block text-white/40 text-xs">
                        Quick select
                      </label>
                      <div className="flex gap-2">
                        {["4678", "4679", "4680"].map((port) => (
                          <button
                            className={cn(
                              "rounded-lg px-4 py-2 font-mono text-sm transition-all",
                              localhostPort === port
                                ? "border border-orange-500/30 bg-orange-500/20 text-orange-400"
                                : "border border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
                            )}
                            key={port}
                            onClick={() => setLocalhostPort(port)}
                          >
                            {port}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Current URL display */}
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Server className="h-4 w-4 text-emerald-400" />
                        <span className="font-mono text-emerald-400">
                          {getCurrentUrl()}
                        </span>
                      </div>
                    </div>

                    {/* Test result */}
                    <AnimatePresence>
                      {testState !== "idle" && (
                        <motion.div
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "flex items-center gap-2 rounded-xl px-4 py-3 text-sm",
                            testState === "testing" &&
                              "bg-white/5 text-white/60",
                            testState === "success" &&
                              "bg-emerald-500/20 text-emerald-400",
                            testState === "error" &&
                              "bg-red-500/20 text-red-400"
                          )}
                          exit={{ opacity: 0, y: -10 }}
                          initial={{ opacity: 0, y: -10 }}
                        >
                          {testState === "testing" && (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Testing connection...</span>
                            </>
                          )}
                          {testState === "success" && (
                            <>
                              <Check className="h-4 w-4" />
                              <span>Connection successful!</span>
                            </>
                          )}
                          {testState === "error" && (
                            <>
                              <AlertTriangle className="h-4 w-4" />
                              <span>
                                Could not connect. Is the agent running?
                              </span>
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {step === 2 && connectionType === "remote" && (
                  <motion.div
                    animate="center"
                    className="space-y-6 p-6"
                    exit="exit"
                    initial="enter"
                    key="step2-remote"
                    variants={stepVariants}
                  >
                    {/* Remote method tabs */}
                    <div className="flex gap-2 rounded-xl bg-white/5 p-1">
                      <button
                        className={cn(
                          "flex-1 rounded-lg px-4 py-2 font-medium text-sm transition-all",
                          remoteMethod === "tailscale"
                            ? "bg-white/10 text-white"
                            : "text-white/50 hover:text-white/70"
                        )}
                        onClick={() => setRemoteMethod("tailscale")}
                      >
                        Tailscale Funnel
                      </button>
                      <button
                        className={cn(
                          "flex-1 rounded-lg px-4 py-2 font-medium text-sm transition-all",
                          remoteMethod === "custom"
                            ? "bg-white/10 text-white"
                            : "text-white/50 hover:text-white/70"
                        )}
                        onClick={() => setRemoteMethod("custom")}
                      >
                        Custom URL
                      </button>
                    </div>

                    {/* URL input */}
                    <div>
                      <label className="mb-2 block font-medium text-sm text-white/70">
                        Agent URL
                      </label>
                      <input
                        className={cn(
                          "w-full rounded-xl px-4 py-3",
                          "border border-white/10 bg-white/5",
                          "text-white placeholder:text-white/30",
                          "focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20",
                          "font-mono"
                        )}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        placeholder={
                          remoteMethod === "tailscale"
                            ? "machine.tailnet.ts.net"
                            : "192.168.1.100:4678"
                        }
                        type="text"
                        value={customUrl}
                      />
                    </div>

                    {/* Tailscale guide */}
                    {remoteMethod === "tailscale" && <TailscaleGuide />}

                    {/* Security warning for custom URLs */}
                    {remoteMethod === "custom" && (
                      <div className="flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
                        <div className="text-sm">
                          <p className="mb-1 font-medium text-amber-400">
                            Security Warning
                          </p>
                          <p className="text-white/50">
                            Custom URLs may expose your agent to the internet.
                            Ensure you have proper authentication in place.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Test result */}
                    <AnimatePresence>
                      {testState !== "idle" && (
                        <motion.div
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "flex items-center gap-2 rounded-xl px-4 py-3 text-sm",
                            testState === "testing" &&
                              "bg-white/5 text-white/60",
                            testState === "success" &&
                              "bg-emerald-500/20 text-emerald-400",
                            testState === "error" &&
                              "bg-red-500/20 text-red-400"
                          )}
                          exit={{ opacity: 0, y: -10 }}
                          initial={{ opacity: 0, y: -10 }}
                        >
                          {testState === "testing" && (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Testing connection...</span>
                            </>
                          )}
                          {testState === "success" && (
                            <>
                              <Check className="h-4 w-4" />
                              <span>Connection successful!</span>
                            </>
                          )}
                          {testState === "error" && (
                            <>
                              <AlertTriangle className="h-4 w-4" />
                              <span>
                                Could not connect. Check your URL and try again.
                              </span>
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {step === 2 && (
              <div className="flex shrink-0 flex-col gap-3 border-white/5 border-t bg-white/[0.02] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <div className="flex gap-3">
                  <button
                    className={cn(
                      "flex-1 rounded-xl px-4 py-3 font-medium text-sm transition-all",
                      testState === "testing"
                        ? "cursor-wait bg-white/5 text-white/30"
                        : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                    disabled={testState === "testing" || !getCurrentUrl()}
                    onClick={handleTest}
                  >
                    {testState === "testing" ? "Testing..." : "Test Connection"}
                  </button>

                  <button
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-sm transition-all",
                      "bg-gradient-to-r from-orange-500 to-amber-500 text-white",
                      "hover:shadow-lg hover:shadow-orange-500/20",
                      !getCurrentUrl() && "cursor-not-allowed opacity-50"
                    )}
                    disabled={!getCurrentUrl()}
                    onClick={handleSave}
                  >
                    <Sparkles className="h-4 w-4" />
                    Connect
                  </button>
                </div>

                {hasConnection ? (
                  <button
                    className="rounded-lg px-4 py-2 font-medium text-red-400 text-sm transition-all hover:bg-red-500/10"
                    onClick={handleDisconnect}
                  >
                    Disconnect Current Agent
                  </button>
                ) : (
                  <p className="text-center text-white/30 text-xs">
                    Connection saved locally in your browser
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
