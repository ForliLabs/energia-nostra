import { describe, it, expect } from "vitest";
import { formatHeartbeat } from "@/lib/smart-grid-utils";

describe("formatHeartbeat", () => {
  const BASE = new Date("2025-06-01T12:00:00Z").getTime();

  it("returns 'Mai' for null", () => {
    expect(formatHeartbeat(null, BASE)).toBe("Mai");
  });

  it("returns '< 1 min fa' for a heartbeat 30 seconds ago", () => {
    const ts = new Date(BASE - 30_000).toISOString();
    expect(formatHeartbeat(ts, BASE)).toBe("< 1 min fa");
  });

  it("returns 'N min fa' for heartbeats within the same hour", () => {
    const ts = new Date(BASE - 5 * 60_000).toISOString();
    expect(formatHeartbeat(ts, BASE)).toBe("5 min fa");
  });

  it("returns 'N h fa' for heartbeats within the same day", () => {
    const ts = new Date(BASE - 3 * 60 * 60_000).toISOString();
    expect(formatHeartbeat(ts, BASE)).toBe("3 h fa");
  });

  it("returns 'N g fa' for heartbeats older than 24 hours", () => {
    const ts = new Date(BASE - 2 * 24 * 60 * 60_000).toISOString();
    expect(formatHeartbeat(ts, BASE)).toBe("2 g fa");
  });

  it("returns 'Appena' for a future timestamp", () => {
    const ts = new Date(BASE + 10_000).toISOString();
    expect(formatHeartbeat(ts, BASE)).toBe("Appena");
  });
});
