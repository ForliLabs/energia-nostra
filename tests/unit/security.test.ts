import { describe, it, expect } from "vitest";
import {
  checkRateLimit,
  generateCsrfToken,
  validateCsrfToken,
  getSecurityHeaders,
  sanitizeHtml,
  sanitizeOutput,
  getCorsHeaders,
  getClientIp,
  getRateLimitConfig,
  enforceMutationSecurity,
  isTrustedExternalUrl,
} from "@/lib/security";

describe("security", () => {
  describe("rate limiting", () => {
    it("allows first request", () => {
      const key = `test-${Date.now()}-${Math.random()}`;
      const config = getRateLimitConfig("api");
      const result = checkRateLimit(key, config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(config.maxRequests - 1);
    });

    it("blocks after exceeding max requests", () => {
      const key = `test-block-${Date.now()}-${Math.random()}`;
      const config = { windowMs: 60_000, maxRequests: 3 };
      checkRateLimit(key, config);
      checkRateLimit(key, config);
      checkRateLimit(key, config);
      const result = checkRateLimit(key, config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfterMs).toBeGreaterThan(0);
    });

    it("returns different configs for different categories", () => {
      const apiConfig = getRateLimitConfig("api");
      const authConfig = getRateLimitConfig("auth");
      expect(apiConfig.maxRequests).toBeGreaterThan(authConfig.maxRequests);
    });
  });

  describe("CSRF protection", () => {
    it("generates unique tokens", () => {
      const t1 = generateCsrfToken();
      const t2 = generateCsrfToken();
      expect(t1).not.toBe(t2);
    });

    it("validates matching tokens", () => {
      const token = generateCsrfToken();
      expect(validateCsrfToken(token, token)).toBe(true);
    });

    it("rejects mismatched tokens", () => {
      expect(validateCsrfToken("a", "b")).toBe(false);
    });

    it("rejects null tokens", () => {
      expect(validateCsrfToken(null, "token")).toBe(false);
      expect(validateCsrfToken("token", null)).toBe(false);
    });
  });

  describe("security headers", () => {
    it("returns required security headers", () => {
      const headers = getSecurityHeaders();
      expect(headers["X-Content-Type-Options"]).toBe("nosniff");
      expect(headers["X-Frame-Options"]).toBe("DENY");
      expect(headers["X-XSS-Protection"]).toContain("1");
      expect(headers["Referrer-Policy"]).toBeDefined();
      expect(headers["Content-Security-Policy"]).toContain("default-src");
    });
  });

  describe("input sanitization", () => {
    it("escapes HTML entities", () => {
      expect(sanitizeHtml("<script>alert('xss')</script>")).toBe(
        "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;"
      );
    });

    it("escapes quotes", () => {
      expect(sanitizeHtml('"test"')).toBe("&quot;test&quot;");
    });

    it("sanitizes nested objects", () => {
      const input = { name: "<b>test</b>", nested: { value: "<script>" } };
      const output = sanitizeOutput(input) as Record<string, unknown>;
      expect(output.name).toBe("&lt;b&gt;test&lt;/b&gt;");
      expect((output.nested as Record<string, unknown>).value).toBe("&lt;script&gt;");
    });

    it("handles null/undefined gracefully", () => {
      expect(sanitizeOutput(null)).toBeNull();
      expect(sanitizeOutput(undefined)).toBeUndefined();
    });

    it("passes through numbers and booleans", () => {
      expect(sanitizeOutput(42)).toBe(42);
      expect(sanitizeOutput(true)).toBe(true);
    });
  });

  describe("CORS headers", () => {
    it("allows configured origins", () => {
      const headers = getCorsHeaders("http://localhost:3000");
      expect(headers["Access-Control-Allow-Origin"]).toBe("http://localhost:3000");
    });

    it("defaults for unknown origins", () => {
      const headers = getCorsHeaders("http://unknown.com");
      expect(headers["Access-Control-Allow-Origin"]).toBeDefined();
    });
  });

  describe("mutation guards", () => {
    it("allows requests with matching csrf token", () => {
      const request = new Request("http://localhost/api/test", {
        method: "POST",
        headers: { "x-csrf-token": "csrf-ok" },
      });
      expect(
        enforceMutationSecurity(request, {
          csrfToken: "csrf-ok",
          rateLimitKey: `mutation-ok-${Date.now()}`,
        }).ok,
      ).toBe(true);
    });

    it("rejects requests with invalid csrf token", async () => {
      const request = new Request("http://localhost/api/test", {
        method: "POST",
        headers: { "x-csrf-token": "csrf-bad" },
      });
      const result = enforceMutationSecurity(request, {
        csrfToken: "csrf-ok",
        rateLimitKey: `mutation-csrf-${Date.now()}`,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.response.status).toBe(403);
        await expect(result.response.json()).resolves.toMatchObject({ error: expect.stringContaining("CSRF") });
      }
    });

    it("rate limits repeated mutations", async () => {
      const rateLimitKey = `mutation-rate-${Date.now()}`;
      const request = new Request("http://localhost/api/test", { method: "POST" });
      expect(
        enforceMutationSecurity(request, {
          rateLimitKey,
          rateLimitConfig: { windowMs: 60_000, maxRequests: 1 },
        }).ok,
      ).toBe(true);
      const blocked = enforceMutationSecurity(request, {
        rateLimitKey,
        rateLimitConfig: { windowMs: 60_000, maxRequests: 1 },
      });
      expect(blocked.ok).toBe(false);
      if (!blocked.ok) {
        expect(blocked.response.status).toBe(429);
      }
    });
  });

  describe("trusted external urls", () => {
    it("allows https endpoints", () => {
      expect(isTrustedExternalUrl("https://partner.example.com/hook")).toBe(true);
    });

    it("allows localhost over http for local development", () => {
      expect(isTrustedExternalUrl("http://localhost:3000/callback")).toBe(true);
    });

    it("rejects invalid or insecure remote urls", () => {
      expect(isTrustedExternalUrl("http://example.com/callback")).toBe(false);
      expect(isTrustedExternalUrl("not-a-url")).toBe(false);
    });
  });

  describe("IP extraction", () => {
    it("extracts from x-forwarded-for", () => {
      const req = new Request("http://localhost", {
        headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
      });
      expect(getClientIp(req)).toBe("1.2.3.4");
    });

    it("falls back to x-real-ip", () => {
      const req = new Request("http://localhost", {
        headers: { "x-real-ip": "10.0.0.1" },
      });
      expect(getClientIp(req)).toBe("10.0.0.1");
    });

    it("returns unknown when no headers", () => {
      const req = new Request("http://localhost");
      expect(getClientIp(req)).toBe("unknown");
    });
  });
});
