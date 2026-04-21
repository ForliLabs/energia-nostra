import { registerUser, createSession } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string; name?: string };

  if (!body.email?.trim() || !body.password?.trim() || !body.name?.trim()) {
    return Response.json({ error: "Nome, email e password sono obbligatori." }, { status: 400 });
  }

  if (body.password.length < 6) {
    return Response.json({ error: "La password deve avere almeno 6 caratteri." }, { status: 400 });
  }

  const user = await registerUser(body.email, body.password, body.name);
  if (!user) {
    return Response.json({ error: "Esiste già un account con questa email." }, { status: 409 });
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
