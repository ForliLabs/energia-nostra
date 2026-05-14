/**
 * Security — Rate limiting, CSRF protection, input sanitization, and security headers.
 *
 * Provides production hardening utilities for all API routes and dashboard pages.
 * Rate limiting uses an in-memory sliding window; swap to Redis-backed storage
 * in production for multi-instance deployments.
 *
 * @module security
 */

// ── Rate Limiting (in-memory sliding window, Redis-backed in production) ──

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/** Configuration for a rate limit window. */
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const RATE_LIMIT_DEFAULTS: Record<string, RateLimitConfig> = {
  api: { windowMs: 60_000, maxRequests: 100 },
  auth: { windowMs: 60_000, maxRequests: 10 },
  upload: { windowMs: 60_000, maxRequests: 5 },
  public: { windowMs: 60_000, maxRequests: 200 },
};

/**
 * Get the rate limit configuration for a request category.
 *
 * @param category - One of `"api"`, `"auth"`, `"upload"`, `"public"`.
 * @returns The rate limit config for the category, falling back to `api` defaults.
 */
export function getRateLimitConfig(category: string): RateLimitConfig {
  return RATE_LIMIT_DEFAULTS[category] || RATE_LIMIT_DEFAULTS.api;
}

/** Result of a rate limit check. */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
}

export interface MutationSecurityOptions {
  csrfToken?: string | null;
  rateLimitCategory?: string;
  rateLimitConfig?: RateLimitConfig;
  rateLimitKey?: string;
}

/**
 * Check whether a request is allowed under the rate limit.
 *
 * Uses an in-memory sliding window counter. The first request in a window
 * resets the counter; subsequent requests increment it until `maxRequests`
 * is reached.
 *
 * @param key - A unique identifier for the client (e.g., IP address or user ID).
 * @param config - Rate limit configuration (window size, max requests).
 * @returns Whether the request is allowed and remaining quota.
 *
 * @example
 * ```ts
 * const config = getRateLimitConfig("auth");
 * const result = checkRateLimit(clientIp, config);
 * if (!result.allowed) {
 *   return Response.json({ error: "Too many requests" }, { status: 429 });
 * }
 * ```
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs, retryAfterMs: 0 };
  }

  entry.count++;
  if (entry.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt, retryAfterMs: entry.resetAt - now };
  }

  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt, retryAfterMs: 0 };
}

// Periodic cleanup of expired entries
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore) {
      if (now > entry.resetAt) rateLimitStore.delete(key);
    }
  }, 60_000);
}

// ── CSRF Protection ──

/**
 * Generate a random CSRF token (UUID v4).
 *
 * @returns A unique CSRF token to be stored in the session and sent as a header.
 */
export function generateCsrfToken(): string {
  return crypto.randomUUID();
}

/**
 * Validate that a CSRF token from the request matches the session token.
 *
 * @param requestToken - Token from the `X-CSRF-Token` header.
 * @param sessionToken - Token stored in the server session.
 * @returns `true` if both tokens are present and match.
 */
export function validateCsrfToken(requestToken: string | null, sessionToken: string | null): boolean {
  if (!requestToken || !sessionToken) return false;
  return requestToken === sessionToken;
}

export function enforceMutationSecurity(
  request: Request,
  options: MutationSecurityOptions = {},
): { ok: true } | { ok: false; response: Response } {
  const rateLimitConfig = options.rateLimitConfig || getRateLimitConfig(options.rateLimitCategory || "api");
  const pathname = new URL(request.url).pathname;
  const rateLimitKey = options.rateLimitKey || `${request.method}:${pathname}:${getClientIp(request)}`;
  const rateLimit = checkRateLimit(rateLimitKey, rateLimitConfig);

  if (!rateLimit.allowed) {
    return {
      ok: false,
      response: Response.json(
        { error: "Troppe richieste in pochi secondi. Riprova tra poco." },
        {
          status: 429,
          headers: {
            "Retry-After": Math.max(1, Math.ceil(rateLimit.retryAfterMs / 1000)).toString(),
          },
        },
      ),
    };
  }

  if (options.csrfToken && !validateCsrfToken(request.headers.get("x-csrf-token"), options.csrfToken)) {
    return {
      ok: false,
      response: Response.json({ error: "Token CSRF non valido o mancante." }, { status: 403 }),
    };
  }

  return { ok: true };
}

// ── Security Headers ──

/**
 * Build a complete set of security response headers.
 *
 * Includes CSP, HSTS (production only), X-Frame-Options, and more.
 *
 * @returns An object of header name → value pairs.
 */
export function getSecurityHeaders(): Record<string, string> {
  const isDev = process.env.NODE_ENV !== "production";

  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(self), payment=(self)",
    "Strict-Transport-Security": isDev ? "" : "max-age=63072000; includeSubDomains; preload",
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://re.jrc.ec.europa.eu https://api.stripe.com",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
    ].join("; "),
  };
}

// ── Input Sanitization ──

/**
 * Sanitize a string by escaping HTML entities to prevent XSS.
 *
 * Escapes `&`, `<`, `>`, `"`, and `'`.
 *
 * @param input - Raw user input string.
 * @returns HTML-safe string.
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Recursively sanitize all string values in a data structure.
 *
 * In production, also strips sensitive fields (`passwordHash`, `stack`).
 *
 * @param data - Any JSON-serializable value.
 * @returns A deep copy with all strings HTML-escaped.
 */
export function sanitizeOutput(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data === "string") return sanitizeHtml(data);
  if (Array.isArray(data)) return data.map(sanitizeOutput);
  if (typeof data === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      // Strip internal fields in production
      if (process.env.NODE_ENV === "production" && (key === "passwordHash" || key === "stack")) continue;
      sanitized[key] = sanitizeOutput(value);
    }
    return sanitized;
  }
  return data;
}

// ── CORS Configuration ──

const ALLOWED_ORIGINS_DEFAULT = [
  "http://localhost:3000",
  "https://energianostra.it",
  "https://demo.energianostra.it",
  "https://www.energianostra.it",
];

/**
 * Build CORS response headers for a given request origin.
 *
 * Checks the origin against an allowlist configured via `CORS_ORIGINS` env var
 * (comma-separated) or a default set of allowed origins.
 *
 * @param origin - The `Origin` header value from the request, or `null`.
 * @returns CORS headers object.
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
    : ALLOWED_ORIGINS_DEFAULT;

  const isAllowed = origin && allowedOrigins.includes(origin);

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin! : allowedOrigins[0],
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-CSRF-Token, X-API-Version",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };
}

export function isTrustedExternalUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol === "https:") {
      return true;
    }
    return url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
  } catch {
    return false;
  }
}

// ── IP Extraction ──

/**
 * Extract the client IP address from a request.
 *
 * Checks `X-Forwarded-For` and `X-Real-IP` headers (set by reverse proxies),
 * falling back to `"unknown"`.
 *
 * @param request - The incoming HTTP request.
 * @returns The client's IP address string.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
