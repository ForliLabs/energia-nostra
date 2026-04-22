import { getAllVotes, getVoteResults, castBallot, createVote } from "@/lib/voting";

export const dynamic = "force-dynamic";

export async function GET() {
  const votes = getAllVotes();
  const votesWithResults = votes.map((vote) => ({
    ...vote,
    results: getVoteResults(vote.id),
    // Hide individual ballots for secret votes
    ballots: vote.voteType === "secret" ? [] : vote.ballots,
  }));
  return Response.json(votesWithResults);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: string;
    voteId?: string;
    userId?: string;
    userName?: string;
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
    if (!body.voteId || !body.userId || !body.choice) {
      return Response.json({ error: "voteId, userId e choice sono obbligatori." }, { status: 400 });
    }
    const ballot = castBallot(body.voteId, body.userId, body.userName || "Anonimo", body.choice);
    if (!ballot) {
      return Response.json({ error: "Impossibile esprimere il voto. La votazione potrebbe essere chiusa o hai già votato." }, { status: 400 });
    }
    return Response.json(ballot, { status: 201 });
  }

  if (body.action === "create") {
    if (!body.title || !body.options || body.options.length < 2) {
      return Response.json({ error: "Titolo e almeno 2 opzioni sono obbligatori." }, { status: 400 });
    }
    const vote = createVote({
      title: body.title,
      description: body.description || "",
      options: body.options,
      voteType: body.voteType || "open",
      quorum: body.quorum || "Maggioranza semplice",
      quorumPct: body.quorumPct || 51,
      scheduledAt: body.scheduledAt || new Date().toISOString(),
      closesAt: body.closesAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    return Response.json(vote, { status: 201 });
  }

  return Response.json({ error: "Azione non riconosciuta. Usa 'cast' o 'create'." }, { status: 400 });
}
