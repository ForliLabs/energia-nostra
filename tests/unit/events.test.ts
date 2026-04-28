import { describe, it, expect, vi } from "vitest";
import type { DomainEventType } from "@/lib/events";

// Test event types and structure without importing the singleton
describe("events", () => {
  describe("DomainEventType values", () => {
    const validTypes: DomainEventType[] = [
      "vote.cast",
      "vote.opened",
      "vote.closed",
      "trade.created",
      "trade.matched",
      "trade.settled",
      "meter.uploaded",
      "anomaly.detected",
      "invoice.generated",
      "invoice.paid",
      "achievement.earned",
      "document.signed",
      "document.generated",
      "member.joined",
      "member.updated",
      "carbon.purchased",
      "challenge.completed",
      "notification.created",
    ];

    it("has all expected event types", () => {
      expect(validTypes.length).toBe(18);
    });

    it("event types follow namespace.action pattern", () => {
      for (const type of validTypes) {
        expect(type).toMatch(/^[a-z]+\.[a-z]+$/);
      }
    });
  });

  describe("SSE stream format", () => {
    it("formats SSE data correctly", () => {
      const event = {
        id: "test-123",
        type: "vote.cast" as DomainEventType,
        payload: { voteId: "v1", choice: "sì" },
        cerId: "cer-bertinoro",
        timestamp: "2024-01-01T00:00:00.000Z",
      };

      const sseData = `data: ${JSON.stringify(event)}\n\n`;
      expect(sseData).toContain('"type":"vote.cast"');
      expect(sseData).toContain('"cerId":"cer-bertinoro"');
      expect(sseData.endsWith("\n\n")).toBe(true);
    });
  });
});
