"use client";

import { Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

interface Machine {
  config?: {
    projects: string[];
    agentUrl?: string;
  };
  id: string;
  name: string;
  status: string;
}

interface MachineSelectorProps {
  machines: Machine[];
  onSelectMachine: (machine: Machine) => void;
  selectedMachine: Machine | null;
}

export function MachineSelector({
  machines,
  selectedMachine,
  onSelectMachine,
}: MachineSelectorProps) {
  const onlineMachines = machines.filter((m) => m.status === "online");
  const offlineMachines = machines.filter((m) => m.status !== "online");

  return (
    <div>
      <span
        className="mb-3 block font-medium text-sm text-white/60"
        id="machine-selector-label"
      >
        Select Machine
      </span>
      <div
        aria-labelledby="machine-selector-label"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
        role="group"
      >
        {onlineMachines.map((machine) => (
          <button
            className={cn(
              "rounded-xl p-4 text-left transition-all",
              "border",
              selectedMachine?.id === machine.id
                ? "border-orange-500/50 bg-orange-500/10 shadow-lg shadow-orange-500/10"
                : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
            )}
            key={machine.id}
            onClick={() => onSelectMachine(machine)}
          >
            <div className="mb-2 flex items-center gap-2">
              <Monitor
                className={cn(
                  "h-4 w-4",
                  selectedMachine?.id === machine.id
                    ? "text-orange-400"
                    : "text-white/50"
                )}
              />
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  "bg-emerald-400 shadow-emerald-400/50 shadow-sm"
                )}
              />
            </div>
            <p
              className={cn(
                "truncate font-medium",
                selectedMachine?.id === machine.id
                  ? "text-white"
                  : "text-white/80"
              )}
            >
              {machine.name}
            </p>
            <p className="mt-0.5 truncate font-mono text-white/30 text-xs">
              {machine.config?.agentUrl || "localhost:4678"}
            </p>
          </button>
        ))}

        {offlineMachines.map((machine) => (
          <div
            className={cn(
              "rounded-xl p-4",
              "border border-white/5 bg-white/[0.02]",
              "cursor-not-allowed opacity-50"
            )}
            key={machine.id}
          >
            <div className="mb-2 flex items-center gap-2">
              <Monitor className="h-4 w-4 text-white/30" />
              <span className="h-2 w-2 rounded-full bg-red-400/50" />
            </div>
            <p className="truncate font-medium text-white/40">{machine.name}</p>
            <p className="mt-0.5 truncate font-mono text-white/20 text-xs">
              offline
            </p>
          </div>
        ))}
      </div>

      {machines.length === 0 && (
        <div className="py-8 text-center text-white/30">
          <Monitor className="mx-auto mb-2 h-8 w-8 opacity-50" />
          <p>No machines registered</p>
        </div>
      )}

      {machines.length > 0 && onlineMachines.length === 0 && (
        <div className="py-8 text-center text-white/30">
          <Monitor className="mx-auto mb-2 h-8 w-8 opacity-50" />
          <p>All machines are offline</p>
        </div>
      )}
    </div>
  );
}
