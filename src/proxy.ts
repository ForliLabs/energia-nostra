import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = ["/dashboard", "/portale", "/admin"];
const authPages = ["/login", "/registrazione"];

// Public API routes that don't require authentication
const publicApiRoutes = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/spid",
  "/api/auth/cie",
  "/api/health",
  "/api/metrics",
  "/api/openapi",
  "/api/status",
  "/api/gdpr/processing-records",
  "/api/trial/signup",
  "/api/integrations",
];

function isPublicApiRoute(pathname: string): boolean {
  return publicApiRoutes.some((route) => pathname.startsWith(route));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("session_id");

  const response = NextResponse.next();

  // ── Security Headers (applied to all routes) ──
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }

  // ── Correlation ID ──
  const correlationId = request.headers.get("x-correlation-id") || crypto.randomUUID();
  response.headers.set("X-Correlation-ID", correlationId);

  // ── API Version Header ──
  if (pathname.startsWith("/api/")) {
    response.headers.set("X-API-Version", "1.0.0");
  }

  // ── CORS for API routes ──
  if (pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000").split(",");

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
    }

    if (request.method === "OPTIONS") {
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token, X-API-Version");
      response.headers.set("Access-Control-Max-Age", "86400");
      return new NextResponse(null, { status: 204, headers: response.headers });
    }
  }

  // Redirect authenticated users away from auth pages
  if (authPages.some((p) => pathname.startsWith(p)) && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Allow access to protected routes only with session (cookie-level check;
  // full validation happens server-side in API routes / server components)
  if (protectedPrefixes.some((p) => pathname.startsWith(p)) && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── API Auth Check (non-public API routes) ──
  if (pathname.startsWith("/api/") && !isPublicApiRoute(pathname)) {
    const apiKey = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!sessionCookie?.value && !apiKey) {
      return NextResponse.json({ error: "Autenticazione richiesta" }, { status: 401 });
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/portale/:path*",
    "/admin/:path*",
    "/login",
    "/registrazione",
    "/api/:path*",
  ],
};
