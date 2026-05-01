import { describe, it, expect } from "vitest";
import {
  authenticateUser,
  registerUser,
  createSession,
  deleteSession,
  requireRole,
  verifyPassword,
  createPasswordHash,
} from "@/lib/auth";

describe("auth", () => {
  describe("password hashing", () => {
    it("hashes and verifies password", async () => {
      const hash = await createPasswordHash("testPassword123");
      expect(hash).toBeDefined();
      expect(typeof hash).toBe("string");
      const valid = await verifyPassword("testPassword123", hash);
      expect(valid).toBe(true);
    });

    it("rejects wrong password", async () => {
      const hash = await createPasswordHash("correct");
      const valid = await verifyPassword("wrong", hash);
      expect(valid).toBe(false);
    });
  });

  describe("authentication", () => {
    it("authenticates demo admin user", async () => {
      const user = await authenticateUser("admin@energianostra.it", "demo2025");
      expect(user).not.toBeNull();
      expect(user?.role).toBe("admin");
      expect(user?.email).toBe("admin@energianostra.it");
    });

    it("authenticates demo member user", async () => {
      const user = await authenticateUser("membro@energianostra.it", "demo2025");
      expect(user).not.toBeNull();
      expect(user?.role).toBe("member");
    });

    it("rejects invalid credentials", async () => {
      const user = await authenticateUser("admin@energianostra.it", "wrong");
      expect(user).toBeNull();
    });

    it("rejects unknown email", async () => {
      const user = await authenticateUser("unknown@example.com", "demo2025");
      expect(user).toBeNull();
    });
  });

  describe("registration", () => {
    it("registers new user", async () => {
      const email = `test-${Date.now()}@example.com`;
      const user = await registerUser(email, "password123", "Test User");
      expect(user).not.toBeNull();
      expect(user?.email).toBe(email);
      expect(user?.role).toBe("member");
    });

    it("rejects duplicate email", async () => {
      const user = await registerUser("admin@energianostra.it", "pass", "Dup");
      expect(user).toBeNull();
    });
  });

  describe("sessions", () => {
    it("creates and uses session", () => {
      const sessionId = createSession("user-admin-1");
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe("string");
    });

    it("deletes session without error", () => {
      const sessionId = createSession("user-admin-1");
      expect(() => deleteSession(sessionId)).not.toThrow();
    });
  });

  describe("role checking", () => {
    it("allows admin in admin-allowed roles", () => {
      expect(requireRole("admin", ["admin", "superadmin"])).toBe(true);
    });

    it("rejects member from admin-only", () => {
      expect(requireRole("member", ["admin", "superadmin"])).toBe(false);
    });

    it("allows superadmin everywhere", () => {
      expect(requireRole("superadmin", ["admin", "superadmin"])).toBe(true);
    });
  });
});
