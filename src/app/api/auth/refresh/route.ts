import { refreshDbSession } from "@/lib/auth-production";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json() as { refreshToken?: string };

  if (!body.refreshToken) {
    return Response.json({ error: "Token di refresh mancante" }, { status: 400 });
  }

  const result = await refreshDbSession(body.refreshToken);
  if (!result) {
    return Response.json({ error: "Token di refresh non valido o scaduto" }, { status: 401 });
  }

  const response = Response.json({
    refreshToken: result.newRefreshToken,
    csrfToken: result.csrfToken,
    message: "Sessione rinnovata",
  });

  response.headers.set(
    "Set-Cookie",
    `session_id=${result.sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${24 * 60 * 60}`
  );

  return response;
}
