import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { useInAppNotifications } from '@/hooks/useInAppNotifications';

vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

describe('useInAppNotifications', () => {
  let handler: ((event: MessageEvent) => void) | null = null;
  let addEventListenerSpy: ReturnType<typeof vi.fn>;
  let removeEventListenerSpy: ReturnType<typeof vi.fn>;
  const toastMock = vi.mocked(toast);

  beforeEach(() => {
    handler = null;
    addEventListenerSpy = vi.fn((_, cb) => {
      handler = cb;
    });
    removeEventListenerSpy = vi.fn();

    toastMock.mockClear();
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        addEventListener: addEventListenerSpy,
        removeEventListener: removeEventListenerSpy,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows a toast for a foreground push notification', () => {
    renderHook(() => useInAppNotifications());

    handler?.({
      data: {
        type: 'PUSH_NOTIFICATION_FOREGROUND',
        payload: {
          title: 'Claude - Project',
          body: 'Attention needed',
          data: { sessionName: 'proj--123' },
        },
      },
    } as MessageEvent);

    expect(toastMock).toHaveBeenCalledTimes(1);
    expect(toastMock).toHaveBeenCalledWith('Claude - Project', {
      description: 'Attention needed',
      duration: 6000,
      id: 'proj--123',
    });
  });

  it('dedupes repeated notifications in a short window', () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1000);
    renderHook(() => useInAppNotifications());

    handler?.({
      data: {
        type: 'PUSH_NOTIFICATION_FOREGROUND',
        payload: {
          title: 'Claude - Project',
          body: 'Attention needed',
          data: { sessionName: 'proj--123' },
        },
      },
    } as MessageEvent);

    handler?.({
      data: {
        type: 'PUSH_NOTIFICATION_FOREGROUND',
        payload: {
          title: 'Claude - Project',
          body: 'Attention needed',
          data: { sessionName: 'proj--123' },
        },
      },
    } as MessageEvent);

    expect(toastMock).toHaveBeenCalledTimes(1);
    nowSpy.mockRestore();
  });

  it('removes the service worker listener on unmount', () => {
    const { unmount } = renderHook(() => useInAppNotifications());
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('message', handler);
  });
});
