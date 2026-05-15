import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──

const mockGetCurrentSession = vi.fn();
const mockHasRequiredRole = vi.fn();

vi.mock("@/lib/session", () => ({
  getCurrentSession: (...args: unknown[]) => mockGetCurrentSession(...args),
  hasRequiredRole: (...args: unknown[]) => mockHasRequiredRole(...args),
  resolveSessionCerId: () => "cer-bertinoro",
  canAccessCer: () => true,
}));

vi.mock("@/lib/security", () => ({
  enforceMutationSecurity: () => ({ ok: true }),
}));

vi.mock("@/lib/data-db", () => ({
  getCerProfile: vi.fn().mockResolvedValue({ id: "cer-bertinoro", name: "CER Bertinoro" }),
  getMembers: vi.fn().mockResolvedValue([
    { id: "m1", name: "Mario", type: "prosumer", podCode: "IT001E12345678", energyBalanceKwh: 100 },
  ]),
  getEnergyData: vi.fn().mockResolvedValue([{ month: "2025-01", totalKwh: 1000 }]),
  getEnergySummary: vi.fn().mockResolvedValue({ totalProduction: 5000, totalConsumption: 3000 }),
  createMember: vi.fn().mockResolvedValue({ id: "m2", name: "Luigi", type: "prosumer", podCode: "IT001E99999999", energyBalanceKwh: 0 }),
  memberExistsByPod: vi.fn().mockResolvedValue(false),
  checkDatabaseHealth: vi.fn().mockResolvedValue({ connected: true, latencyMs: 5 }),
}));

vi.mock("@/lib/notifications", () => ({
  getNotifications: vi.fn().mockResolvedValue([{ id: "n1", title: "Test", read: false }]),
  getUnreadCount: vi.fn().mockResolvedValue(3),
  markAsRead: vi.fn().mockResolvedValue(undefined),
  markAllAsRead: vi.fn().mockResolvedValue(undefined),
  subscribePush: vi.fn().mockResolvedValue(undefined),
  unsubscribePush: vi.fn().mockResolvedValue(undefined),
  getNotificationPreferences: vi.fn().mockResolvedValue([]),
  updateNotificationPreference: vi.fn().mockResolvedValue(undefined),
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

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Energy Route ──

describe("energy route", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetCurrentSession.mockResolvedValue(null);
    const { GET } = await import("@/app/api/energy/route");
    const res = await GET(new Request("http://localhost/api/energy"));
    expect(res.status).toBe(401);
  });

  it("returns energy data for authenticated member", async () => {
    mockGetCurrentSession.mockResolvedValue(makeMemberSession());
    mockHasRequiredRole.mockReturnValue(true);
    const { GET } = await import("@/app/api/energy/route");
    const res = await GET(new Request("http://localhost/api/energy"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("cer");
    expect(body).toHaveProperty("months");
    expect(body).toHaveProperty("totals");
    expect(body).toHaveProperty("memberBreakdown");
  });

  it("returns 403 for unauthorized role", async () => {
    mockGetCurrentSession.mockResolvedValue(makeMemberSession());
    mockHasRequiredRole.mockReturnValue(false);
    const { GET } = await import("@/app/api/energy/route");
    const res = await GET(new Request("http://localhost/api/energy"));
    expect(res.status).toBe(403);
  });
});

// ── Members Route ──

describe("members route", () => {
  describe("GET", () => {
    it("returns 401 when not authenticated", async () => {
      mockGetCurrentSession.mockResolvedValue(null);
      const { GET } = await import("@/app/api/members/route");
      const res = await GET(new Request("http://localhost/api/members"));
      expect(res.status).toBe(401);
    });

    it("returns members list for authenticated user", async () => {
      mockGetCurrentSession.mockResolvedValue(makeMemberSession());
      mockHasRequiredRole.mockReturnValue(true);
      const { GET } = await import("@/app/api/members/route");
      const res = await GET(new Request("http://localhost/api/members"));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
    });
  });

  describe("POST", () => {
    it("returns 401 when not authenticated", async () => {
      mockGetCurrentSession.mockResolvedValue(null);
      const { POST } = await import("@/app/api/members/route");
      const req = new Request("http://localhost/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test", fiscalCode: "RSSMRA80A01D704Z", email: "t@t.it", pod: "IT001E12345678" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("returns 403 for non-admin users", async () => {
      mockGetCurrentSession.mockResolvedValue(makeMemberSession());
      mockHasRequiredRole.mockReturnValue(false);
      const { POST } = await import("@/app/api/members/route");
      const req = new Request("http://localhost/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test", fiscalCode: "RSSMRA80A01D704Z", email: "t@t.it", pod: "IT001E12345678" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(403);
    });

    it("validates request body (rejects invalid fiscal code)", async () => {
      mockGetCurrentSession.mockResolvedValue(makeAdminSession());
      mockHasRequiredRole.mockReturnValue(true);
      const { POST } = await import("@/app/api/members/route");
      const req = new Request("http://localhost/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test", fiscalCode: "INVALID", email: "t@t.it", pod: "IT001E12345678" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.details).toBeDefined();
    });
  });
});

// ── Notifications Route ──

describe("notifications route", () => {
  describe("GET", () => {
    it("returns 401 when not authenticated", async () => {
      mockGetCurrentSession.mockResolvedValue(null);
      const { GET } = await import("@/app/api/notifications/route");
      const res = await GET(new Request("http://localhost/api/notifications"));
      expect(res.status).toBe(401);
    });

    it("returns notifications for authenticated user", async () => {
      mockGetCurrentSession.mockResolvedValue(makeMemberSession());
      const { GET } = await import("@/app/api/notifications/route");
      const res = await GET(new Request("http://localhost/api/notifications"));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty("notifications");
    });

    it("returns unread count when view=unread-count", async () => {
      mockGetCurrentSession.mockResolvedValue(makeMemberSession());
      const { GET } = await import("@/app/api/notifications/route");
      const res = await GET(new Request("http://localhost/api/notifications?view=unread-count"));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty("count");
      expect(body.count).toBe(3);
    });
  });

  describe("POST", () => {
    it("returns 401 when not authenticated", async () => {
      mockGetCurrentSession.mockResolvedValue(null);
      const { POST } = await import("@/app/api/notifications/route");
      const req = new Request("http://localhost/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-read", notificationId: "n1" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("marks notification as read for authenticated user", async () => {
      mockGetCurrentSession.mockResolvedValue(makeMemberSession());
      const { POST } = await import("@/app/api/notifications/route");
      const req = new Request("http://localhost/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-read", notificationId: "n1" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it("returns 400 for unknown action", async () => {
      mockGetCurrentSession.mockResolvedValue(makeMemberSession());
      const { POST } = await import("@/app/api/notifications/route");
      const req = new Request("http://localhost/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unknown-action" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 when mark-read missing notificationId", async () => {
      mockGetCurrentSession.mockResolvedValue(makeMemberSession());
      const { POST } = await import("@/app/api/notifications/route");
      const req = new Request("http://localhost/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-read" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });
});

// ── Health Route ──

describe("health route", () => {
  it("returns health data without authentication", async () => {
    mockGetCurrentSession.mockResolvedValue(null);
    const { GET } = await import("@/app/api/health/route");
    const res = await GET(new Request("http://localhost/api/health"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("healthy");
    expect(body).toHaveProperty("database");
    expect(body).toHaveProperty("memory");
    expect(body).toHaveProperty("services");
  });

  it("returns 503 when database is unhealthy", async () => {
    mockGetCurrentSession.mockResolvedValue(null);
    const { checkDatabaseHealth } = await import("@/lib/data-db");
    vi.mocked(checkDatabaseHealth).mockResolvedValueOnce({ connected: false, tables: 0, error: "db unavailable" });
    const { GET } = await import("@/app/api/health/route");
    const res = await GET(new Request("http://localhost/api/health"));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.status).toBe("unhealthy");
  });
});
