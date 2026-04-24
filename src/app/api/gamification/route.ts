import { getMemberAchievements, getLeaderboard, getChallenges, joinChallenge, generateNudges, getGamificationSummary } from "@/lib/gamification";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cerId = searchParams.get("cerId") || "cer-bertinoro";
  const memberId = searchParams.get("memberId");
  const view = searchParams.get("view"); // achievements | leaderboard | challenges | nudges | summary

  if (view === "achievements" && memberId) {
    const achievements = await getMemberAchievements(memberId);
    return Response.json({ achievements });
  }

  if (view === "leaderboard") {
    const leaderboard = await getLeaderboard(cerId);
    return Response.json({ leaderboard });
  }

  if (view === "challenges") {
    const challenges = await getChallenges(cerId, memberId || undefined);
    return Response.json({ challenges });
  }

  if (view === "nudges" && memberId) {
    const nudges = await generateNudges(memberId);
    return Response.json({ nudges });
  }

  // Default: summary
  const summary = await getGamificationSummary(cerId);
  const leaderboard = await getLeaderboard(cerId);
  const challenges = await getChallenges(cerId);
  return Response.json({ summary, leaderboard: leaderboard.slice(0, 10), challenges });
}

export async function POST(request: Request) {
  const body = await request.json() as {
    action?: string;
    challengeId?: string;
    memberId?: string;
    memberName?: string;
  };

  if (body.action === "join-challenge") {
    if (!body.challengeId || !body.memberId || !body.memberName) {
      return Response.json({ error: "Challenge ID, membro ID e nome richiesti." }, { status: 400 });
    }
    const success = await joinChallenge(body.challengeId, body.memberId, body.memberName);
    if (!success) {
      return Response.json({ error: "Già iscritto a questa sfida." }, { status: 409 });
    }
    return Response.json({ success: true }, { status: 201 });
  }

  return Response.json({ error: "Azione non riconosciuta." }, { status: 400 });
}
