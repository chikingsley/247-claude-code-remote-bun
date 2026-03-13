import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { renderHook } from "@testing-library/react";

async function waitFor(fn: () => void, timeout = 1000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      fn();
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 10));
    }
  }
  fn();
}

// Mock the useClearAppBadge hook behavior
describe("useClearAppBadge", () => {
  let clearAppBadgeMock: ReturnType<typeof mock>;
  let originalNavigator: Navigator;

  beforeEach(() => {
    clearAppBadgeMock = mock(() => Promise.resolve(undefined));
    originalNavigator = global.navigator;

    // Mock navigator with clearAppBadge
    Object.defineProperty(global, "navigator", {
      value: {
        ...originalNavigator,
        clearAppBadge: clearAppBadgeMock,
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(global, "navigator", {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it("should call clearAppBadge on mount when API is available", async () => {
    // Import dynamically to get fresh module with mocked navigator
    const { Providers } = await import("@/components/Providers");
    const { createElement } = await import("react");

    renderHook(() => null, {
      wrapper: ({ children }) => createElement(Providers, null, children),
    });

    // Wait for useEffect to run
    await waitFor(() => {
      expect(clearAppBadgeMock).toHaveBeenCalled();
    });
  });

  it("should clear badge when document becomes visible", async () => {
    const { Providers } = await import("@/components/Providers");
    const { createElement } = await import("react");

    renderHook(() => null, {
      wrapper: ({ children }) => createElement(Providers, null, children),
    });

    // Reset mock to check for visibility change call
    clearAppBadgeMock.mockClear();

    // Simulate visibility change
    Object.defineProperty(document, "visibilityState", {
      value: "visible",
      writable: true,
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));

    await waitFor(() => {
      expect(clearAppBadgeMock).toHaveBeenCalled();
    });
  });

  it("should not throw when clearAppBadge is not available", async () => {
    // Remove clearAppBadge from navigator
    Object.defineProperty(global, "navigator", {
      value: {
        ...originalNavigator,
      },
      writable: true,
      configurable: true,
    });

    const { Providers } = await import("@/components/Providers");
    const { createElement } = await import("react");

    // Should not throw
    expect(() => {
      renderHook(() => null, {
        wrapper: ({ children }) => createElement(Providers, null, children),
      });
    }).not.toThrow();
  });
});
