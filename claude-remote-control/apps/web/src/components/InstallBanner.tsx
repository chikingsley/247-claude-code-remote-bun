"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download, Plus, Share, X } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { cn } from "@/lib/utils";

interface InstallBannerProps {
  className?: string;
}

export function InstallBanner({ className }: InstallBannerProps) {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isDismissed,
    promptInstall,
    dismiss,
  } = useInstallPrompt();

  // Don't show if already installed, dismissed, or not installable
  if (isInstalled || isDismissed || !isInstallable) {
    return null;
  }

  const handleInstall = async () => {
    if (!isIOS) {
      await promptInstall();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          "fixed right-4 bottom-4 left-4 z-50",
          "rounded-xl border border-white/10 bg-[#0d0d14]/95 backdrop-blur-xl",
          "p-4 shadow-2xl shadow-black/50",
          // Safe area for iOS
          "mb-[env(safe-area-inset-bottom)]",
          className
        )}
        exit={{ y: 100, opacity: 0 }}
        initial={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {/* Close button */}
        <button
          aria-label="Fermer"
          className={cn(
            "absolute top-2 right-2 rounded-lg p-2",
            "text-white/40 hover:bg-white/10 hover:text-white",
            "touch-manipulation transition-colors"
          )}
          onClick={dismiss}
        >
          <X className="h-4 w-4" />
        </button>

        {isIOS ? (
          // iOS instructions
          <div className="pr-8">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/20">
                <Download className="h-5 w-5 text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-white">
                  Installer 247
                </h3>
                <p className="mt-1 text-white/60 text-xs">
                  Appuyez sur{" "}
                  <span className="inline-flex items-center gap-1 rounded bg-white/10 px-1.5 py-0.5">
                    <Share className="h-3 w-3" />
                  </span>{" "}
                  puis{" "}
                  <span className="inline-flex items-center gap-1 rounded bg-white/10 px-1.5 py-0.5">
                    <Plus className="h-3 w-3" /> Sur l&apos;ecran d&apos;accueil
                  </span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Android/Desktop install prompt
          <div className="flex items-center gap-3 pr-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/20">
              <Download className="h-5 w-5 text-orange-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm text-white">
                Installer 247
              </h3>
              <p className="truncate text-white/60 text-xs">
                Acces rapide depuis votre ecran
              </p>
            </div>
            <button
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2",
                "bg-orange-500 font-medium text-sm text-white",
                "hover:bg-orange-400 active:scale-95",
                "touch-manipulation transition-all",
                "shadow-lg shadow-orange-500/25"
              )}
              onClick={handleInstall}
            >
              <Download className="h-4 w-4" />
              Installer
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
