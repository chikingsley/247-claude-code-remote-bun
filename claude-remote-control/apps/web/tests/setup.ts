// Test setup for web app
import { mock } from "bun:test";
import { Window } from "happy-dom";

// Set up DOM globals using happy-dom
const happyWindow = new Window({ url: "http://localhost" });

// Core DOM globals
// @ts-expect-error happy-dom Window doesn't fully match Next.js extended Window type
globalThis.window = happyWindow as unknown as Window & typeof globalThis;
globalThis.document = happyWindow.document as unknown as Document;
globalThis.navigator = happyWindow.navigator as unknown as Navigator;

// DOM constructors
globalThis.HTMLElement =
  happyWindow.HTMLElement as unknown as typeof HTMLElement;
globalThis.HTMLDivElement =
  happyWindow.HTMLDivElement as unknown as typeof HTMLDivElement;
globalThis.HTMLInputElement =
  happyWindow.HTMLInputElement as unknown as typeof HTMLInputElement;
globalThis.HTMLButtonElement =
  happyWindow.HTMLButtonElement as unknown as typeof HTMLButtonElement;
globalThis.Element = happyWindow.Element as unknown as typeof Element;
globalThis.Node = happyWindow.Node as unknown as typeof Node;
globalThis.SVGElement = happyWindow.SVGElement as unknown as typeof SVGElement;
globalThis.Text = happyWindow.Text as unknown as typeof Text;
globalThis.DocumentFragment =
  happyWindow.DocumentFragment as unknown as typeof DocumentFragment;

// Event constructors
globalThis.Event = happyWindow.Event as unknown as typeof Event;
globalThis.CustomEvent =
  happyWindow.CustomEvent as unknown as typeof CustomEvent;
globalThis.KeyboardEvent =
  happyWindow.KeyboardEvent as unknown as typeof KeyboardEvent;
globalThis.MouseEvent = happyWindow.MouseEvent as unknown as typeof MouseEvent;
globalThis.FocusEvent = happyWindow.FocusEvent as unknown as typeof FocusEvent;
globalThis.InputEvent = happyWindow.InputEvent as unknown as typeof InputEvent;

// Observers and utilities
globalThis.MutationObserver =
  happyWindow.MutationObserver as unknown as typeof MutationObserver;
globalThis.IntersectionObserver =
  happyWindow.IntersectionObserver as unknown as typeof IntersectionObserver;
globalThis.ResizeObserver =
  happyWindow.ResizeObserver as unknown as typeof ResizeObserver;

// Storage mocks
function createStorageMock() {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  } as Storage;
}

const localStorageMock = createStorageMock();
const sessionStorageMock = createStorageMock();

Object.defineProperty(window, "localStorage", {
  writable: true,
  value: localStorageMock,
});
Object.defineProperty(window, "sessionStorage", {
  writable: true,
  value: sessionStorageMock,
});

// Make storage available as globals too (some tests access them directly)
globalThis.localStorage = localStorageMock;
globalThis.sessionStorage = sessionStorageMock;

// Mock client-side router
mock.module("@/lib/router", () => ({
  useRouter: () => ({
    push: mock(),
    replace: mock(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock window.matchMedia
const matchMediaMock = mock((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: mock(),
  removeListener: mock(),
  addEventListener: mock(),
  removeEventListener: mock(),
  dispatchEvent: mock(),
}));

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: matchMediaMock,
});
globalThis.matchMedia = matchMediaMock as unknown as typeof matchMedia;

// Mock Notification API
class MockNotification {
  static permission = "default";
  static requestPermission = mock(() =>
    Promise.resolve("granted" as NotificationPermission)
  );
  constructor() {}
  close = mock();
}

Object.defineProperty(window, "Notification", {
  writable: true,
  value: MockNotification,
});
globalThis.Notification = MockNotification as unknown as typeof Notification;
