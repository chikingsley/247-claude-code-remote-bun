"use client";

import {
  AlertTriangle,
  CheckCircle,
  Globe,
  Home,
  Lock,
  Shield,
  Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectionMethod {
  icon: typeof Home;
  id: string;
  name: string;
  security: "safe" | "recommended" | "risky";
  setup: string[];
  urlFormat: string;
  useCase: string;
}

const METHODS: ConnectionMethod[] = [
  {
    id: "localhost",
    name: "Localhost",
    icon: Home,
    urlFormat: "ws://localhost:4678",
    useCase: "Same computer - agent and browser on the same machine",
    security: "safe",
    setup: [
      "Start the agent: <code>bun run dev:agent</code>",
      'Open the dashboard and select "Same Computer"',
      "No additional setup needed!",
    ],
  },
  {
    id: "tailscale",
    name: "Tailscale Funnel",
    icon: Wifi,
    urlFormat: "wss://machine.tailnet.ts.net",
    useCase: "Remote access from anywhere - secure and private",
    security: "recommended",
    setup: [
      "Install Tailscale: <code>brew install tailscale</code> (Mac) or <code>curl -fsSL https://tailscale.com/install.sh | sh</code> (Linux)",
      "Login: <code>tailscale up</code> (opens browser for auth)",
      "Enable Funnel: <code>tailscale funnel --bg --https=4678</code>",
      "Get your URL: <code>tailscale funnel --json</code>",
      "Enter the URL in the dashboard connection settings",
    ],
  },
  {
    id: "public",
    name: "Public IP / Domain",
    icon: Globe,
    urlFormat: "ws://1.2.3.4:4678 or wss://tunnel.domain.com",
    useCase: "Remote access without VPN - requires additional security",
    security: "risky",
    setup: [
      "<strong>Warning:</strong> Exposing agent ports publicly is risky without authentication!",
      "Option 1: Use Cloudflare Tunnel with Tailscale",
      "Option 2: Set up nginx/caddy reverse proxy with TLS",
      "Option 3: Use SSH tunneling: <code>ssh -L 4678:localhost:4678 user@remote</code>",
      "<strong>Always</strong> add authentication if exposing to the internet",
    ],
  },
];

const SECURITY_TIPS = [
  {
    icon: Lock,
    title: "Use HTTPS/TLS",
    description:
      "Always use secure connections (wss://) for remote access. Tailscale Funnel provides this automatically.",
  },
  {
    icon: Shield,
    title: "Restrict Access",
    description:
      "Only expose your agent to trusted networks. Use VPNs like Tailscale for secure remote access.",
  },
  {
    icon: CheckCircle,
    title: "Keep Agent Updated",
    description:
      "Regularly update your agent code to get security patches and new features.",
  },
];

export function ConnectionGuide() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="font-bold text-3xl text-white">Connection Guide</h1>
        <p className="text-white/60">
          Choose the best way to connect to your agent based on your use case
        </p>
      </div>

      {/* Connection Methods */}
      <div className="space-y-4">
        <h2 className="font-semibold text-white text-xl">Connection Methods</h2>

        {METHODS.map((method) => {
          const Icon = method.icon;

          return (
            <div
              className={cn(
                "overflow-hidden rounded-2xl border",
                method.security === "safe"
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : method.security === "recommended"
                    ? "border-blue-500/20 bg-blue-500/5"
                    : "border-amber-500/20 bg-amber-500/5"
              )}
              key={method.id}
            >
              {/* Header */}
              <div className="flex items-start gap-4 border-white/5 border-b p-6">
                <div
                  className={cn(
                    "rounded-xl bg-gradient-to-br p-3 shadow-lg",
                    method.security === "safe"
                      ? "from-emerald-500 to-green-500"
                      : method.security === "recommended"
                        ? "from-blue-500 to-indigo-500"
                        : "from-amber-500 to-orange-500"
                  )}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-3">
                    <h3 className="font-semibold text-lg text-white">
                      {method.name}
                    </h3>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 font-medium text-xs",
                        method.security === "safe"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : method.security === "recommended"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-amber-500/20 text-amber-400"
                      )}
                    >
                      {method.security === "safe" && "Safe"}
                      {method.security === "recommended" && "Recommended"}
                      {method.security === "risky" && "Use with Caution"}
                    </span>
                  </div>
                  <p className="mb-2 text-white/60">{method.useCase}</p>
                  <code className="inline-block rounded-lg bg-white/5 px-3 py-1 font-mono text-orange-400 text-sm">
                    {method.urlFormat}
                  </code>
                </div>
              </div>

              {/* Setup Steps */}
              <div className="bg-black/20 p-6">
                <h4 className="mb-3 font-medium text-sm text-white/70">
                  Setup
                </h4>
                <ol className="space-y-2">
                  {method.setup.map((step, i) => (
                    <li
                      className="flex gap-3 text-sm text-white/60"
                      dangerouslySetInnerHTML={{ __html: step }}
                      key={i}
                    />
                  ))}
                </ol>
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Tips */}
      <div className="space-y-4">
        <h2 className="font-semibold text-white text-xl">
          Security Best Practices
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          {SECURITY_TIPS.map((tip, i) => (
            <div
              className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-5"
              key={i}
            >
              <tip.icon className="h-5 w-5 text-orange-400" />
              <h3 className="font-medium text-white">{tip.title}</h3>
              <p className="text-sm text-white/50">{tip.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Warning */}
      <div className="flex gap-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-5">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
        <div>
          <h3 className="mb-1 font-medium text-amber-400">
            Important Security Note
          </h3>
          <p className="text-amber-300/70 text-sm">
            Your agent provides full terminal access to your system. Never
            expose it publicly without proper authentication. We strongly
            recommend using Tailscale Funnel for secure remote access.
          </p>
        </div>
      </div>
    </div>
  );
}
