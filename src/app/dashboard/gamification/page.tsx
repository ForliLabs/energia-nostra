"use client";

import { Medal, Sparkles, Target, Trophy, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AchievementInfo, ChallengeInfo, LeaderboardEntry, SmartNudge } from "@/lib/gamification";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast-provider";
import { getMutationHeaders } from "@/hooks/mutation-headers";

interface GamificationResponse {
  summary: {
    totalAchievementsEarned: number;
    activeChallenges: number;
    totalChallengeParticipants: number;
    avgAchievementsPerMember: number;
  };
  leaderboard: LeaderboardEntry[];
  challenges: ChallengeInfo[];
  achievements: AchievementInfo[];
  nudges: SmartNudge[];
  member: { id: string; name: string } | null;
  memberPosition: LeaderboardEntry | null;
}

const formatDate = (value: string) => new Date(value).toLocaleDateString("it-IT");

const getChallengeProgress = (challenge: ChallengeInfo) => {
  if (typeof challenge.myProgress === "number" && challenge.targetValue > 0) {
    return Math.min(100, (challenge.myProgress / challenge.targetValue) * 100);
  }
  const startDate = new Date(challenge.startDate).getTime();
  const endDate = new Date(challenge.endDate).getTime();
  const now = Date.now();
  if (!Number.isFinite(startDate) || !Number.isFinite(endDate) || endDate <= startDate) return 0;
  if (now <= startDate) return 0;
  if (now >= endDate) return 100;
  return ((now - startDate) / (endDate - startDate)) * 100;
};

export default function GamificationPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<GamificationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningChallengeId, setJoiningChallengeId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/gamification");
      const payload = (await response.json()) as GamificationResponse & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Impossibile recuperare la gamification.");
      }
      setData(payload);
    } catch (caughtError) {
      setError((caughtError as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  const earnedAchievements = useMemo(() => data?.achievements.filter((achievement) => achievement.earned) || [], [data]);
  const nextAchievement = useMemo(() => data?.achievements.find((achievement) => !achievement.earned) || null, [data]);

  const joinChallenge = async (challengeId: string) => {
    setJoiningChallengeId(challengeId);
    try {
      const response = await fetch("/api/gamification", {
        method: "POST",
        headers: getMutationHeaders(),
        body: JSON.stringify({ action: "join-challenge", challengeId }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Impossibile aderire alla sfida.");
      }
      showToast({ title: "Sfida attivata", description: "Il tuo profilo membro è ora iscritto alla challenge selezionata.", variant: "success" });
      await loadData();
    } catch (caughtError) {
      showToast({ title: "Adesione non riuscita", description: (caughtError as Error).message, variant: "error" });
    } finally {
      setJoiningChallengeId(null);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Engagement comunità"
        title="Sfide & Badge"
        description="La gamification ora è personale: vedi la tua posizione, i badge già maturati, i prossimi obiettivi e puoi aderire alle sfide attive senza passaggi manuali." 
      />

      {loading && !data ? <p className="text-sm text-zinc-500">Caricamento badge e challenge...</p> : null}
      {error && !data ? <EmptyState title="Impossibile caricare la gamification" description={error} /> : null}

      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-3 text-amber-700"><Trophy className="h-5 w-5" /><p className="text-sm font-medium text-zinc-500">Badge ottenuti</p></div><p className="mt-4 text-3xl font-bold text-zinc-950">{earnedAchievements.length}</p><p className="mt-1 text-xs text-zinc-500">{data.summary.totalAchievementsEarned} badge distribuiti in CER</p></div>
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-3 text-amber-700"><Target className="h-5 w-5" /><p className="text-sm font-medium text-zinc-500">Sfide attive</p></div><p className="mt-4 text-3xl font-bold text-zinc-950">{data.summary.activeChallenges}</p><p className="mt-1 text-xs text-zinc-500">{data.summary.totalChallengeParticipants} partecipazioni totali</p></div>
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-3 text-amber-700"><Medal className="h-5 w-5" /><p className="text-sm font-medium text-zinc-500">Posizione personale</p></div><p className="mt-4 text-3xl font-bold text-zinc-950">{data.memberPosition ? `#${data.memberPosition.rank}` : "—"}</p><p className="mt-1 text-xs text-zinc-500">{data.memberPosition ? `${data.memberPosition.points} punti` : "Associa un profilo membro per comparire in classifica"}</p></div>
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-3 text-amber-700"><Users className="h-5 w-5" /><p className="text-sm font-medium text-zinc-500">Media badge / membro</p></div><p className="mt-4 text-3xl font-bold text-zinc-950">{data.summary.avgAchievementsPerMember}</p><p className="mt-1 text-xs text-zinc-500">Engagement medio della community</p></div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-3xl border border-amber-100 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-amber-700" /><h2 className="text-2xl font-bold text-zinc-950">La tua progressione</h2></div>
              {data.member ? (
                <>
                  <p className="mt-4 text-sm leading-6 text-zinc-600">Profilo attivo: <span className="font-semibold text-zinc-950">{data.member.name}</span>. La dashboard evidenzia suggerimenti utili per ottenere il prossimo badge o non perdere le challenge aperte.</p>
                  <div className="mt-6 space-y-4">
                    {nextAchievement ? (
                      <article className="rounded-2xl border border-lime-100 bg-lime-50 p-5">
                        <p className="text-sm font-semibold text-zinc-700">Prossimo badge</p>
                        <h3 className="mt-2 text-lg font-bold text-zinc-950">{nextAchievement.icon} {nextAchievement.name}</h3>
                        <p className="mt-2 text-sm leading-6 text-zinc-600">{nextAchievement.description}</p>
                        <p className="mt-3 text-xs font-semibold text-lime-700">+{nextAchievement.points} punti</p>
                      </article>
                    ) : null}
                    <div className="space-y-3">
                      {data.nudges.length === 0 ? (
                        <EmptyState title="Nessun nudge disponibile" description="I suggerimenti appariranno qui quando il motore individuerà opportunità di risparmio o badge vicini." />
                      ) : (
                        data.nudges.map((nudge) => (
                          <article key={nudge.id} className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                            <p className="font-semibold text-zinc-950">{nudge.icon} {nudge.title}</p>
                            <p className="mt-2 text-sm leading-6 text-zinc-600">{nudge.message}</p>
                            {typeof nudge.potentialSavingsEuro === "number" ? <p className="mt-2 text-xs font-semibold text-lime-700">Risparmio potenziale €{nudge.potentialSavingsEuro.toFixed(2)}</p> : null}
                          </article>
                        ))
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-6"><EmptyState title="Profilo membro non associato" description="La classifica e le sfide personali si attivano quando l'account è abbinato a un membro della CER." /></div>
              )}
            </section>

            <section className="rounded-3xl border border-amber-100 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3"><Target className="h-5 w-5 text-amber-700" /><h2 className="text-2xl font-bold text-zinc-950">Sfide attive</h2></div>
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {data.challenges.length === 0 ? (
                  <div className="lg:col-span-2"><EmptyState title="Nessuna challenge attiva" description="Le prossime campagne di community energy appariranno qui con target, partecipanti e progressi." /></div>
                ) : (
                  data.challenges.map((challenge) => {
                    const progress = getChallengeProgress(challenge);
                    const isParticipant = typeof challenge.myProgress === "number";
                    return (
                      <article key={challenge.id} className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-zinc-950">{challenge.title}</h3>
                            <p className="mt-2 text-sm leading-6 text-zinc-600">{challenge.description}</p>
                          </div>
                          <span className="rounded-full bg-lime-100 px-2 py-0.5 text-xs font-medium text-lime-800">{challenge.status === "active" ? "Attiva" : challenge.status}</span>
                        </div>
                        <div className="mt-4 space-y-2 text-sm text-zinc-600">
                          <p>Target <span className="font-semibold text-zinc-800">{challenge.targetValue} {challenge.unit}</span></p>
                          <p>Periodo <span className="font-semibold text-zinc-800">{formatDate(challenge.startDate)} – {formatDate(challenge.endDate)}</span></p>
                          <p>Partecipanti <span className="font-semibold text-zinc-800">{challenge.participantCount}</span></p>
                        </div>
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm"><span className="font-medium text-zinc-700">{isParticipant ? "Progressione personale" : "Stato challenge"}</span><span className="text-zinc-600">{Math.round(progress)}%</span></div>
                          <div className="mt-2 h-3 overflow-hidden rounded-full bg-amber-100"><div className="h-full rounded-full bg-lime-500" style={{ width: `${Math.min(progress, 100)}%` }} /></div>
                        </div>
                        {data.member ? (
                          <button
                            type="button"
                            onClick={() => void joinChallenge(challenge.id)}
                            disabled={isParticipant || joiningChallengeId !== null}
                            className="mt-5 rounded-2xl border border-lime-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-lime-50 disabled:opacity-60"
                          >
                            {isParticipant ? "Già attiva per te" : joiningChallengeId === challenge.id ? "Attivazione..." : "Partecipa alla sfida"}
                          </button>
                        ) : null}
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <section className="rounded-3xl border border-amber-100 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3"><Trophy className="h-5 w-5 text-amber-700" /><h2 className="text-2xl font-bold text-zinc-950">Badge sbloccati e prossimi</h2></div>
              {data.achievements.length === 0 ? (
                <div className="mt-6"><EmptyState title="Nessun badge disponibile" description="I badge configurati per la community appariranno qui con stato raggiunto/non raggiunto." /></div>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {data.achievements.slice(0, 6).map((achievement) => (
                    <article key={achievement.id} className={`rounded-2xl border p-4 ${achievement.earned ? "border-lime-200 bg-lime-50" : "border-amber-100 bg-white"}`}>
                      <p className="text-2xl">{achievement.icon}</p>
                      <h3 className="mt-3 font-semibold text-zinc-950">{achievement.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-zinc-600">{achievement.description}</p>
                      <p className={`mt-3 text-xs font-semibold ${achievement.earned ? "text-lime-700" : "text-zinc-500"}`}>{achievement.earned ? "Ottenuto" : `+${achievement.points} punti`}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-amber-100 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3"><Medal className="h-5 w-5 text-amber-700" /><h2 className="text-2xl font-bold text-zinc-950">Leaderboard top 10</h2></div>
              {data.leaderboard.length === 0 ? (
                <div className="mt-6"><EmptyState title="Leaderboard vuota" description="La classifica comparirà quando i membri inizieranno a guadagnare punti e badge." /></div>
              ) : (
                <div className="mt-6 space-y-3">
                  {data.leaderboard.map((entry) => (
                    <article key={entry.memberId} className={`flex items-center justify-between rounded-2xl border p-4 ${entry.memberId === data.memberPosition?.memberId ? "border-lime-200 bg-lime-50" : "border-amber-100 bg-white"}`}>
                      <div className="flex items-center gap-4">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-900">#{entry.rank}</span>
                        <div>
                          <p className="font-semibold text-zinc-950">{entry.memberName}</p>
                          <p className="text-sm text-zinc-500">{entry.achievementCount} badge</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-lime-700">{entry.points} pt</span>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
