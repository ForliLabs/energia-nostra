import { getSessionFromCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSessionFromCookie();
  if (!session) {
    return Response.json({ user: null }, { status: 401 });
  }
  return Response.json({ user: session.user });
}
