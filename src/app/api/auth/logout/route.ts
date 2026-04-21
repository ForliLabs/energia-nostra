import { deleteSession, getSessionFromCookie } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST() {
  const session = await getSessionFromCookie();
  if (session) {
    deleteSession(session.sessionId);
  }
  const cookieStore = await cookies();
  cookieStore.delete("session_id");
  return Response.json({ success: true });
}
