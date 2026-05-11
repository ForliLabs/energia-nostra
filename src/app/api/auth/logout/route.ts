import { deleteSession } from "@/lib/auth";
import { deleteDbSession } from "@/lib/auth-production";
import { getCurrentSession } from "@/lib/session";
import { cookies } from "next/headers";

export async function POST() {
  const session = await getCurrentSession();
  if (session) {
    if (session.source === "production") {
      await deleteDbSession(session.sessionId);
    } else {
      deleteSession(session.sessionId);
    }
  }

  const cookieStore = await cookies();
  cookieStore.delete("session_id");
  cookieStore.delete("refresh_token");
  cookieStore.delete("csrf_token");
  return Response.json({ success: true });
}
