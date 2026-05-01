import { describe, it, expect } from "vitest";
import {
  generateCorrelationId,
  startSpan,
  endSpan,
  addSpanEvent,
  incrementCounter,
  setGauge,
  observeHistogram,
  getPrometheusMetrics,
  instrumentRequest,
  getAlertRules,
  getSlaTargets,
  getRecentTraces,
  getActiveSpans,
} from "@/lib/observability-v2";

describe("observability-v2", () => {
  describe("correlation IDs", () => {
    it("generates unique correlation IDs", () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^[0-9a-f-]+$/);
    });
  });

  describe("tracing", () => {
    it("starts and ends a span", () => {
      const span = startSpan("test-operation", { attributes: { "http.method": "GET" } });
      expect(span.operationName).toBe("test-operation");
      expect(span.status).toBe("unset");
      expect(span.traceId).toBeDefined();
      expect(span.spanId).toBeDefined();

      endSpan(span, "ok");
      expect(span.status).toBe("ok");
      expect(span.duration).not.toBeNull();
      expect(span.duration!).toBeGreaterThanOrEqual(0);
    });

    it("creates child spans", () => {
      const parent = startSpan("parent");
      const child = startSpan("child", {
        traceId: parent.traceId,
        parentSpanId: parent.spanId,
      });
      expect(child.traceId).toBe(parent.traceId);
      expect(child.parentSpanId).toBe(parent.spanId);
      endSpan(child);
      endSpan(parent);
    });

    it("adds events to spans", () => {
      const span = startSpan("with-events");
      addSpanEvent(span, "db.query.start", { table: "users" });
      addSpanEvent(span, "db.query.end", { rows: 5 });
      expect(span.events).toHaveLength(2);
      expect(span.events[0].name).toBe("db.query.start");
      endSpan(span);
    });

    it("tracks completed traces", () => {
      const span = startSpan("trace-test");
      endSpan(span);
      const traces = getRecentTraces(10);
      expect(traces.length).toBeGreaterThan(0);
    });
  });

  describe("prometheus metrics", () => {
    it("increments counters", () => {
      incrementCounter("test_counter", { route: "/api/test" }, 5);
      const output = getPrometheusMetrics();
      expect(output).toContain("test_counter");
    });

    it("sets gauges", () => {
      setGauge("test_gauge", 42, { service: "test" });
      const output = getPrometheusMetrics();
      expect(output).toContain("test_gauge");
      expect(output).toContain("42");
    });

    it("observes histograms", () => {
      for (let i = 0; i < 10; i++) {
        observeHistogram("test_histogram", Math.random() * 100, { endpoint: "/test" });
      }
      const output = getPrometheusMetrics();
      expect(output).toContain("test_histogram");
      expect(output).toContain("quantile");
    });

    it("includes process metrics", () => {
      const output = getPrometheusMetrics();
      expect(output).toContain("process_heap_bytes");
      expect(output).toContain("process_rss_bytes");
      expect(output).toContain("process_uptime_seconds");
    });
  });

  describe("request instrumentation", () => {
    it("instruments HTTP requests", () => {
      instrumentRequest("/api/test", "GET", 200, 50);
      instrumentRequest("/api/test", "GET", 500, 1200);
      const output = getPrometheusMetrics();
      expect(output).toContain("http_requests_total");
    });
  });

  describe("alert rules", () => {
    it("returns predefined alert rules", () => {
      const rules = getAlertRules();
      expect(rules.length).toBeGreaterThanOrEqual(4);
      expect(rules.some((r) => r.severity === "P1")).toBe(true);
      expect(rules.some((r) => r.severity === "P2")).toBe(true);
      expect(rules.some((r) => r.severity === "P3")).toBe(true);
    });

    it("all rules have required fields", () => {
      const rules = getAlertRules();
      for (const rule of rules) {
        expect(rule.id).toBeDefined();
        expect(rule.name).toBeDefined();
        expect(rule.condition).toBeDefined();
        expect(rule.threshold).toBeDefined();
      }
    });
  });

  describe("SLA targets", () => {
    it("returns SLA targets", () => {
      const slas = getSlaTargets();
      expect(slas.length).toBeGreaterThanOrEqual(3);
      expect(slas.every((s) => ["met", "at_risk", "breached"].includes(s.status))).toBe(true);
    });
  });
});
