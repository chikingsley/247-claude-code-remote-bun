/**
 * Animation configurations for Framer Motion
 * Provides consistent, spring-based animations throughout the app
 */

import type { Transition, Variants } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════
// Spring Configurations
// ═══════════════════════════════════════════════════════════════════════════

export const spring = {
  /** Gentle spring - for subtle movements */
  gentle: {
    type: 'spring',
    stiffness: 120,
    damping: 14,
  } as const,

  /** Snappy spring - for quick interactions */
  snappy: {
    type: 'spring',
    stiffness: 400,
    damping: 30,
  } as const,

  /** Bouncy spring - for playful feedback */
  bouncy: {
    type: 'spring',
    stiffness: 300,
    damping: 10,
  } as const,

  /** Stiff spring - for precise movements */
  stiff: {
    type: 'spring',
    stiffness: 500,
    damping: 35,
  } as const,
} satisfies Record<string, Transition>;

// ═══════════════════════════════════════════════════════════════════════════
// Animation Variants
// ═══════════════════════════════════════════════════════════════════════════

export const variants = {
  /** Fade in with upward movement */
  fadeInUp: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  } satisfies Variants,

  /** Fade in with downward movement */
  fadeInDown: {
    initial: { opacity: 0, y: -8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 8 },
  } satisfies Variants,

  /** Scale in from center */
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  } satisfies Variants,

  /** Slide in from left */
  slideInLeft: {
    initial: { opacity: 0, x: -12 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -12 },
  } satisfies Variants,

  /** Slide in from right */
  slideInRight: {
    initial: { opacity: 0, x: 12 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 12 },
  } satisfies Variants,

  /** Simple fade */
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  } satisfies Variants,

  /** Collapse height animation */
  collapse: {
    initial: { height: 0, opacity: 0 },
    animate: { height: 'auto', opacity: 1 },
    exit: { height: 0, opacity: 0 },
  } satisfies Variants,
};

// ═══════════════════════════════════════════════════════════════════════════
// Stagger Configurations
// ═══════════════════════════════════════════════════════════════════════════

export const stagger = {
  /** Fast stagger for lists */
  fast: {
    animate: {
      transition: {
        staggerChildren: 0.03,
      },
    },
  } satisfies Variants,

  /** Normal stagger for content */
  normal: {
    animate: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  } satisfies Variants,

  /** Slow stagger for emphasis */
  slow: {
    animate: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  } satisfies Variants,
};

// ═══════════════════════════════════════════════════════════════════════════
// Interactive Variants (for hover/tap)
// ═══════════════════════════════════════════════════════════════════════════

export const interactive = {
  /** Subtle scale on hover/tap */
  subtle: {
    whileHover: { scale: 1.01 },
    whileTap: { scale: 0.99 },
  },

  /** More pronounced scale */
  pronounced: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
  },

  /** Lift effect with shadow */
  lift: {
    whileHover: {
      y: -2,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
    whileTap: { y: 0 },
  },

  /** Glow effect */
  glow: {
    whileHover: {
      boxShadow: '0 0 20px rgba(249, 115, 22, 0.2)',
    },
  },
};
