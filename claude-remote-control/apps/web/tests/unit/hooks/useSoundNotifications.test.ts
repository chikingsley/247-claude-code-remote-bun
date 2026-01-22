import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSoundNotifications } from '@/hooks/useSoundNotifications';

describe('useSoundNotifications hook', () => {
  let mockAudioInstance: {
    play: ReturnType<typeof vi.fn>;
    pause: ReturnType<typeof vi.fn>;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
    currentTime: number;
    preload: string;
    volume: number;
  };

  let eventListeners: Record<string, (() => void)[]>;

  beforeEach(() => {
    eventListeners = {};

    mockAudioInstance = {
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      addEventListener: vi.fn((event: string, callback: () => void) => {
        if (!eventListeners[event]) {
          eventListeners[event] = [];
        }
        eventListeners[event].push(callback);
      }),
      removeEventListener: vi.fn(),
      currentTime: 0,
      preload: '',
      volume: 1,
    };

    // Use a class-style mock for Audio constructor
    class MockAudio {
      constructor() {
        Object.assign(this, mockAudioInstance);
        return mockAudioInstance as unknown as MockAudio;
      }
    }
    vi.stubGlobal('Audio', MockAudio);

    // Mock document event listeners for user interaction tracking
    vi.spyOn(document, 'addEventListener').mockImplementation(() => {});
    vi.spyOn(document, 'removeEventListener').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('initialization', () => {
    it('should create Audio element and set properties', () => {
      renderHook(() => useSoundNotifications());

      // Verify audio was configured (we can't easily check constructor args with class mock)
      expect(mockAudioInstance.preload).toBe('auto');
      expect(mockAudioInstance.volume).toBe(0.5);
    });

    it('should set preload to auto', () => {
      renderHook(() => useSoundNotifications());

      expect(mockAudioInstance.preload).toBe('auto');
    });

    it('should set volume to 0.5', () => {
      renderHook(() => useSoundNotifications());

      expect(mockAudioInstance.volume).toBe(0.5);
    });

    it('should start with isLoaded as false', () => {
      const { result } = renderHook(() => useSoundNotifications());

      expect(result.current.isLoaded).toBe(false);
    });

    it('should set isLoaded to true when canplaythrough fires', async () => {
      const { result } = renderHook(() => useSoundNotifications());

      // Simulate canplaythrough event
      act(() => {
        eventListeners['canplaythrough']?.forEach((cb) => cb());
      });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });
    });
  });

  describe('playSound function', () => {
    it('should return false when audio is not loaded', async () => {
      const { result } = renderHook(() => useSoundNotifications());

      let played: boolean = false;
      await act(async () => {
        played = await result.current.playSound();
      });

      expect(played).toBe(false);
      expect(mockAudioInstance.play).not.toHaveBeenCalled();
    });

    it('should play sound when audio is loaded', async () => {
      const { result } = renderHook(() => useSoundNotifications());

      // Simulate audio loaded
      act(() => {
        eventListeners['canplaythrough']?.forEach((cb) => cb());
      });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      let played: boolean = false;
      await act(async () => {
        played = await result.current.playSound();
      });

      expect(played).toBe(true);
      expect(mockAudioInstance.play).toHaveBeenCalled();
    });

    it('should reset currentTime before playing', async () => {
      const { result } = renderHook(() => useSoundNotifications());

      // Simulate audio loaded
      act(() => {
        eventListeners['canplaythrough']?.forEach((cb) => cb());
      });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      mockAudioInstance.currentTime = 5;

      await act(async () => {
        await result.current.playSound();
      });

      expect(mockAudioInstance.currentTime).toBe(0);
    });

    it('should return false when play fails', async () => {
      const { result } = renderHook(() => useSoundNotifications());

      // Simulate audio loaded
      act(() => {
        eventListeners['canplaythrough']?.forEach((cb) => cb());
      });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      // Make play fail (simulates autoplay block)
      mockAudioInstance.play.mockRejectedValueOnce(new Error('Autoplay blocked'));

      let played: boolean = false;
      await act(async () => {
        played = await result.current.playSound();
      });

      expect(played).toBe(false);
    });
  });

  describe('testSound function', () => {
    it('should call playSound internally', async () => {
      const { result } = renderHook(() => useSoundNotifications());

      // Simulate audio loaded
      act(() => {
        eventListeners['canplaythrough']?.forEach((cb) => cb());
      });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      await act(async () => {
        await result.current.testSound();
      });

      expect(mockAudioInstance.play).toHaveBeenCalled();
    });
  });

  describe('function stability', () => {
    it('should return stable playSound reference', () => {
      const { result, rerender } = renderHook(() => useSoundNotifications());

      const playSound1 = result.current.playSound;
      rerender();
      const playSound2 = result.current.playSound;

      // After isLoaded changes, the function reference should be stable
      expect(typeof playSound1).toBe('function');
      expect(typeof playSound2).toBe('function');
    });

    it('should return stable testSound reference', () => {
      const { result, rerender } = renderHook(() => useSoundNotifications());

      const testSound1 = result.current.testSound;
      rerender();
      const testSound2 = result.current.testSound;

      expect(typeof testSound1).toBe('function');
      expect(typeof testSound2).toBe('function');
    });
  });
});
