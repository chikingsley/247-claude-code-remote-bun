'use client';

import { useRef, useCallback, useEffect, useState } from 'react';

const NOTIFICATION_SOUND_PATH = '/sounds/notification.mp3';

/**
 * Hook for playing notification sounds.
 * Handles browser autoplay policy by tracking user interaction.
 * Preloads audio on mount for instant playback.
 */
export function useSoundNotifications() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Preload audio on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio(NOTIFICATION_SOUND_PATH);
    audio.preload = 'auto';
    audio.volume = 0.5;

    audio.addEventListener('canplaythrough', () => {
      setIsLoaded(true);
    });

    audio.addEventListener('error', () => {
      console.warn('Failed to load notification sound');
    });

    audioRef.current = audio;

    // Track user interaction for autoplay policy
    const handleInteraction = () => {
      setHasUserInteracted(true);
      // Remove listeners after first interaction
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      audioRef.current = null;
    };
  }, []);

  /**
   * Play the notification sound.
   * Returns true if sound was played, false if blocked or unavailable.
   */
  const playSound = useCallback(async (): Promise<boolean> => {
    if (!audioRef.current || !isLoaded) {
      return false;
    }

    try {
      // Reset to beginning if already playing
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      return true;
    } catch (error) {
      // Browser blocked autoplay - this is expected before user interaction
      console.debug('Sound playback blocked:', error);
      return false;
    }
  }, [isLoaded]);

  /**
   * Test the notification sound (for settings panel).
   * Same as playSound but with clearer intent.
   */
  const testSound = useCallback(async (): Promise<boolean> => {
    return playSound();
  }, [playSound]);

  return {
    playSound,
    testSound,
    isLoaded,
    hasUserInteracted,
  };
}
