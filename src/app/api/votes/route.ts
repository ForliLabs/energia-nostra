import { castBallot, createVote, getAllVotes, getVoteResults, normaliseVoteOptions } from "@/lib/voting";
import { getCurrentSession, hasRequiredRole, resolveSessionCerId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const session = await getCurrentSession();
  const cerId = resolveSessionCerId(session, searchParams.get("cerId"));
  const votes = await getAllVotes(cerId);
  const votesWithResults = await Promise.all(
    votes.map(async (vote) => ({
      ...vote,
      results: await getVoteResults(vote.id),
      ballots: vote.voteType === "secret" ? [] : vote.ballots,
    })),
  );

  return Response.json(votesWithResults);
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return Response.json({ error: "Accedi per partecipare alle votazioni." }, { status: 401 });
  }

  const body = (await request.json()) as {
    action?: string;
    voteId?: string;
    choice?: string;
    title?: string;
    description?: string;
    options?: string[];
    voteType?: "open" | "secret";
    quorum?: string;
    quorumPct?: number;
    scheduledAt?: string;
    closesAt?: string;
  };

  if (body.action === "cast") {
    if (!body.voteId || !body.choice) {
      return Response.json({ error: "voteId e choice sono obbligatori." }, { status: 400 });
    }

    const ballot = await castBallot(body.voteId, session.user.id, session.user.name, body.choice);
    if (!ballot) {
      return Response.json({ error: "Impossibile esprimere il voto. Potresti aver già votato o la votazione potrebbe essere chiusa." }, { status: 400 });
    }

    return Response.json(ballot, { status: 201 });
  }

  if (body.action === "create") {
    if (!hasRequiredRole(session, ["admin", "superadmin"])) {
      return Response.json({ error: "Solo gli amministratori possono aprire nuove votazioni." }, { status: 403 });
    }

    const options = normaliseVoteOptions(body.options || []);
    if (!body.title?.trim() || options.length < 2) {
      return Response.json({ error: "Titolo e almeno 2 opzioni sono obbligatori." }, { status: 400 });
    }

    const scheduledAt = body.scheduledAt || new Date().toISOString();
    const closesAt = body.closesAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const vote = await createVote({
      title: body.title,
      description: body.description || "",
      options,
      voteType: body.voteType || "open",
      quorum: body.quorum || "Maggioranza semplice",
      quorumPct: body.quorumPct || 51,
      scheduledAt,
      closesAt,
      cerId: resolveSessionCerId(session),
    });

    return Response.json(vote, { status: 201 });
  }

  return Response.json({ error: "Azione non riconosciuta. Usa 'cast' o 'create'." }, { status: 400 });
}
