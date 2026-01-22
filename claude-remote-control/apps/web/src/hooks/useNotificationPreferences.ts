'use client';

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY_SOUND = '247-notification-sound-enabled';
const STORAGE_KEY_PUSH = '247-notification-push-enabled';

/**
 * Hook to manage notification preferences with localStorage persistence.
 * Allows users to independently toggle sound and push notifications.
 * Default: push=true, sound=false
 */
export function useNotificationPreferences() {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);

  // Load persisted state on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedSound = localStorage.getItem(STORAGE_KEY_SOUND);
    if (storedSound !== null) {
      setSoundEnabled(storedSound === 'true');
    }

    const storedPush = localStorage.getItem(STORAGE_KEY_PUSH);
    if (storedPush !== null) {
      setPushEnabled(storedPush === 'true');
    }
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY_SOUND, String(next));
      return next;
    });
  }, []);

  const togglePush = useCallback(() => {
    setPushEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY_PUSH, String(next));
      return next;
    });
  }, []);

  const setSoundPreference = useCallback((enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem(STORAGE_KEY_SOUND, String(enabled));
  }, []);

  const setPushPreference = useCallback((enabled: boolean) => {
    setPushEnabled(enabled);
    localStorage.setItem(STORAGE_KEY_PUSH, String(enabled));
  }, []);

  return {
    soundEnabled,
    pushEnabled,
    toggleSound,
    togglePush,
    setSoundPreference,
    setPushPreference,
  };
}
