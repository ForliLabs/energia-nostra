// Gamification & Behavioral Nudges (Feature 7)

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
  const allAchievements = await prisma.achievement.findMany({ orderBy: { category: "asc" } });
  const earned = await prisma.memberAchievement.findMany({ where: { memberId } });
  const earnedMap = new Map(earned.map((e) => [e.achievementId, e.earnedAt]));

  return allAchievements.map((a) => ({
    id: a.id, code: a.code, name: a.name, description: a.description,
    icon: a.icon, category: a.category, points: a.points,
    earned: earnedMap.has(a.id),
    earnedAt: earnedMap.get(a.id)?.toISOString(),
  }));
}

export async function getLeaderboard(cerId = "cer-bertinoro"): Promise<LeaderboardEntry[]> {
  const members = await prisma.member.findMany({ where: { cerId }, select: { id: true, name: true } });
  const memberIds = members.map((m) => m.id);
  
  const achievements = await prisma.memberAchievement.findMany({
    where: { memberId: { in: memberIds } },
    include: { achievement: true },
  });

  const memberPoints = new Map<string, { points: number; count: number; name: string }>();
  for (const a of achievements) {
    const current = memberPoints.get(a.memberId) || { points: 0, count: 0, name: a.memberName };
    current.points += a.achievement.points;
    current.count += 1;
    memberPoints.set(a.memberId, current);
  }

  return Array.from(memberPoints.entries())
    .sort(([, a], [, b]) => b.points - a.points)
    .map(([memberId, data], index) => ({
      rank: index + 1,
      memberId,
      memberName: data.name,
      points: data.points,
      achievementCount: data.count,
      isAnonymous: false,
    }));
}

export async function getChallenges(cerId = "cer-bertinoro", memberId?: string): Promise<ChallengeInfo[]> {
  const challenges = await prisma.challenge.findMany({
    where: { cerId },
    include: { participants: true },
    orderBy: { createdAt: "desc" },
  });

  return challenges.map((c) => {
    const myParticipation = memberId ? c.participants.find((p) => p.memberId === memberId) : undefined;
    return {
      id: c.id, title: c.title, description: c.description,
      type: c.type, targetValue: c.targetValue, unit: c.unit,
      startDate: c.startDate, endDate: c.endDate, status: c.status,
      participantCount: c.participants.length,
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

export async function generateNudges(memberId: string): Promise<SmartNudge[]> {
  const nudges: SmartNudge[] = [];
  const memberAchievements = await prisma.memberAchievement.findMany({ where: { memberId } });
  const allAchievements = await prisma.achievement.findMany();
  const earnedCodes = new Set(memberAchievements.map((a) => a.achievementId));

  // Check for near achievements
  const unearnedCount = allAchievements.length - earnedCodes.size;
  if (unearnedCount > 0) {
    const nextAchievement = allAchievements.find((a) => !earnedCodes.has(a.id));
    if (nextAchievement) {
      nudges.push({
        id: `nudge-ach-${nextAchievement.code}`,
        type: "achievement_near",
        title: `Vicino al badge "${nextAchievement.name}"!`,
        message: nextAchievement.description,
        icon: nextAchievement.icon,
      });
    }
  }

  // Consumption shift suggestion
  nudges.push({
    id: "nudge-shift-1",
    type: "consumption_shift",
    title: "Sposta i consumi nelle ore solari",
    message: "Spostando lavatrice e lavastoviglie tra le 10:00 e le 15:00 potresti risparmiare circa €3,20 al mese grazie all'autoconsumo condiviso.",
    potentialSavingsEuro: 3.20,
    icon: "☀️",
  });

  // Savings tip
  nudges.push({
    id: "nudge-savings-1",
    type: "savings_tip",
    title: "Programma la ricarica EV",
    message: "Ricaricando l'auto elettrica tra le 12:00 e le 14:00 nei giorni feriali sfrutti il picco di produzione solare della CER.",
    potentialSavingsEuro: 5.50,
    icon: "🔌",
  });

  // Active challenge reminder
  const activeChallenges = await prisma.challenge.findMany({
    where: { status: "active" },
    include: { participants: { where: { memberId } } },
  });
  for (const challenge of activeChallenges) {
    if (challenge.participants.length > 0 && !challenge.participants[0].completed) {
      nudges.push({
        id: `nudge-challenge-${challenge.id}`,
        type: "challenge_reminder",
        title: `Sfida in corso: ${challenge.title}`,
        message: `Progressi: ${challenge.participants[0].currentValue}/${challenge.targetValue} ${challenge.unit}. Continua così!`,
        icon: "🎯",
      });
    }
  }

  return nudges;
}

export async function getGamificationSummary(cerId = "cer-bertinoro") {
  const members = await prisma.member.findMany({ where: { cerId }, select: { id: true } });
  const memberIds = members.map((m) => m.id);
  
  const totalAchievements = await prisma.memberAchievement.count({ where: { memberId: { in: memberIds } } });
  const activeChallenges = await prisma.challenge.count({ where: { cerId, status: "active" } });
  const totalParticipants = await prisma.challengeParticipant.count({
    where: { challenge: { cerId } },
  });

  return {
    totalAchievementsEarned: totalAchievements,
    activeChallenges,
    totalChallengeParticipants: totalParticipants,
    avgAchievementsPerMember: members.length > 0 ? Number((totalAchievements / members.length).toFixed(1)) : 0,
  };
}
