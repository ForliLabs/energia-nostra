import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──

const mockGetCurrentSession = vi.fn();
const mockHasRequiredRole = vi.fn();

vi.mock("@/lib/session", () => ({
  getCurrentSession: (...args: unknown[]) => mockGetCurrentSession(...args),
  hasRequiredRole: (...args: unknown[]) => mockHasRequiredRole(...args),
}));

vi.mock("@/lib/security", () => ({
  enforceMutationSecurity: () => ({ ok: true }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Helpers ──

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

function makeRequest(url = "http://localhost/api/test", init?: RequestInit) {
  return new Request(url, init);
}

function makePostRequest(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── Tests ──

describe("api-handler", () => {
  describe("createApiHandler", () => {
    it("returns 401 when auth is required and no session", async () => {
      mockGetCurrentSession.mockResolvedValue(null);

      const { createApiHandler } = await import("@/lib/api-handler");
      const handler = createApiHandler({
        auth: { required: true },
        handler: async () => ({ data: { ok: true } }),
      });

      const res = await handler(makeRequest());
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Autenticazione richiesta.");
    });

    it("returns 403 when role is not allowed", async () => {
      mockGetCurrentSession.mockResolvedValue(makeMemberSession());
      mockHasRequiredRole.mockReturnValue(false);

      const { createApiHandler } = await import("@/lib/api-handler");
      const handler = createApiHandler({
        auth: { required: true, roles: ["admin"] },
        handler: async () => ({ data: { ok: true } }),
      });

      const res = await handler(makeRequest());
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe("Permessi insufficienti.");
    });

    it("returns 200 with data for authenticated user with correct role", async () => {
      mockGetCurrentSession.mockResolvedValue(makeAdminSession());
      mockHasRequiredRole.mockReturnValue(true);

      const { createApiHandler } = await import("@/lib/api-handler");
      const handler = createApiHandler({
        auth: { required: true, roles: ["admin"] },
        handler: async () => ({ data: { items: [1, 2, 3] } }),
      });

      const res = await handler(makeRequest());
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toEqual([1, 2, 3]);
    });

    it("passes session to handler even when auth is not required", async () => {
      const session = makeMemberSession();
      mockGetCurrentSession.mockResolvedValue(session);

      const { createApiHandler } = await import("@/lib/api-handler");
      let receivedSession: unknown = null;
      const handler = createApiHandler({
        handler: async (ctx) => {
          receivedSession = ctx.session;
          return { data: { ok: true } };
        },
      });

      await handler(makeRequest());
      expect(receivedSession).toEqual(session);
    });

    it("validates body with schema and returns 400 on invalid input", async () => {
      mockGetCurrentSession.mockResolvedValue(makeAdminSession());
      mockHasRequiredRole.mockReturnValue(true);

      const { createApiHandler } = await import("@/lib/api-handler");
      const { string, object } = await import("@/lib/validation");

      const schema = object({ name: string({ min: 2 }) });
      const handler = createApiHandler({
        auth: { required: true, roles: ["admin"] },
        schema,
        handler: async ({ body }) => ({ data: body }),
      });

      const res = await handler(makePostRequest("http://localhost/api/test", { name: "" }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Dati non validi");
      expect(data.details).toBeDefined();
      expect(data.details.length).toBeGreaterThan(0);
    });

    it("passes validated body to handler on valid input", async () => {
      mockGetCurrentSession.mockResolvedValue(makeAdminSession());
      mockHasRequiredRole.mockReturnValue(true);

      const { createApiHandler } = await import("@/lib/api-handler");
      const { string, object } = await import("@/lib/validation");

      const schema = object({ name: string({ min: 2 }) });
      const handler = createApiHandler({
        auth: { required: true, roles: ["admin"] },
        schema,
        handler: async ({ body }) => ({ data: body }),
      });

      const res = await handler(makePostRequest("http://localhost/api/test", { name: "Mario" }));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.name).toBe("Mario");
    });

    it("returns 400 on malformed JSON", async () => {
      mockGetCurrentSession.mockResolvedValue(makeAdminSession());
      mockHasRequiredRole.mockReturnValue(true);

      const { createApiHandler } = await import("@/lib/api-handler");
      const { string, object } = await import("@/lib/validation");

      const schema = object({ name: string() });
      const handler = createApiHandler({
        auth: { required: true },
        schema,
        handler: async ({ body }) => ({ data: body }),
      });

      const req = new Request("http://localhost/api/test", {
        method: "POST",
        body: "not json{{{",
      });
      const res = await handler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("JSON malformato");
    });

    it("returns custom status code from handler", async () => {
      mockGetCurrentSession.mockResolvedValue(null);

      const { createApiHandler } = await import("@/lib/api-handler");
      const handler = createApiHandler({
        handler: async () => ({ data: { id: "new-1" }, status: 201 }),
      });

      const res = await handler(makeRequest());
      expect(res.status).toBe(201);
    });

    it("catches ApiError thrown by handler", async () => {
      mockGetCurrentSession.mockResolvedValue(makeAdminSession());

      const { createApiHandler, ApiError } = await import("@/lib/api-handler");
      const handler = createApiHandler({
        handler: async () => {
          throw new ApiError(409, "Conflitto risorsa", ["Duplicato"]);
        },
      });

      const res = await handler(makeRequest());
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toBe("Conflitto risorsa");
      expect(data.details).toEqual(["Duplicato"]);
    });

    it("returns 500 on unexpected errors", async () => {
      mockGetCurrentSession.mockResolvedValue(null);

      const { createApiHandler } = await import("@/lib/api-handler");
      const handler = createApiHandler({
        handler: async () => {
          throw new Error("Database connection lost");
        },
      });

      // Suppress console.error in test output
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const res = await handler(makeRequest());
      consoleSpy.mockRestore();

      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toContain("Errore interno");
    });

    it("allows handler to return a raw Response", async () => {
      mockGetCurrentSession.mockResolvedValue(null);

      const { createApiHandler } = await import("@/lib/api-handler");
      const handler = createApiHandler({
        handler: async () => {
          return Response.json({ custom: true }, { status: 299 });
        },
      });

      const res = await handler(makeRequest());
      expect(res.status).toBe(299);
      const data = await res.json();
      expect(data.custom).toBe(true);
    });

    it("provides searchParams to handler", async () => {
      mockGetCurrentSession.mockResolvedValue(null);

      const { createApiHandler } = await import("@/lib/api-handler");
      let capturedParams: URLSearchParams | null = null;
      const handler = createApiHandler({
        handler: async (ctx) => {
          capturedParams = ctx.searchParams;
          return { data: { ok: true } };
        },
      });

      await handler(makeRequest("http://localhost/api/test?view=summary&limit=10"));
      expect(capturedParams!.get("view")).toBe("summary");
      expect(capturedParams!.get("limit")).toBe("10");
    });
  });
});
