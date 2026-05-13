// Gamification & Behavioral Nudges (Feature 7)

import { DEFAULT_CER_ID } from "@/lib/app-config";
import { prisma } from "@/lib/prisma";

export interface AchievementInfo {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  earned: boolean;
  earnedAt?: string;
}

export interface LeaderboardEntry {
  rank: number;
  memberId: string;
  memberName: string;
  points: number;
  achievementCount: number;
  isAnonymous: boolean;
}

export interface ChallengeInfo {
  id: string;
  title: string;
  description: string;
  type: string;
  targetValue: number;
  unit: string;
  startDate: string;
  endDate: string;
  status: string;
  participantCount: number;
  myProgress?: number;
  myCompleted?: boolean;
}

export interface SmartNudge {
  id: string;
  type: "consumption_shift" | "savings_tip" | "achievement_near" | "challenge_reminder";
  title: string;
  message: string;
  potentialSavingsEuro?: number;
  icon: string;
}

export async function getMemberAchievements(memberId: string): Promise<AchievementInfo[]> {
  const allAchievements = await prisma.achievement.findMany({ orderBy: [{ category: "asc" }, { points: "desc" }] });
  const earned = await prisma.memberAchievement.findMany({ where: { memberId } });
  const earnedMap = new Map(earned.map((entry) => [entry.achievementId, entry.earnedAt]));

  return allAchievements.map((achievement) => ({
    id: achievement.id,
    code: achievement.code,
    name: achievement.name,
    description: achievement.description,
    icon: achievement.icon,
    category: achievement.category,
    points: achievement.points,
    earned: earnedMap.has(achievement.id),
    earnedAt: earnedMap.get(achievement.id)?.toISOString(),
  }));
}

export async function getLeaderboard(cerId = DEFAULT_CER_ID): Promise<LeaderboardEntry[]> {
  const members = await prisma.member.findMany({ where: { cerId }, select: { id: true, name: true } });
  const memberIds = members.map((member) => member.id);
  const achievements = await prisma.memberAchievement.findMany({
    where: { memberId: { in: memberIds } },
    include: { achievement: true },
  });

  const memberPoints = new Map<string, { points: number; count: number; name: string }>(
    members.map((member) => [member.id, { points: 0, count: 0, name: member.name }]),
  );

  for (const achievement of achievements) {
    const current = memberPoints.get(achievement.memberId) || { points: 0, count: 0, name: achievement.memberName };
    current.points += achievement.achievement.points;
    current.count += 1;
    memberPoints.set(achievement.memberId, current);
  }

  return Array.from(memberPoints.entries())
    .sort(([, left], [, right]) => right.points - left.points || right.count - left.count || left.name.localeCompare(right.name, "it"))
    .map(([memberId, data], index) => ({
      rank: index + 1,
      memberId,
      memberName: data.name,
      points: data.points,
      achievementCount: data.count,
      isAnonymous: false,
    }));
}

export async function getChallenges(cerId = DEFAULT_CER_ID, memberId?: string): Promise<ChallengeInfo[]> {
  const challenges = await prisma.challenge.findMany({
    where: { cerId },
    include: { participants: true },
    orderBy: { createdAt: "desc" },
  });

  return challenges.map((challenge) => {
    const myParticipation = memberId ? challenge.participants.find((participant) => participant.memberId === memberId) : undefined;
    return {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      type: challenge.type,
      targetValue: challenge.targetValue,
      unit: challenge.unit,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      status: challenge.status,
      participantCount: challenge.participants.length,
      myProgress: myParticipation?.currentValue,
      myCompleted: myParticipation?.completed,
    };
  });
}

export async function joinChallenge(challengeId: string, memberId: string, memberName: string): Promise<boolean> {
  const existing = await prisma.challengeParticipant.findUnique({
    where: { challengeId_memberId: { challengeId, memberId } },
  });
  if (existing) return false;

  await prisma.challengeParticipant.create({
    data: { challengeId, memberId, memberName, currentValue: 0 },
  });
  return true;
}

export async function generateNudges(memberId: string, cerId = DEFAULT_CER_ID): Promise<SmartNudge[]> {
  const nudges: SmartNudge[] = [];
  const memberAchievements = await prisma.memberAchievement.findMany({ where: { memberId } });
  const allAchievements = await prisma.achievement.findMany({ orderBy: { points: "desc" } });
  const earnedIds = new Set(memberAchievements.map((achievement) => achievement.achievementId));

  const nextAchievement = allAchievements.find((achievement) => !earnedIds.has(achievement.id));
  if (nextAchievement) {
    nudges.push({
      id: `nudge-ach-${nextAchievement.code}`,
      type: "achievement_near",
      title: `Vicino al badge “${nextAchievement.name}”`,
      message: nextAchievement.description,
      icon: nextAchievement.icon,
    });
  }

  nudges.push({
    id: "nudge-shift-1",
    type: "consumption_shift",
    title: "Sposta i consumi nella finestra solare",
    message: "Concentrando lavatrice, pompa di calore o EV tra le 10:00 e le 15:00 puoi aumentare l'autoconsumo condiviso della CER.",
    potentialSavingsEuro: 3.2,
    icon: "☀️",
  });

  nudges.push({
    id: "nudge-savings-1",
    type: "savings_tip",
    title: "Programma la ricarica EV nei picchi fotovoltaici",
    message: "Le giornate con irraggiamento più stabile riducono il costo medio dei kWh condivisi e migliorano il punteggio community.",
    potentialSavingsEuro: 5.5,
    icon: "🔌",
  });

  const activeChallenges = await prisma.challenge.findMany({
    where: { cerId, status: "active" },
    include: { participants: { where: { memberId } } },
  });
  for (const challenge of activeChallenges) {
    if (challenge.participants.length > 0 && !challenge.participants[0].completed) {
      nudges.push({
        id: `nudge-challenge-${challenge.id}`,
        type: "challenge_reminder",
        title: `Sfida in corso: ${challenge.title}`,
        message: `Sei a ${challenge.participants[0].currentValue}/${challenge.targetValue} ${challenge.unit}. Continua così per entrare nella top leaderboard.`,
        icon: "🎯",
      });
    }
  }

  return nudges;
}

export async function getGamificationSummary(cerId = DEFAULT_CER_ID) {
  const members = await prisma.member.findMany({ where: { cerId }, select: { id: true } });
  const memberIds = members.map((member) => member.id);

  const [totalAchievements, activeChallenges, totalParticipants] = await Promise.all([
    prisma.memberAchievement.count({ where: { memberId: { in: memberIds } } }),
    prisma.challenge.count({ where: { cerId, status: "active" } }),
    prisma.challengeParticipant.count({ where: { challenge: { cerId } } }),
  ]);

  return {
    totalAchievementsEarned: totalAchievements,
    activeChallenges,
    totalChallengeParticipants: totalParticipants,
    avgAchievementsPerMember: members.length > 0 ? Number((totalAchievements / members.length).toFixed(1)) : 0,
  };
}
