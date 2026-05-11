import { cookies, headers } from "next/headers";
import { authenticateUserDb, checkRateLimit, createDbSession, resetRateLimit } from "@/lib/auth-production";

function getClientIp(headerStore: Awaited<ReturnType<typeof headers>>) {
  const forwardedFor = headerStore.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || "unknown";
}

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };

  if (!body.email?.trim() || !body.password?.trim()) {
    return Response.json({ error: "Email e password sono obbligatori." }, { status: 400 });
  }

  const headerStore = await headers();
  const ipAddress = getClientIp(headerStore);
  const rateLimit = checkRateLimit(`${ipAddress}:${body.email.toLowerCase()}`);
  if (!rateLimit.allowed) {
    return Response.json(
      { error: "Troppi tentativi di accesso. Riprova più tardi." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)) } }
    );
  }

  const user = await authenticateUserDb(body.email, body.password, ipAddress);
  if (!user) {
    return Response.json({ error: "Credenziali non valide." }, { status: 401 });
  }

  resetRateLimit(`${ipAddress}:${body.email.toLowerCase()}`);

  const userAgent = headerStore.get("user-agent") || undefined;
  const { sessionId, refreshToken, csrfToken } = await createDbSession(user.id, ipAddress, userAgent);

  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";

  cookieStore.set("session_id", sessionId, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60,
  });
  cookieStore.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  cookieStore.set("csrf_token", csrfToken, {
    httpOnly: false,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60,
  });

  return Response.json({ user });
}
