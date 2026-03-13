"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

interface SlideOverPanelProps {
  children: React.ReactNode;
  onClose: () => void;
  open: boolean;
  title: string;
}

export function SlideOverPanel({
  open,
  onClose,
  title,
  children,
}: SlideOverPanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel from right */}
          <motion.div
            animate={{ x: 0 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-lg"
            exit={{ x: "100%" }}
            initial={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="flex h-full flex-col border-white/10 border-l bg-[#0d0d14]">
              {/* Header */}
              <div className="flex items-center justify-between border-white/5 border-b p-4">
                <h2 className="font-semibold text-lg text-white">{title}</h2>
                <button
                  className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white"
                  onClick={onClose}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-4">{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
