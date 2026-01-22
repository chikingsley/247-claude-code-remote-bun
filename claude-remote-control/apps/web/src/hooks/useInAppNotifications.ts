'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface UseInAppNotificationsOptions {
  /**
   * Optional callback triggered when a notification is displayed.
   * Useful for playing sounds or other side effects.
   */
  onNotification?: () => void;
}

/**
 * Hook that listens for push notifications when the app is in the foreground.
 * When a push notification arrives while the app is focused, the service worker
 * sends a message instead of showing a system notification, and this hook
 * displays it as an in-app toast.
 */
export function useInAppNotifications(options?: UseInAppNotificationsOptions) {
  const recentNotificationsRef = useRef<Map<string, number>>(new Map());
  const onNotificationRef = useRef(options?.onNotification);

  // Keep callback ref updated
  useEffect(() => {
    onNotificationRef.current = options?.onNotification;
  }, [options?.onNotification]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PUSH_NOTIFICATION_FOREGROUND') {
        const { title, body } = event.data.payload;
        const key = event.data.payload?.data?.sessionName || `${title}-${body}`;
        const now = Date.now();
        const lastShown = recentNotificationsRef.current.get(key);
        if (lastShown && now - lastShown < 3000) {
          return;
        }
        recentNotificationsRef.current.set(key, now);
        for (const [id, timestamp] of recentNotificationsRef.current.entries()) {
          if (now - timestamp > 10000) {
            recentNotificationsRef.current.delete(id);
          }
        }

        toast(title, {
          description: body,
          duration: 6000,
          id: key,
        });

        // Trigger callback (e.g., for sound notifications)
        onNotificationRef.current?.();
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);
}
