import { cookies, headers } from "next/headers";
import { DEFAULT_CER_ID } from "@/lib/app-config";
import { createDbSession, registerUserDb, validatePassword } from "@/lib/auth-production";

function getClientIp(headerStore: Awaited<ReturnType<typeof headers>>) {
  const forwardedFor = headerStore.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || "unknown";
}

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string; name?: string };

  if (!body.email?.trim() || !body.password?.trim() || !body.name?.trim()) {
    return Response.json({ error: "Nome, email e password sono obbligatori." }, { status: 400 });
  }

  if (body.name.trim().split(/\s+/).length < 2) {
    return Response.json({ error: "Inserisci almeno nome e cognome." }, { status: 400 });
  }

  const passwordValidation = validatePassword(body.password.trim());
  if (!passwordValidation.valid) {
    return Response.json({ error: passwordValidation.errors[0] }, { status: 400 });
  }

  const user = await registerUserDb(body.email, body.password, body.name.trim(), "member", DEFAULT_CER_ID);
  if (!user) {
    return Response.json({ error: "Esiste già un account con questa email." }, { status: 409 });
  }

  const headerStore = await headers();
  const ipAddress = getClientIp(headerStore);
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
