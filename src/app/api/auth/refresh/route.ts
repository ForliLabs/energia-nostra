import { cookies } from "next/headers";
import { refreshDbSession } from "@/lib/auth-production";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const body = (await request.json().catch(() => ({}))) as { refreshToken?: string };
  const refreshToken = body.refreshToken || cookieStore.get("refresh_token")?.value;

  if (!refreshToken) {
    return Response.json({ error: "Token di refresh mancante" }, { status: 400 });
  }

  const result = await refreshDbSession(refreshToken);
  if (!result) {
    return Response.json({ error: "Token di refresh non valido o scaduto" }, { status: 401 });
  }

  const secure = process.env.NODE_ENV === "production";

  cookieStore.set("session_id", result.sessionId, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60,
  });
  cookieStore.set("refresh_token", result.newRefreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  cookieStore.set("csrf_token", result.csrfToken, {
    httpOnly: false,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60,
  });

  return Response.json({
    refreshToken: result.newRefreshToken,
    csrfToken: result.csrfToken,
    message: "Sessione rinnovata",
  });
}
