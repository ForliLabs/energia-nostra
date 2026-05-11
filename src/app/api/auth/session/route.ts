import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return Response.json({ user: null }, { status: 401 });
  }
  return Response.json({ user: session.user });
}
