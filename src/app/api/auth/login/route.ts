import { authenticateUser, createSession } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };

  if (!body.email?.trim() || !body.password?.trim()) {
    return Response.json({ error: "Email e password sono obbligatori." }, { status: 400 });
  }

  const user = await authenticateUser(body.email, body.password);
  if (!user) {
    return Response.json({ error: "Credenziali non valide." }, { status: 401 });
  }

  const sessionId = createSession(user.id);
  const cookieStore = await cookies();
  cookieStore.set("session_id", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return Response.json({ user });
}
