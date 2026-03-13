"use client";

import { type TouchEvent, useCallback, useRef, useState } from "react";

interface UsePullToRefreshOptions {
  disabled?: boolean;
  maxPullZoneY?: number; // Max Y position to start pull (default: 100px)
  onRefresh: () => Promise<void>;
  resistance?: number; // Pull resistance factor (default: 2.5)
  threshold?: number; // Distance to trigger refresh (default: 80px)
}

interface UsePullToRefreshReturn {
  handlers: {
    onTouchStart: (e: TouchEvent) => void;
    onTouchMove: (e: TouchEvent) => void;
    onTouchEnd: () => void;
  };
  isPulling: boolean;
  isRefreshing: boolean;
  isThresholdReached: boolean;
  pullDistance: number;
}

const DEFAULT_THRESHOLD = 80;
const DEFAULT_RESISTANCE = 2.5;
const DEFAULT_MAX_PULL_ZONE_Y = 100;

export function usePullToRefresh({
  onRefresh,
  threshold = DEFAULT_THRESHOLD,
  resistance = DEFAULT_RESISTANCE,
  maxPullZoneY = DEFAULT_MAX_PULL_ZONE_Y,
  disabled = false,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  const startYRef = useRef<number | null>(null);
  const isActiveRef = useRef(false);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled || isRefreshing) {
        return;
      }

      const touch = e.touches[0];
      if (!touch) {
        return;
      }

      // Only activate if touch starts near the top of the screen
      if (touch.clientY > maxPullZoneY) {
        return;
      }

      startYRef.current = touch.clientY;
      isActiveRef.current = true;
    },
    [disabled, isRefreshing, maxPullZoneY]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (
        !(isActiveRef.current && startYRef.current) ||
        disabled ||
        isRefreshing
      ) {
        return;
      }

      const touch = e.touches[0];
      if (!touch) {
        return;
      }

      const deltaY = touch.clientY - startYRef.current;

      // Only pull down, not up
      if (deltaY <= 0) {
        setPullDistance(0);
        setIsPulling(false);
        return;
      }

      // Apply resistance for natural feel
      const resistedDelta = deltaY / resistance;

      // Prevent default scroll behavior when pulling
      e.preventDefault();

      setPullDistance(resistedDelta);
      setIsPulling(true);
    },
    [disabled, isRefreshing, resistance]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isActiveRef.current || disabled) {
      return;
    }

    isActiveRef.current = false;
    startYRef.current = null;

    const wasThresholdReached = pullDistance >= threshold;

    if (wasThresholdReached && !isRefreshing) {
      setIsRefreshing(true);
      setIsPulling(false);
      // Keep showing indicator at threshold during refresh
      setPullDistance(threshold);

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Reset if threshold not reached
      setPullDistance(0);
      setIsPulling(false);
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh, disabled]);

  return {
    pullDistance,
    isRefreshing,
    isPulling,
    isThresholdReached: pullDistance >= threshold,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}
