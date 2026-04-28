import { describe, it, expect } from "vitest";
import {
  logger,
  generateTraceId,
  captureError,
  withTiming,
} from "@/lib/observability";

describe("observability", () => {
  describe("logger", () => {
    it("creates child logger with bindings", () => {
      const child = logger.child({ route: "/api/test", userId: "user-1" });
      expect(child).toBeDefined();
      // Shouldn't throw
      child.info("test message");
    });

    it("logs at different levels without errors", () => {
      expect(() => logger.debug("debug message")).not.toThrow();
      expect(() => logger.info("info message")).not.toThrow();
      expect(() => logger.warn("warn message")).not.toThrow();
      expect(() => logger.error("error message")).not.toThrow();
    });

    it("accepts additional data", () => {
      expect(() => logger.info("test", { key: "value", num: 42 })).not.toThrow();
    });
  });

  describe("generateTraceId", () => {
    it("generates 32-char hex trace ID", () => {
      const traceId = generateTraceId();
      expect(traceId).toMatch(/^[a-f0-9]{32}$/);
    });

    it("generates unique trace IDs", () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateTraceId()));
      expect(ids.size).toBe(100);
    });
  });

  describe("captureError", () => {
    it("captures error without throwing", () => {
      const error = new Error("Test error");
      expect(() => captureError(error)).not.toThrow();
    });

    it("captures error with context", () => {
      const error = new Error("Test error");
      expect(() => captureError(error, {
        userId: "user-1",
        route: "/api/test",
        action: "test",
        traceId: generateTraceId(),
      })).not.toThrow();
    });
  });

  describe("withTiming", () => {
    it("returns result of timed operation", async () => {
      const result = await withTiming("test-op", async () => {
        return 42;
      });
      expect(result).toBe(42);
    });

    it("propagates errors from timed operation", async () => {
      await expect(
        withTiming("failing-op", async () => {
          throw new Error("Operation failed");
        })
      ).rejects.toThrow("Operation failed");
    });

    it("supports context parameter", async () => {
      const result = await withTiming(
        "context-op",
        async () => "ok",
        { route: "/api/test" }
      );
      expect(result).toBe("ok");
    });
  });
});
