"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  Cloud,
  FolderOpen,
  Globe,
  Monitor,
  PanelLeft,
  PanelLeftClose,
  Pencil,
  Plus,
  Trash2,
  Wifi,
} from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  type ConnectionStatus,
  StatusDot,
} from "@/components/ui/status-indicator";
import { spring, stagger, variants } from "@/lib/animations";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface SidebarMachine {
  color?: string;
  id: string;
  name: string;
  sessionCount: number;
  status: ConnectionStatus;
  type: "localhost" | "tailscale" | "fly" | "custom";
  url?: string;
}

export interface SidebarProject {
  activeSessionCount: number;
  name: string;
  path: string;
}

interface SidebarProps {
  canRemoveMachine?: (machine: SidebarMachine) => boolean;
  collapsed?: boolean;
  machines?: SidebarMachine[];
  onAddMachine?: () => void;
  onEditMachine?: (machine: SidebarMachine) => void;
  onRemoveMachine?: (machine: SidebarMachine) => void;
  onSelectMachine?: (id: string) => void;
  onSelectProject?: (projectName: string) => void;
  onToggle?: () => void;
  projects?: SidebarProject[];
  selectedMachineId?: string | null;
  selectedProjectName?: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Machine Icon Component
// ═══════════════════════════════════════════════════════════════════════════

function MachineIcon({
  type,
  className,
}: {
  type: SidebarMachine["type"];
  className?: string;
}) {
  const icons = {
    localhost: Monitor,
    tailscale: Globe,
    fly: Cloud,
    custom: Wifi,
  };
  const Icon = icons[type];
  return <Icon className={className} />;
}

// ═══════════════════════════════════════════════════════════════════════════
// Section Component
// ═══════════════════════════════════════════════════════════════════════════

interface SectionProps {
  action?: React.ReactNode;
  children: React.ReactNode;
  collapsed?: boolean;
  defaultExpanded?: boolean;
  title: string;
}

function Section({
  title,
  children,
  collapsed,
  defaultExpanded = true,
  action,
}: SectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (collapsed) {
    return <div className="py-2">{children}</div>;
  }

  return (
    <div className="py-1">
      {/* Section Header */}
      <button
        className={cn(
          "flex w-full items-center justify-between",
          "px-3 py-2 font-semibold text-xs uppercase tracking-wider",
          "text-foreground-subtle hover:text-foreground-muted",
          "transition-colors duration-150"
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-1.5">
          <motion.div
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={spring.snappy}
          >
            <ChevronRight className="h-3 w-3" />
          </motion.div>
          <span>{title}</span>
        </div>
        {action}
      </button>

      {/* Section Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            animate="animate"
            className="overflow-hidden"
            exit="exit"
            initial="initial"
            transition={spring.gentle}
            variants={variants.collapse}
          >
            <motion.div
              animate="animate"
              className="px-2 pb-1"
              initial="initial"
              variants={stagger.fast}
            >
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Machine Item Component
// ═══════════════════════════════════════════════════════════════════════════

interface MachineItemProps {
  canRemove?: boolean;
  collapsed?: boolean;
  machine: SidebarMachine;
  onClick?: () => void;
  onEdit?: () => void;
  onRemove?: () => void;
  selected?: boolean;
}

function MachineItem({
  machine,
  collapsed,
  selected,
  onClick,
  onEdit,
  onRemove,
  canRemove = true,
}: MachineItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Detect touch devices to always show actions
  const isTouchDevice =
    typeof window !== "undefined" && "ontouchstart" in window;
  const showActions = isHovered || isTouchDevice;

  const handleRemoveConfirm = async () => {
    if (!onRemove) {
      return;
    }
    setIsRemoving(true);
    try {
      onRemove();
    } finally {
      setIsRemoving(false);
      setShowRemoveConfirm(false);
    }
  };

  if (collapsed) {
    // Collapsed view - just icon with status
    return (
      <motion.button
        className={cn(
          "relative flex w-full items-center justify-center",
          "rounded-lg p-2 transition-all duration-150",
          "hover:bg-white/5",
          selected && "bg-primary/10 ring-2 ring-primary/50"
        )}
        onClick={onClick}
        title={machine.name}
        variants={variants.fadeInUp}
      >
        <div className="relative">
          <MachineIcon
            className={cn(
              "h-5 w-5",
              machine.status === "online" ? "text-white/70" : "text-white/30"
            )}
            type={machine.type}
          />
          <StatusDot
            className="absolute -right-0.5 -bottom-0.5"
            size="xs"
            status={machine.status}
          />
        </div>
      </motion.button>
    );
  }

  // Expanded view
  return (
    <>
      <motion.div
        className={cn(
          "group relative flex w-full items-center gap-3",
          "rounded-lg px-3 py-2 transition-all duration-150",
          "hover:bg-white/5",
          selected && "border-primary border-l-2 bg-primary/10"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        variants={variants.fadeInUp}
      >
        {/* Clickable area for selection */}
        <button
          aria-label={`Select ${machine.name}`}
          className="absolute inset-0 z-0"
          onClick={onClick}
        />

        {/* Icon with status */}
        <div className="relative z-10 flex-shrink-0">
          {machine.color ? (
            <div
              className="flex h-5 w-5 items-center justify-center rounded-md"
              style={{ backgroundColor: machine.color }}
            >
              <MachineIcon className="h-3 w-3 text-white" type={machine.type} />
            </div>
          ) : (
            <MachineIcon
              className={cn(
                "h-5 w-5",
                machine.status === "online" ? "text-white/70" : "text-white/30"
              )}
              type={machine.type}
            />
          )}
          <StatusDot
            className="absolute -right-0.5 -bottom-0.5"
            size="xs"
            status={machine.status}
          />
        </div>

        {/* Name and count */}
        <div className="z-10 min-w-0 flex-1 text-left">
          <div className="truncate font-medium text-sm text-white/90">
            {machine.name}
          </div>
          <div className="text-white/40 text-xs">
            {machine.sessionCount} session
            {machine.sessionCount !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Action buttons on hover OR Chevron when not hovered */}
        <div className="z-10 flex-shrink-0">
          <AnimatePresence mode="wait">
            {showActions && (onEdit || (onRemove && canRemove)) ? (
              <motion.div
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-0.5"
                exit={{ opacity: 0, scale: 0.9 }}
                initial={{ opacity: 0, scale: 0.9 }}
                key="actions"
                transition={{ duration: 0.1 }}
              >
                {onEdit && (
                  <button
                    aria-label="Rename machine"
                    className="rounded p-1.5 text-white/40 hover:bg-white/10 hover:text-white/80"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                    title="Rename"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
                {onRemove && canRemove && (
                  <button
                    aria-label="Remove machine"
                    className="rounded p-1.5 text-white/40 hover:bg-red-500/20 hover:text-red-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRemoveConfirm(true);
                    }}
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                key="chevron"
                transition={{ duration: 0.1 }}
              >
                <ChevronRight className="h-4 w-4 text-white/20" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        confirmText="Remove"
        description={`This will disconnect "${machine.name}" from your dashboard. You can add it back later.`}
        isLoading={isRemoving}
        onConfirm={handleRemoveConfirm}
        onOpenChange={setShowRemoveConfirm}
        open={showRemoveConfirm}
        title="Remove machine?"
        variant="destructive"
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Project Item Component
// ═══════════════════════════════════════════════════════════════════════════

interface ProjectItemProps {
  collapsed?: boolean;
  onClick?: () => void;
  project: SidebarProject;
  selected?: boolean;
}

function ProjectItem({
  project,
  collapsed,
  selected,
  onClick,
}: ProjectItemProps) {
  if (collapsed) {
    return (
      <motion.button
        className={cn(
          "flex w-full items-center justify-center",
          "rounded-lg p-2 transition-all duration-150",
          "hover:bg-white/5",
          selected && "bg-primary/10 ring-2 ring-primary/50"
        )}
        onClick={onClick}
        title={project.name}
        variants={variants.fadeInUp}
      >
        <FolderOpen
          className={cn("h-5 w-5", selected ? "text-primary" : "text-white/50")}
        />
        {project.activeSessionCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-primary font-bold text-[8px] text-white">
            {project.activeSessionCount}
          </span>
        )}
      </motion.button>
    );
  }

  return (
    <motion.button
      className={cn(
        "flex w-full items-center gap-3",
        "rounded-lg px-3 py-2 transition-all duration-150",
        "hover:bg-white/5 active:scale-[0.98]",
        selected && "border-primary border-l-2 bg-primary/10"
      )}
      onClick={onClick}
      variants={variants.fadeInUp}
    >
      <FolderOpen
        className={cn(
          "h-4 w-4 flex-shrink-0",
          selected ? "text-primary" : "text-white/50"
        )}
      />
      <span
        className={cn(
          "flex-1 truncate text-left text-sm",
          selected ? "font-medium text-white" : "text-white/70"
        )}
      >
        {project.name}
      </span>
      {project.activeSessionCount > 0 && (
        <span className="rounded bg-white/5 px-1.5 py-0.5 text-white/40 text-xs">
          {project.activeSessionCount}
        </span>
      )}
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Sidebar Component
// ═══════════════════════════════════════════════════════════════════════════

export function Sidebar({
  collapsed = false,
  onToggle,
  machines = [],
  projects = [],
  selectedMachineId,
  onSelectMachine,
  onAddMachine,
  onSelectProject,
  selectedProjectName,
  onEditMachine,
  onRemoveMachine,
  canRemoveMachine,
}: SidebarProps) {
  return (
    <aside
      aria-label="Sidebar navigation"
      className={cn(
        "panel flex h-full w-full flex-col",
        "transition-all duration-200"
      )}
    >
      {/* Logo / Collapse Toggle */}
      <div
        className={cn(
          "flex items-center border-white/5 border-b",
          collapsed ? "justify-center p-3" : "justify-between p-4"
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-orange-500 to-amber-500">
              <span className="font-bold text-white text-xs">24</span>
            </div>
            <span className="font-semibold text-white/90">247</span>
          </div>
        )}

        <button
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "rounded-md p-2 transition-colors",
            "text-white/40 hover:bg-white/5 hover:text-white/70"
          )}
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft aria-hidden="true" className="h-4 w-4" />
          ) : (
            <PanelLeftClose aria-hidden="true" className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="scrollbar-hide flex-1 overflow-y-auto py-2">
        {/* Machines Section */}
        <Section
          action={
            !collapsed &&
            onAddMachine && (
              <button
                aria-label="Add machine"
                className="rounded p-1.5 text-white/40 hover:bg-white/5 hover:text-white/70"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddMachine();
                }}
                title="Add machine"
              >
                <Plus aria-hidden="true" className="h-3 w-3" />
              </button>
            )
          }
          collapsed={collapsed}
          title="Machines"
        >
          {machines.length > 0
            ? machines.map((machine) => (
                <MachineItem
                  canRemove={canRemoveMachine?.(machine) ?? true}
                  collapsed={collapsed}
                  key={machine.id}
                  machine={machine}
                  onClick={() => onSelectMachine?.(machine.id)}
                  onEdit={
                    onEditMachine ? () => onEditMachine(machine) : undefined
                  }
                  onRemove={
                    onRemoveMachine ? () => onRemoveMachine(machine) : undefined
                  }
                  selected={selectedMachineId === machine.id}
                />
              ))
            : !collapsed && (
                <div className="px-3 py-4 text-center">
                  <p className="text-white/30 text-xs">No machines connected</p>
                  {onAddMachine && (
                    <button
                      className="mt-2 text-primary text-xs hover:text-primary/80"
                      onClick={onAddMachine}
                    >
                      + Add machine
                    </button>
                  )}
                </div>
              )}
        </Section>

        {/* Divider */}
        {projects.length > 0 && <div className="mx-3 my-2 h-px bg-white/5" />}

        {/* Projects Section */}
        {projects.length > 0 && (
          <Section collapsed={collapsed} title="Projects">
            {projects.map((project) => (
              <ProjectItem
                collapsed={collapsed}
                key={project.path}
                onClick={() => onSelectProject?.(project.name)}
                project={project}
                selected={selectedProjectName === project.name}
              />
            ))}
          </Section>
        )}
      </div>
    </aside>
  );
}
