/**
 * Shared API Route Handler — Structured error handling, auth gating, and response hygiene.
 *
 * Provides a `createApiHandler` factory that wraps route handler functions with
 * consistent authentication, role-based authorization, request body validation,
 * structured error responses, and response sanitization.
 *
 * @module api-handler
 *
 * @example
 * ```ts
 * import { createApiHandler } from "@/lib/api-handler";
 * import { schemas } from "@/lib/validation";
 *
 * export const GET = createApiHandler({
 *   auth: { required: true, roles: ["admin", "member"] },
 *   handler: async ({ session }) => {
 *     const data = await fetchData(session.user.cerId);
 *     return { data };
 *   },
 * });
 *
 * export const POST = createApiHandler({
 *   auth: { required: true, roles: ["admin"] },
 *   schema: schemas.memberCreate,
 *   handler: async ({ session, body }) => {
 *     const member = await createMember(body);
 *     return { data: member, status: 201 };
 *   },
 * });
 * ```
 */

import { getCurrentSession, hasRequiredRole, type CurrentSession, type AppUserRole } from "@/lib/session";
import { enforceMutationSecurity } from "@/lib/security";
import type { Schema, ValidationResult } from "@/lib/validation";

// ── Types ──

/** Auth configuration for an API handler. */
export interface ApiAuthConfig {
  /** Whether authentication is required. Defaults to `false`. */
  required: boolean;
  /** Allowed roles. If omitted, any authenticated user is allowed. */
  roles?: AppUserRole[];
}

/** Context passed to the handler function. */
export interface ApiHandlerContext<T = unknown> {
  /** The incoming request. */
  request: Request;
  /** The authenticated session, or `null` if auth is not required. */
  session: CurrentSession | null;
  /** Validated request body (only present when a schema is provided). */
  body: T;
  /** Parsed URL search params. */
  searchParams: URLSearchParams;
}

/** Value returned by a handler function. */
export interface ApiHandlerResult {
  /** The response data (will be JSON-serialized). */
  data: unknown;
  /** HTTP status code. Defaults to 200. */
  status?: number;
  /** Additional response headers. */
  headers?: Record<string, string>;
}

/** Configuration for `createApiHandler`. */
export interface ApiHandlerConfig<T = unknown> {
  /** Auth requirements. If omitted, no auth check is performed. */
  auth?: ApiAuthConfig;
  /** Validation schema for the request body (POST/PUT/PATCH/DELETE). */
  schema?: Schema<T>;
  /** Whether to enforce mutation security (rate limiting, CSRF). Defaults to `true` for mutation methods. */
  enforceSecurity?: boolean;
  /** The actual handler logic. */
  handler: (ctx: ApiHandlerContext<T>) => Promise<ApiHandlerResult | Response>;
}

// ── Error Classes ──

/**
 * Structured API error with HTTP status code and optional details.
 *
 * Throw this from handler functions for consistent error responses.
 *
 * @example
 * ```ts
 * throw new ApiError(404, "Membro non trovato.");
 * ```
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: string[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ── Internal Helpers ──

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function isMutationMethod(method: string): boolean {
  return MUTATION_METHODS.has(method.toUpperCase());
}

function errorResponse(status: number, error: string, details?: string[]): Response {
  const body: Record<string, unknown> = { error };
  if (details?.length) body.details = details;
  return Response.json(body, { status });
}

async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    const text = await request.text();
    if (!text.trim()) return {};
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// ── Factory ──

/**
 * Create a Next.js route handler with built-in auth, validation, and error handling.
 *
 * The returned function has the standard `(request: Request) => Promise<Response>`
 * signature expected by Next.js App Router route files.
 *
 * @param config - Handler configuration including auth, schema, and handler function.
 * @returns A route handler function.
 */
export function createApiHandler<T = unknown>(
  config: ApiHandlerConfig<T>,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    try {
      // 1. Auth check
      let session: CurrentSession | null = null;
      if (config.auth?.required) {
        session = await getCurrentSession();
        if (!session) {
          return errorResponse(401, "Autenticazione richiesta.");
        }
        if (config.auth.roles?.length && !hasRequiredRole(session, config.auth.roles)) {
          return errorResponse(403, "Permessi insufficienti.");
        }
      } else {
        // Opportunistically load session even when not required
        session = await getCurrentSession();
      }

      // 2. Mutation security (rate limiting, CSRF)
      const shouldEnforceSecurity = config.enforceSecurity ?? isMutationMethod(request.method);
      if (shouldEnforceSecurity && session) {
        const guard = enforceMutationSecurity(request, {
          csrfToken: session.source === "production" ? session.csrfToken ?? null : null,
          rateLimitKey: session.user.id,
        });
        if (!guard.ok) {
          return guard.response;
        }
      }

      // 3. Body parsing & validation
      let body: T = undefined as T;
      if (config.schema && isMutationMethod(request.method)) {
        const raw = await parseJsonBody(request);
        if (raw === null) {
          return errorResponse(400, "Corpo della richiesta non valido (JSON malformato).");
        }
        const result: ValidationResult<T> = config.schema.safeParse(raw);
        if (!result.success) {
          return errorResponse(400, "Dati non validi", result.errors);
        }
        body = result.data;
      }

      // 4. Execute handler
      const { searchParams } = new URL(request.url);
      const result = await config.handler({ request, session, body, searchParams });

      // Handler can return a raw Response for full control
      if (result instanceof Response) {
        return result;
      }

      return Response.json(result.data, {
        status: result.status ?? 200,
        headers: result.headers,
      });
    } catch (err) {
      // Structured error from handler
      if (err instanceof ApiError) {
        return errorResponse(err.status, err.message, err.details);
      }

      // Unexpected error — log and return generic 500
      console.error("[api-handler] Unhandled error:", err);
      const message =
        process.env.NODE_ENV === "production"
          ? "Errore interno del server."
          : `Errore interno: ${err instanceof Error ? err.message : String(err)}`;
      return errorResponse(500, message);
    }
  };
}
