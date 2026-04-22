export interface VoteRecord {
  id: string;
  title: string;
  description: string;
  options: string[];
  voteType: "open" | "secret";
  quorum: string;
  quorumPct: number;
  scheduledAt: string;
  closesAt: string;
  status: "programmata" | "aperta" | "chiusa" | "annullata";
  totalEligible: number;
  ballots: BallotRecord[];
  createdAt: string;
}

export interface BallotRecord {
  id: string;
  voteId: string;
  userId: string;
  userName: string;
  choice: string;
  createdAt: string;
}

export interface VoteResults {
  voteId: string;
  title: string;
  totalBallots: number;
  totalEligible: number;
  participationPct: number;
  quorumReached: boolean;
  results: Array<{ option: string; count: number; pct: number }>;
  status: string;
}

// In-memory vote store
const votes = new Map<string, VoteRecord>();
const ballots = new Map<string, BallotRecord>();

// Seed demo votes
function ensureSeeded() {
  if (votes.size > 0) return;

  const demoVotes: VoteRecord[] = [
    {
      id: "vote-q2",
      title: "Approvazione piano di distribuzione incentivi Q2 2025",
      description: "Votazione sull'approvazione del piano di ripartizione incentivi GSE per il secondo trimestre 2025. Il piano prevede la distribuzione basata sul peso energetico e tipo membro.",
      options: ["Approvo", "Non approvo", "Astenuto"],
      voteType: "open",
      quorum: "50% + 1 dei soci",
      quorumPct: 51,
      scheduledAt: "2025-05-20T20:45:00",
      closesAt: "2025-05-21T23:59:00",
      status: "aperta",
      totalEligible: 25,
      ballots: [],
      createdAt: "2025-05-10T10:00:00",
    },
    {
      id: "vote-pnrr",
      title: "Scelta fornitore accumulo condiviso da 80 kWh",
      description: "Selezione del fornitore per il sistema di accumulo energetico condiviso. Tre offerte ricevute: Sonnen, Tesla Powerwall, Huawei LUNA.",
      options: ["Sonnen", "Tesla Powerwall", "Huawei LUNA"],
      voteType: "secret",
      quorum: "2/3 dei membri votanti",
      quorumPct: 67,
      scheduledAt: "2025-06-03T18:30:00",
      closesAt: "2025-06-05T23:59:00",
      status: "programmata",
      totalEligible: 25,
      ballots: [],
      createdAt: "2025-05-12T10:00:00",
    },
    {
      id: "vote-expansion",
      title: "Ingresso nuovi prosumer area Santa Maria Nuova",
      description: "Approvazione dell'ingresso di 6 nuovi prosumer dall'area di Santa Maria Nuova nella CER.",
      options: ["Favorevole", "Contrario", "Astenuto"],
      voteType: "open",
      quorum: "Maggioranza semplice",
      quorumPct: 51,
      scheduledAt: "2025-06-12T21:00:00",
      closesAt: "2025-06-14T23:59:00",
      status: "programmata",
      totalEligible: 25,
      ballots: [],
      createdAt: "2025-05-15T10:00:00",
    },
    {
      id: "vote-statuto",
      title: "Approvazione modifiche statuto CER",
      description: "Ratifica delle modifiche all'articolo 12 dello statuto riguardante le modalità di recesso dei soci.",
      options: ["Approvo", "Non approvo", "Astenuto"],
      voteType: "open",
      quorum: "2/3 dei soci",
      quorumPct: 67,
      scheduledAt: "2025-04-15T20:00:00",
      closesAt: "2025-04-17T23:59:00",
      status: "chiusa",
      totalEligible: 25,
      ballots: [],
      createdAt: "2025-04-01T10:00:00",
    },
  ];

  // Add demo ballots for the closed vote
  const closedVoteBallots: BallotRecord[] = Array.from({ length: 20 }, (_, i) => ({
    id: `ballot-${i}`,
    voteId: "vote-statuto",
    userId: `user-${i}`,
    userName: `Membro ${i + 1}`,
    choice: i < 15 ? "Approvo" : i < 18 ? "Non approvo" : "Astenuto",
    createdAt: "2025-04-16T14:00:00",
  }));

  // Add some ballots for the open vote
  const openVoteBallots: BallotRecord[] = Array.from({ length: 12 }, (_, i) => ({
    id: `ballot-open-${i}`,
    voteId: "vote-q2",
    userId: `user-${i}`,
    userName: `Membro ${i + 1}`,
    choice: i < 9 ? "Approvo" : i < 11 ? "Non approvo" : "Astenuto",
    createdAt: "2025-05-20T21:00:00",
  }));

  for (const vote of demoVotes) {
    votes.set(vote.id, vote);
  }

  for (const ballot of [...closedVoteBallots, ...openVoteBallots]) {
    ballots.set(ballot.id, ballot);
    const vote = votes.get(ballot.voteId);
    if (vote) vote.ballots.push(ballot);
  }
}

export function getAllVotes(): VoteRecord[] {
  ensureSeeded();
  return Array.from(votes.values()).sort(
    (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
  );
}

export function getVoteById(id: string): VoteRecord | undefined {
  ensureSeeded();
  return votes.get(id);
}

export function castBallot(voteId: string, userId: string, userName: string, choice: string): BallotRecord | null {
  ensureSeeded();
  const vote = votes.get(voteId);
  if (!vote || vote.status !== "aperta") return null;

  // Check if already voted
  if (vote.ballots.some((b) => b.userId === userId)) return null;

  // Validate choice
  if (!vote.options.includes(choice)) return null;

  const ballot: BallotRecord = {
    id: `ballot-${crypto.randomUUID().slice(0, 8)}`,
    voteId,
    userId,
    userName,
    choice,
    createdAt: new Date().toISOString(),
  };

  ballots.set(ballot.id, ballot);
  vote.ballots.push(ballot);
  return ballot;
}

export function getVoteResults(voteId: string): VoteResults | null {
  ensureSeeded();
  const vote = votes.get(voteId);
  if (!vote) return null;

  const totalBallots = vote.ballots.length;
  const participationPct = vote.totalEligible > 0 ? (totalBallots / vote.totalEligible) * 100 : 0;

  const optionCounts = vote.options.map((option) => {
    const count = vote.ballots.filter((b) => b.choice === option).length;
    return { option, count, pct: totalBallots > 0 ? (count / totalBallots) * 100 : 0 };
  });

  return {
    voteId: vote.id,
    title: vote.title,
    totalBallots,
    totalEligible: vote.totalEligible,
    participationPct,
    quorumReached: participationPct >= vote.quorumPct,
    results: optionCounts,
    status: vote.status,
  };
}

export function createVote(input: {
  title: string;
  description: string;
  options: string[];
  voteType: "open" | "secret";
  quorum: string;
  quorumPct: number;
  scheduledAt: string;
  closesAt: string;
}): VoteRecord {
  ensureSeeded();
  const vote: VoteRecord = {
    id: `vote-${crypto.randomUUID().slice(0, 8)}`,
    ...input,
    status: "programmata",
    totalEligible: 25,
    ballots: [],
    createdAt: new Date().toISOString(),
  };
  votes.set(vote.id, vote);
  return vote;
}
