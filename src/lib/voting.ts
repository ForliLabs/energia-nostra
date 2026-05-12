import { DEFAULT_CER_ID } from "@/lib/app-config";
import { prisma } from "@/lib/prisma";

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

export function normaliseVoteOptions(options: string[]) {
  return Array.from(new Set(options.map((option) => option.trim()).filter(Boolean)));
}

export function deriveQuorumPct(quorum: string) {
  const normalized = quorum.toLowerCase();
  const explicitPercentage = normalized.match(/(\d{1,3})\s*%/);
  if (explicitPercentage) {
    return Math.min(100, Math.max(1, Number.parseInt(explicitPercentage[1], 10)));
  }
  if (normalized.includes("2/3")) return 67;
  if (normalized.includes("maggioranza semplice") || normalized.includes("50% + 1") || normalized.includes("50%+1")) return 51;
  return 51;
}

async function getEligibleUsers(cerId: string) {
  return prisma.user.count({
    where: {
      cerId,
      role: { in: ["member", "admin", "auditor"] },
    },
  });
}

function parseOptions(rawOptions: string) {
  try {
    const parsed = JSON.parse(rawOptions) as string[];
    return normaliseVoteOptions(parsed);
  } catch {
    return normaliseVoteOptions(rawOptions.split(","));
  }
}

async function mapVote(vote: {
  id: string;
  title: string;
  description: string | null;
  options: string;
  voteType: string;
  quorum: string;
  scheduledAt: string;
  closesAt: string | null;
  status: string;
  createdAt: Date;
  ballots: Array<{
    id: string;
    voteId: string;
    userId: string;
    choice: string;
    createdAt: Date;
    user: { name: string | null };
  }>;
  cerId: string;
}): Promise<VoteRecord> {
  const totalEligible = await getEligibleUsers(vote.cerId);

  return {
    id: vote.id,
    title: vote.title,
    description: vote.description || "",
    options: parseOptions(vote.options),
    voteType: vote.voteType as VoteRecord["voteType"],
    quorum: vote.quorum,
    quorumPct: deriveQuorumPct(vote.quorum),
    scheduledAt: vote.scheduledAt,
    closesAt: vote.closesAt || vote.scheduledAt,
    status: vote.status as VoteRecord["status"],
    totalEligible,
    ballots: vote.ballots
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((ballot) => ({
        id: ballot.id,
        voteId: ballot.voteId,
        userId: ballot.userId,
        userName: ballot.user.name || "Membro CER",
        choice: ballot.choice,
        createdAt: ballot.createdAt.toISOString(),
      })),
    createdAt: vote.createdAt.toISOString(),
  };
}

export async function getAllVotes(cerId = DEFAULT_CER_ID): Promise<VoteRecord[]> {
  const votes = await prisma.vote.findMany({
    where: { cerId },
    include: {
      ballots: {
        include: { user: true },
      },
    },
    orderBy: [{ scheduledAt: "desc" }, { createdAt: "desc" }],
  });

  return Promise.all(votes.map((vote) => mapVote(vote)));
}

export async function getVoteById(id: string): Promise<VoteRecord | undefined> {
  const vote = await prisma.vote.findUnique({
    where: { id },
    include: {
      ballots: { include: { user: true } },
    },
  });

  if (!vote) return undefined;
  return mapVote(vote);
}

export async function castBallot(voteId: string, userId: string, userName?: string, choice?: string): Promise<BallotRecord | null> {
  const vote = await prisma.vote.findUnique({
    where: { id: voteId },
    include: { ballots: true },
  });

  if (!vote || vote.status !== "aperta" || !choice) {
    return null;
  }

  const availableOptions = parseOptions(vote.options);
  if (!availableOptions.includes(choice)) {
    return null;
  }

  const closesAt = vote.closesAt ? new Date(vote.closesAt) : null;
  if (closesAt && closesAt < new Date()) {
    return null;
  }

  try {
    const ballot = await prisma.ballotCast.create({
      data: {
        voteId,
        userId,
        choice,
      },
      include: { user: true },
    });

    return {
      id: ballot.id,
      voteId: ballot.voteId,
      userId: ballot.userId,
      userName: ballot.user.name || userName || "Membro CER",
      choice: ballot.choice,
      createdAt: ballot.createdAt.toISOString(),
    };
  } catch {
    return null;
  }
}

export async function getVoteResults(voteId: string): Promise<VoteResults | null> {
  const vote = await getVoteById(voteId);
  if (!vote) return null;

  const totalBallots = vote.ballots.length;
  const participationPct = vote.totalEligible > 0 ? (totalBallots / vote.totalEligible) * 100 : 0;
  const results = vote.options.map((option) => {
    const count = vote.ballots.filter((ballot) => ballot.choice === option).length;
    return {
      option,
      count,
      pct: totalBallots > 0 ? (count / totalBallots) * 100 : 0,
    };
  });

  return {
    voteId: vote.id,
    title: vote.title,
    totalBallots,
    totalEligible: vote.totalEligible,
    participationPct,
    quorumReached: participationPct >= vote.quorumPct,
    results,
    status: vote.status,
  };
}

export async function createVote(input: {
  title: string;
  description: string;
  options: string[];
  voteType: "open" | "secret";
  quorum: string;
  quorumPct: number;
  scheduledAt: string;
  closesAt: string;
  cerId?: string;
}): Promise<VoteRecord> {
  const cerId = input.cerId || DEFAULT_CER_ID;
  const quorum = input.quorum || `${input.quorumPct}%`;

  const created = await prisma.vote.create({
    data: {
      title: input.title.trim(),
      description: input.description.trim(),
      options: JSON.stringify(normaliseVoteOptions(input.options)),
      voteType: input.voteType,
      quorum,
      scheduledAt: input.scheduledAt,
      closesAt: input.closesAt,
      status: new Date(input.scheduledAt) > new Date() ? "programmata" : "aperta",
      cerId,
    },
    include: { ballots: { include: { user: true } } },
  });

  return mapVote(created);
}
