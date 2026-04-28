import { describe, it, expect } from "vitest";
import {
  hashPasswordProduction,
  verifyPasswordProduction,
  validatePassword,
  generateCsrfToken,
  validateCsrfToken,
  checkRateLimit,
  resetRateLimit,
} from "@/lib/auth-production";

describe("auth-production", () => {
  describe("password hashing (PBKDF2)", () => {
    it("hashes password with pbkdf2 prefix", async () => {
      const hash = await hashPasswordProduction("TestPassword123!");
      expect(hash).toMatch(/^pbkdf2:\d+:[a-f0-9]+:[a-f0-9]+$/);
    });

    it("produces different hashes for same password (unique salt)", async () => {
      const hash1 = await hashPasswordProduction("TestPassword123!");
      const hash2 = await hashPasswordProduction("TestPassword123!");
      expect(hash1).not.toBe(hash2);
    });

    it("verifies correct password against hash", async () => {
      const hash = await hashPasswordProduction("MySecurePassword1!");
      const result = await verifyPasswordProduction("MySecurePassword1!", hash);
      expect(result).toBe(true);
    });

    it("rejects incorrect password", async () => {
      const hash = await hashPasswordProduction("MySecurePassword1!");
      const result = await verifyPasswordProduction("WrongPassword", hash);
      expect(result).toBe(false);
    });

    it("supports legacy SHA-256 hash verification", async () => {
      // Simulate the old SHA-256 hash for "demo2025"
      const encoder = new TextEncoder();
      const data = encoder.encode("demo2025" + "energia-nostra-salt-2025");
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const legacyHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0")).join("");

      const result = await verifyPasswordProduction("demo2025", legacyHash);
      expect(result).toBe(true);
    });
  });

  describe("password validation", () => {
    it("accepts strong password", () => {
      const result = validatePassword("MyStr0ng!Pass");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("rejects short password", () => {
      const result = validatePassword("Ab1!");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("La password deve avere almeno 8 caratteri");
    });

    it("rejects password without uppercase", () => {
      const result = validatePassword("mypassword1!");
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("maiuscola"))).toBe(true);
    });

    it("rejects password without number", () => {
      const result = validatePassword("MyPassword!");
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("numero"))).toBe(true);
    });

    it("rejects password without special character", () => {
      const result = validatePassword("MyPassword1");
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("speciale"))).toBe(true);
    });
  });

  describe("CSRF tokens", () => {
    it("generates unique tokens", () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      expect(token1).not.toBe(token2);
      expect(token1).toHaveLength(64); // 32 bytes hex
    });

    it("validates matching tokens", () => {
      const token = generateCsrfToken();
      expect(validateCsrfToken(token, token)).toBe(true);
    });

    it("rejects mismatched tokens", () => {
      expect(validateCsrfToken("wrong", "right")).toBe(false);
    });

    it("rejects null token", () => {
      expect(validateCsrfToken(null, "session-token")).toBe(false);
    });
  });

  describe("rate limiting", () => {
    it("allows first attempt", () => {
      const id = `test-${Date.now()}`;
      const result = checkRateLimit(id);
      expect(result.allowed).toBe(true);
    });

    it("blocks after max attempts", () => {
      const id = `test-block-${Date.now()}`;
      for (let i = 0; i < 5; i++) {
        checkRateLimit(id);
      }
      const result = checkRateLimit(id);
      expect(result.allowed).toBe(false);
      expect(result.retryAfterMs).toBeGreaterThan(0);
    });

    it("resets rate limit", () => {
      const id = `test-reset-${Date.now()}`;
      for (let i = 0; i < 5; i++) {
        checkRateLimit(id);
      }
      resetRateLimit(id);
      const result = checkRateLimit(id);
      expect(result.allowed).toBe(true);
    });
  });
});
