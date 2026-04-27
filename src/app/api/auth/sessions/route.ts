import { getProductionSession, getActiveSessions, deleteDbSession, deleteAllUserSessions } from "@/lib/auth-production";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getProductionSession();
  if (!session) {
    return Response.json({ error: "Non autenticato" }, { status: 401 });
  }

  const activeSessions = await getActiveSessions(session.user.id);
  return Response.json({
    currentSessionId: session.sessionId,
    sessions: activeSessions.map(s => ({
      id: s.id,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
      isCurrent: s.id === session.sessionId,
    })),
  });
}

export async function DELETE(request: Request) {
  const session = await getProductionSession();
  if (!session) {
    return Response.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const targetSessionId = searchParams.get("sessionId");
  const all = searchParams.get("all") === "true";

  if (all) {
    await deleteAllUserSessions(session.user.id);
    return Response.json({ message: "Tutte le sessioni terminate" });
  }

  if (targetSessionId) {
    await deleteDbSession(targetSessionId);
    return Response.json({ message: "Sessione terminata" });
  }

  return Response.json({ error: "Specificare sessionId o all=true" }, { status: 400 });
}
