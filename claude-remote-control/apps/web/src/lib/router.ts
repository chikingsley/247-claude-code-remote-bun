/**
 * Lightweight client-side router replacing next/navigation.
 * Only 2 routes in the app (/ and /connect), so this is intentionally minimal.
 */

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

// Shared navigation event name
const NAV_EVENT = "locationchange";

function dispatchNavEvent() {
  window.dispatchEvent(new Event(NAV_EVENT));
}

// Subscribe to location changes (popstate + custom nav events)
function subscribeToLocation(callback: () => void): () => void {
  window.addEventListener("popstate", callback);
  window.addEventListener(NAV_EVENT, callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(NAV_EVENT, callback);
  };
}

/**
 * Returns the current pathname. Re-renders on navigation.
 */
export function usePathname(): string {
  return useSyncExternalStore(
    subscribeToLocation,
    () => window.location.pathname,
    () => "/"
  );
}

/**
 * Returns the current search params. Re-renders on navigation.
 */
export function useSearchParams(): URLSearchParams {
  const [params, setParams] = useState(
    () => new URLSearchParams(window.location.search)
  );

  useEffect(() => {
    const update = () => setParams(new URLSearchParams(window.location.search));
    window.addEventListener("popstate", update);
    window.addEventListener(NAV_EVENT, update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener(NAV_EVENT, update);
    };
  }, []);

  return params;
}

/**
 * Returns push/replace navigation functions.
 */
export function useRouter() {
  const push = useCallback((url: string, _options?: { scroll?: boolean }) => {
    window.history.pushState({}, "", url);
    dispatchNavEvent();
  }, []);

  const replace = useCallback(
    (url: string, _options?: { scroll?: boolean }) => {
      window.history.replaceState({}, "", url);
      dispatchNavEvent();
    },
    []
  );

  return { push, replace };
}
