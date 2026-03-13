import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test";
import { renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { useInAppNotifications } from "@/hooks/useInAppNotifications";

mock.module("sonner", () => ({
  toast: mock(),
}));

describe("useInAppNotifications", () => {
  let handler: ((event: MessageEvent) => void) | null = null;
  let addEventListenerSpy: ReturnType<typeof mock>;
  let removeEventListenerSpy: ReturnType<typeof mock>;
  const toastMock = toast as unknown as ReturnType<typeof mock>;

  beforeEach(() => {
    handler = null;
    addEventListenerSpy = mock((_, cb) => {
      handler = cb;
    });
    removeEventListenerSpy = mock();

    toastMock.mockClear();
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        addEventListener: addEventListenerSpy,
        removeEventListener: removeEventListenerSpy,
      },
    });
  });

  afterEach(() => {
    // Restore spies individually where needed
  });

  it("shows a toast for a foreground push notification", () => {
    renderHook(() => useInAppNotifications());

    handler?.({
      data: {
        type: "PUSH_NOTIFICATION_FOREGROUND",
        payload: {
          title: "Claude - Project",
          body: "Attention needed",
          data: { sessionName: "proj--123" },
        },
      },
    } as MessageEvent);

    expect(toastMock).toHaveBeenCalledTimes(1);
    expect(toastMock).toHaveBeenCalledWith("Claude - Project", {
      description: "Attention needed",
      duration: 6000,
      id: "proj--123",
    });
  });

  it("dedupes repeated notifications in a short window", () => {
    const nowSpy = spyOn(Date, "now").mockReturnValue(1000);
    renderHook(() => useInAppNotifications());

    handler?.({
      data: {
        type: "PUSH_NOTIFICATION_FOREGROUND",
        payload: {
          title: "Claude - Project",
          body: "Attention needed",
          data: { sessionName: "proj--123" },
        },
      },
    } as MessageEvent);

    handler?.({
      data: {
        type: "PUSH_NOTIFICATION_FOREGROUND",
        payload: {
          title: "Claude - Project",
          body: "Attention needed",
          data: { sessionName: "proj--123" },
        },
      },
    } as MessageEvent);

    expect(toastMock).toHaveBeenCalledTimes(1);
    nowSpy.mockRestore();
  });

  it("removes the service worker listener on unmount", () => {
    const { unmount } = renderHook(() => useInAppNotifications());
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith("message", handler);
  });

  describe("onNotification callback", () => {
    it("calls onNotification callback when notification is shown", () => {
      const onNotification = mock();
      renderHook(() => useInAppNotifications({ onNotification }));

      handler?.({
        data: {
          type: "PUSH_NOTIFICATION_FOREGROUND",
          payload: {
            title: "Claude - Project",
            body: "Attention needed",
            data: { sessionName: "proj--123" },
          },
        },
      } as MessageEvent);

      expect(toastMock).toHaveBeenCalledTimes(1);
      expect(onNotification).toHaveBeenCalledTimes(1);
    });

    it("does not call onNotification when notification is deduped", () => {
      const nowSpy = spyOn(Date, "now").mockReturnValue(1000);
      const onNotification = mock();
      renderHook(() => useInAppNotifications({ onNotification }));

      // First notification
      handler?.({
        data: {
          type: "PUSH_NOTIFICATION_FOREGROUND",
          payload: {
            title: "Claude - Project",
            body: "Attention needed",
            data: { sessionName: "proj--123" },
          },
        },
      } as MessageEvent);

      // Duplicate notification (should be deduped)
      handler?.({
        data: {
          type: "PUSH_NOTIFICATION_FOREGROUND",
          payload: {
            title: "Claude - Project",
            body: "Attention needed",
            data: { sessionName: "proj--123" },
          },
        },
      } as MessageEvent);

      expect(toastMock).toHaveBeenCalledTimes(1);
      expect(onNotification).toHaveBeenCalledTimes(1);
      nowSpy.mockRestore();
    });

    it("works without onNotification callback", () => {
      renderHook(() => useInAppNotifications());

      handler?.({
        data: {
          type: "PUSH_NOTIFICATION_FOREGROUND",
          payload: {
            title: "Claude - Project",
            body: "Attention needed",
            data: { sessionName: "proj--123" },
          },
        },
      } as MessageEvent);

      expect(toastMock).toHaveBeenCalledTimes(1);
    });

    it("updates callback when options change", () => {
      const onNotification1 = mock();
      const onNotification2 = mock();

      const { rerender } = renderHook(
        ({ callback }) => useInAppNotifications({ onNotification: callback }),
        { initialProps: { callback: onNotification1 } }
      );

      // Trigger with first callback
      handler?.({
        data: {
          type: "PUSH_NOTIFICATION_FOREGROUND",
          payload: {
            title: "First",
            body: "First notification",
            data: { sessionName: "first" },
          },
        },
      } as MessageEvent);

      expect(onNotification1).toHaveBeenCalledTimes(1);
      expect(onNotification2).not.toHaveBeenCalled();

      // Update callback
      rerender({ callback: onNotification2 });

      // Trigger with second callback
      handler?.({
        data: {
          type: "PUSH_NOTIFICATION_FOREGROUND",
          payload: {
            title: "Second",
            body: "Second notification",
            data: { sessionName: "second" },
          },
        },
      } as MessageEvent);

      expect(onNotification1).toHaveBeenCalledTimes(1);
      expect(onNotification2).toHaveBeenCalledTimes(1);
    });
  });
});
