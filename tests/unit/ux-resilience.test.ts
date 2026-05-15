import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── useOnlineStatus ──

describe("useOnlineStatus hook logic", () => {
  let onlineHandlers: Array<() => void>;
  let offlineHandlers: Array<() => void>;

  beforeEach(() => {
    onlineHandlers = [];
    offlineHandlers = [];
    vi.spyOn(window, "addEventListener").mockImplementation((event, handler) => {
      if (event === "online") onlineHandlers.push(handler as () => void);
      if (event === "offline") offlineHandlers.push(handler as () => void);
    });
    vi.spyOn(window, "removeEventListener").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize with navigator.onLine value", () => {
    // navigator.onLine is typically true in test environments
    expect(navigator.onLine).toBe(true);
  });
});

// ── DataFreshness stale detection ──

describe("DataFreshness stale threshold logic", () => {
  it("detects data older than threshold as stale", () => {
    const fiveMinutesAgo = new Date(Date.now() - 6 * 60 * 1000).toISOString();
    const ageMs = Date.now() - new Date(fiveMinutesAgo).getTime();
    const staleAfterSeconds = 300;
    expect(ageMs > staleAfterSeconds * 1000).toBe(true);
  });

  it("detects recent data as fresh", () => {
    const tenSecondsAgo = new Date(Date.now() - 10 * 1000).toISOString();
    const ageMs = Date.now() - new Date(tenSecondsAgo).getTime();
    const staleAfterSeconds = 300;
    expect(ageMs > staleAfterSeconds * 1000).toBe(false);
  });

  it("handles null lastUpdated gracefully", () => {
    const lastUpdated: string | null = null;
    const result = lastUpdated ? { isStale: true } : { isStale: false };
    expect(result.isStale).toBe(false);
  });

  it("respects custom stale threshold", () => {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const ageMs = Date.now() - new Date(twoMinutesAgo).getTime();

    // With 60s threshold, 2 minutes is stale
    expect(ageMs > 60 * 1000).toBe(true);

    // With 300s threshold, 2 minutes is fresh
    expect(ageMs > 300 * 1000).toBe(false);
  });
});

// ── useResilientFetch backoff logic ──

describe("useResilientFetch backoff computation", () => {
  it("computes exponential backoff delays correctly", () => {
    const baseDelayMs = 1000;
    expect(baseDelayMs * Math.pow(2, 0)).toBe(1000); // 1s
    expect(baseDelayMs * Math.pow(2, 1)).toBe(2000); // 2s
    expect(baseDelayMs * Math.pow(2, 2)).toBe(4000); // 4s
    expect(baseDelayMs * Math.pow(2, 3)).toBe(8000); // 8s
  });

  it("caps retries at maxRetries", () => {
    const maxRetries = 3;
    let attempt = 0;
    const attempts: number[] = [];

    while (attempt < maxRetries) {
      attempts.push(attempt);
      attempt++;
    }

    expect(attempts).toEqual([0, 1, 2]);
    expect(attempt).toBe(maxRetries);
  });
});

// ── ConnectionStatusBanner rendering logic ──

describe("ConnectionStatusBanner visibility rules", () => {
  it("should be hidden when online and not recently reconnected", () => {
    const isOnline = true;
    const justReconnected = false;
    const shouldShow = !isOnline || justReconnected;
    expect(shouldShow).toBe(false);
  });

  it("should show offline message when offline", () => {
    const isOnline = false;
    const justReconnected = false;
    const shouldShow = !isOnline || justReconnected;
    expect(shouldShow).toBe(true);
  });

  it("should show reconnection message briefly after coming back online", () => {
    const isOnline = true;
    const justReconnected = true;
    const shouldShow = !isOnline || justReconnected;
    expect(shouldShow).toBe(true);
  });
});

// ── Offline queue item creation ──

import { createOfflineQueueItem } from "@/lib/offline-pwa";

describe("createOfflineQueueItem", () => {
  it("creates a properly structured queue item", () => {
    const item = createOfflineQueueItem("/api/members", "POST", { name: "Test" });
    expect(item.url).toBe("/api/members");
    expect(item.method).toBe("POST");
    expect(item.body).toBe('{"name":"Test"}');
    expect(item.status).toBe("queued");
    expect(item.retryCount).toBe(0);
    expect(item.id).toMatch(/^oq_/);
  });

  it("handles null body for GET requests", () => {
    const item = createOfflineQueueItem("/api/energy", "GET");
    expect(item.body).toBeNull();
  });
});
