import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the session layer
const mockGetCurrentSession = vi.fn();
const mockHasRequiredRole = vi.fn();

vi.mock("@/lib/session", () => ({
  getCurrentSession: (...args: unknown[]) => mockGetCurrentSession(...args),
  hasRequiredRole: (...args: unknown[]) => mockHasRequiredRole(...args),
}));

// Mock enforceMutationSecurity to always pass
vi.mock("@/lib/security", () => ({
  enforceMutationSecurity: () => ({ ok: true }),
}));

// Mock api-platform functions
vi.mock("@/lib/api-platform", () => ({
  getApiKeys: vi.fn().mockResolvedValue([]),
  getApiUsageStats: vi.fn().mockResolvedValue({ totalCalls: 0, callsToday: 0, avgLatencyMs: 0, errorRate: 0, topEndpoints: [] }),
  createApiKey: vi.fn().mockResolvedValue({ id: "key-1", name: "test", keyPrefix: "en_" }),
  revokeApiKey: vi.fn().mockResolvedValue(undefined),
  getOpenApiSpec: vi.fn().mockReturnValue({ openapi: "3.0.0" }),
}));

// Mock GDPR functions
vi.mock("@/lib/gdpr", () => ({
  getConsents: vi.fn().mockReturnValue([{ purpose: "essential", granted: true }]),
  setConsent: vi.fn().mockReturnValue({ purpose: "analytics", granted: true }),
  exportUserData: vi.fn().mockResolvedValue({ exportId: "exp-1", userId: "u1", format: "json", data: { consents: [] } }),
  eraseUserData: vi.fn().mockResolvedValue({ userId: "u1", erasedAt: new Date().toISOString(), auditLogId: "a1" }),
}));

// Mock validation
vi.mock("@/lib/validation", () => ({
  schemas: {
    consent: {},
    gdprErasure: {},
  },
  validateBody: vi.fn().mockReturnValue({ success: true, data: {} }),
  validationErrorResponse: vi.fn().mockReturnValue(Response.json({ errors: ["validation"] }, { status: 400 })),
}));

function makeAdminSession() {
  return {
    user: { id: "user-admin-1", email: "admin@energianostra.it", name: "Admin", role: "admin", cerId: "cer-bertinoro", authProvider: "legacy" },
    sessionId: "sess-1",
    source: "legacy" as const,
  };
}

function makeMemberSession() {
  return {
    user: { id: "user-member-1", email: "member@energianostra.it", name: "Member", role: "member", cerId: "cer-bertinoro", authProvider: "legacy" },
    sessionId: "sess-2",
    source: "legacy" as const,
  };
}

function makeSuperadminSession() {
  return {
    user: { id: "user-super-1", email: "super@energianostra.it", name: "Super", role: "superadmin", cerId: null, authProvider: "legacy" },
    sessionId: "sess-3",
    source: "legacy" as const,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── API Keys Route ──

describe("api-keys route", () => {
  describe("GET", () => {
    it("returns 401 when not authenticated", async () => {
      mockGetCurrentSession.mockResolvedValue(null);
      const { GET } = await import("@/app/api/api-keys/route");
      const res = await GET(new Request("http://localhost/api/api-keys"));
      expect(res.status).toBe(401);
    });

    it("returns 403 for non-admin users", async () => {
      const session = makeMemberSession();
      mockGetCurrentSession.mockResolvedValue(session);
      mockHasRequiredRole.mockReturnValue(false);
      const { GET } = await import("@/app/api/api-keys/route");
      const res = await GET(new Request("http://localhost/api/api-keys"));
      expect(res.status).toBe(403);
    });

    it("returns keys and stats for admin", async () => {
      const session = makeAdminSession();
      mockGetCurrentSession.mockResolvedValue(session);
      mockHasRequiredRole.mockReturnValue(true);
      const { GET } = await import("@/app/api/api-keys/route");
      const res = await GET(new Request("http://localhost/api/api-keys"));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty("keys");
      expect(body).toHaveProperty("stats");
    });

    it("returns OpenAPI spec without auth for ?view=spec", async () => {
      const { GET } = await import("@/app/api/api-keys/route");
      const res = await GET(new Request("http://localhost/api/api-keys?view=spec"));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty("openapi");
    });

    it("returns stats for admin with ?view=stats", async () => {
      const session = makeAdminSession();
      mockGetCurrentSession.mockResolvedValue(session);
      mockHasRequiredRole.mockReturnValue(true);
      const { GET } = await import("@/app/api/api-keys/route");
      const res = await GET(new Request("http://localhost/api/api-keys?view=stats"));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty("stats");
    });
  });

  describe("POST", () => {
    it("returns 401 when not authenticated", async () => {
      mockGetCurrentSession.mockResolvedValue(null);
      const { POST } = await import("@/app/api/api-keys/route");
      const req = new Request("http://localhost/api/api-keys", {
        method: "POST",
        body: JSON.stringify({ action: "create", name: "test", scopes: ["read"] }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("returns 403 for non-admin users", async () => {
      const session = makeMemberSession();
      mockGetCurrentSession.mockResolvedValue(session);
      mockHasRequiredRole.mockReturnValue(false);
      const { POST } = await import("@/app/api/api-keys/route");
      const req = new Request("http://localhost/api/api-keys", {
        method: "POST",
        body: JSON.stringify({ action: "create", name: "test", scopes: ["read"] }),
      });
      const res = await POST(req);
      expect(res.status).toBe(403);
    });
  });
});

// ── GDPR Consent Route ──

describe("gdpr/consent route", () => {
  describe("GET", () => {
    it("returns 401 when not authenticated", async () => {
      mockGetCurrentSession.mockResolvedValue(null);
      const { GET } = await import("@/app/api/gdpr/consent/route");
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it("returns consents for authenticated user", async () => {
      mockGetCurrentSession.mockResolvedValue(makeMemberSession());
      const { GET } = await import("@/app/api/gdpr/consent/route");
      const res = await GET();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty("consents");
    });
  });

  describe("POST", () => {
    it("returns 401 when not authenticated", async () => {
      mockGetCurrentSession.mockResolvedValue(null);
      const { validateBody } = await import("@/lib/validation");
      const { POST } = await import("@/app/api/gdpr/consent/route");
      const req = new Request("http://localhost/api/gdpr/consent", {
        method: "POST",
        body: JSON.stringify({ purpose: "analytics", granted: true }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
      // Should not reach validation if unauthenticated
      expect(validateBody).not.toHaveBeenCalled();
    });
  });
});

// ── GDPR Export Route ──

describe("gdpr/export route", () => {
  describe("GET", () => {
    it("returns 401 when not authenticated", async () => {
      mockGetCurrentSession.mockResolvedValue(null);
      const { GET } = await import("@/app/api/gdpr/export/route");
      const res = await GET(new Request("http://localhost/api/gdpr/export"));
      expect(res.status).toBe(401);
    });

    it("allows user to export own data", async () => {
      const session = makeMemberSession();
      mockGetCurrentSession.mockResolvedValue(session);
      const { GET } = await import("@/app/api/gdpr/export/route");
      const res = await GET(new Request(`http://localhost/api/gdpr/export?userId=${session.user.id}`));
      expect(res.status).toBe(200);
    });

    it("returns 403 when member tries to export another user's data", async () => {
      mockGetCurrentSession.mockResolvedValue(makeMemberSession());
      mockHasRequiredRole.mockReturnValue(false);
      const { GET } = await import("@/app/api/gdpr/export/route");
      const res = await GET(new Request("http://localhost/api/gdpr/export?userId=other-user"));
      expect(res.status).toBe(403);
    });

    it("allows admin to export another user's data", async () => {
      mockGetCurrentSession.mockResolvedValue(makeAdminSession());
      mockHasRequiredRole.mockReturnValue(true);
      const { GET } = await import("@/app/api/gdpr/export/route");
      const res = await GET(new Request("http://localhost/api/gdpr/export?userId=other-user"));
      expect(res.status).toBe(200);
    });
  });
});

// ── GDPR Erasure Route ──

describe("gdpr/erasure route", () => {
  describe("POST", () => {
    it("returns 401 when not authenticated", async () => {
      mockGetCurrentSession.mockResolvedValue(null);
      const { POST } = await import("@/app/api/gdpr/erasure/route");
      const req = new Request("http://localhost/api/gdpr/erasure", {
        method: "POST",
        body: JSON.stringify({ userId: "u1", confirmation: "ELIMINA" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("returns 403 when member tries to erase another user", async () => {
      mockGetCurrentSession.mockResolvedValue(makeMemberSession());
      const { validateBody } = await import("@/lib/validation");
      vi.mocked(validateBody).mockReturnValue({ success: true, data: { userId: "other-user", confirmation: "ELIMINA" } });
      const { POST } = await import("@/app/api/gdpr/erasure/route");
      const req = new Request("http://localhost/api/gdpr/erasure", {
        method: "POST",
        body: JSON.stringify({ userId: "other-user", confirmation: "ELIMINA" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(403);
    });

    it("allows superadmin to erase another user", async () => {
      mockGetCurrentSession.mockResolvedValue(makeSuperadminSession());
      const { validateBody } = await import("@/lib/validation");
      vi.mocked(validateBody).mockReturnValue({ success: true, data: { userId: "other-user", confirmation: "ELIMINA" } });
      const { POST } = await import("@/app/api/gdpr/erasure/route");
      const req = new Request("http://localhost/api/gdpr/erasure", {
        method: "POST",
        body: JSON.stringify({ userId: "other-user", confirmation: "ELIMINA" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
    });

    it("returns 400 when confirmation is wrong", async () => {
      const session = makeMemberSession();
      mockGetCurrentSession.mockResolvedValue(session);
      const { validateBody } = await import("@/lib/validation");
      vi.mocked(validateBody).mockReturnValue({ success: true, data: { userId: session.user.id, confirmation: "WRONG" } });
      const { POST } = await import("@/app/api/gdpr/erasure/route");
      const req = new Request("http://localhost/api/gdpr/erasure", {
        method: "POST",
        body: JSON.stringify({ userId: session.user.id, confirmation: "WRONG" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });
});
