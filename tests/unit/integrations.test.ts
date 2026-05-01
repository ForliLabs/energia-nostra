import { describe, it, expect } from "vitest";
import {
  withCircuitBreaker,
  withRetry,
  getCircuitBreakerStatus,
  getIntegrationHealth,
  getAllIntegrationHealth,
  recordIntegrationCall,
  createSpidAuthRequest,
  createStripePaymentIntent,
  createPagopaNotice,
  sendEmail,
  fetchPvgisDataWithCircuitBreaker,
  fetchWeatherData,
} from "@/lib/integrations";

describe("integrations", () => {
  describe("circuit breaker", () => {
    it("starts in closed state", () => {
      const status = getCircuitBreakerStatus("test-service");
      expect(status.state).toBe("closed");
    });

    it("allows requests when closed", async () => {
      const result = await withCircuitBreaker("test-closed", async () => "ok");
      expect(result).toBe("ok");
    });

    it("opens after failure threshold", async () => {
      const service = `test-open-${Date.now()}`;
      for (let i = 0; i < 3; i++) {
        try {
          await withCircuitBreaker(service, async () => {
            throw new Error("fail");
          });
        } catch { /* expected */ }
      }
      const status = getCircuitBreakerStatus(service);
      expect(status.state).toBe("open");
    });

    it("uses fallback when circuit is open", async () => {
      const service = `test-fallback-${Date.now()}`;
      for (let i = 0; i < 3; i++) {
        try {
          await withCircuitBreaker(service, async () => {
            throw new Error("fail");
          });
        } catch { /* expected */ }
      }
      const result = await withCircuitBreaker(
        service,
        async () => "should-not-reach",
        () => "fallback-value"
      );
      expect(result).toBe("fallback-value");
    });
  });

  describe("retry with backoff", () => {
    it("returns on first success", async () => {
      const result = await withRetry(async () => "ok");
      expect(result).toBe("ok");
    });

    it("retries on failure then succeeds", async () => {
      let attempts = 0;
      const result = await withRetry(
        async () => {
          attempts++;
          if (attempts < 2) throw new Error("fail");
          return "ok";
        },
        { baseDelayMs: 10, maxRetries: 3 }
      );
      expect(result).toBe("ok");
      expect(attempts).toBe(2);
    });

    it("throws after max retries", async () => {
      await expect(
        withRetry(
          async () => {
            throw new Error("always-fail");
          },
          { baseDelayMs: 10, maxRetries: 1 }
        )
      ).rejects.toThrow("always-fail");
    });
  });

  describe("integration health", () => {
    it("reports unconfigured services", () => {
      const health = getIntegrationHealth("stripe");
      // Stripe is not configured in test environment
      expect(health.configured).toBe(false);
      expect(health.status).toBe("unconfigured");
    });

    it("reports public APIs as healthy", () => {
      const health = getIntegrationHealth("pvgis");
      expect(health.configured).toBe(true);
    });

    it("records integration calls", () => {
      const service = `test-record-${Date.now()}`;
      recordIntegrationCall(service, true, 50);
      recordIntegrationCall(service, true, 100);
      recordIntegrationCall(service, false, 200);
      const health = getIntegrationHealth(service);
      expect(health.avgLatencyMs).toBeGreaterThan(0);
    });

    it("returns all integration health statuses", () => {
      const all = getAllIntegrationHealth();
      expect(all.length).toBeGreaterThanOrEqual(8);
      expect(all.every((h) => h.service)).toBe(true);
    });
  });

  describe("SPID integration", () => {
    it("creates SPID auth request (demo mode)", async () => {
      const result = await createSpidAuthRequest("https://idp.spid.gov.it");
      expect(result.authnRequestId).toBeDefined();
      expect(result.redirectUrl).toBeDefined();
    });
  });

  describe("Stripe integration", () => {
    it("creates payment intent (demo mode)", async () => {
      const result = await createStripePaymentIntent(25.00, "eur", { invoiceId: "inv-1" });
      expect(result.id).toContain("demo");
      expect(result.amount).toBe(25);
      expect(result.currency).toBe("eur");
    });
  });

  describe("PagoPA integration", () => {
    it("creates payment notice (demo mode)", async () => {
      const result = await createPagopaNotice(100, "Quota CER", {
        fiscalCode: "RSSMRA80A01D704Z",
        name: "Mario Rossi",
      });
      expect(result.iuv).toBeDefined();
      expect(result.amount).toBe(100);
    });
  });

  describe("SendGrid integration", () => {
    it("sends email (demo mode)", async () => {
      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test",
        htmlContent: "<p>Test</p>",
      });
      expect(result.messageId).toContain("demo");
      expect(result.status).toBe("demo");
    });
  });

  describe("PVGIS integration", () => {
    it("returns data with fallback", async () => {
      const result = await fetchPvgisDataWithCircuitBreaker(44.222, 12.041, 6);
      expect(result).toBeDefined();
      expect(result.outputs || result.fallback).toBeDefined();
    });
  });

  describe("weather integration", () => {
    it("returns weather data or fallback", async () => {
      const result = await fetchWeatherData(44.222, 12.041);
      expect(result).toBeDefined();
    });
  });
});
