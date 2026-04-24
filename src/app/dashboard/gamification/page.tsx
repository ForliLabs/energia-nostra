"use client";

import { Medal, Target, Trophy, Users } from "lucide-react";
import { useEffect, useState } from "react";
import type { ChallengeInfo, LeaderboardEntry } from "@/lib/gamification";

interface GamificationResponse {
  summary: {
    totalAchievementsEarned: number;
    activeChallenges: number;
    totalChallengeParticipants: number;
    avgAchievementsPerMember: number;
  };
  leaderboard: LeaderboardEntry[];
  challenges: ChallengeInfo[];
}

const getChallengeProgress = (challenge: ChallengeInfo) => {
  if (typeof challenge.myProgress === "number" && challenge.targetValue > 0) {
    return Math.min(100, (challenge.myProgress / challenge.targetValue) * 100);
  }

  const startDate = new Date(challenge.startDate).getTime();
  const endDate = new Date(challenge.endDate).getTime();
  const now = Date.now();

  if (!Number.isFinite(startDate) || !Number.isFinite(endDate) || endDate <= startDate) {
    return 0;
  }

  if (now <= startDate) {
    return 0;
  }

  if (now >= endDate) {
    return 100;
  }

  return ((now - startDate) / (endDate - startDate)) * 100;
};

const formatDate = (value: string) => new Date(value).toLocaleDateString("it-IT");

export default function GamificationPage() {
  const [data, setData] = useState<GamificationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    Promise.resolve().then(async () => {
      try {
        const response = await fetch("/api/gamification");
        if (!response.ok) {
          throw new Error("Impossibile recuperare la gamification.");
        }
        const payload = (await response.json()) as GamificationResponse;
        if (active) {
          setData(payload);
          setError(null);
        }
      } catch {
        if (active) {
          setError("Impossibile caricare sfide e badge.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const activeChallenges = data?.challenges.filter((challenge) => challenge.status === "active") ?? [];

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-amber-200 bg-white/90 p-8 shadow-lg shadow-amber-100/40">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">Engagement comunità</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">Sfide &amp; Badge</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600">
          Classifiche, sfide attive e progressi della community per aumentare partecipazione e autoconsumo condiviso.
        </p>
      </section>

      {loading && !data && <p className="text-sm text-zinc-500">Caricamento...</p>}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-amber-700">
                <Trophy className="h-5 w-5" />
                <p className="text-sm font-medium text-zinc-500">Achievement ottenuti</p>
              </div>
              <p className="mt-4 text-3xl font-bold text-amber-900">{data.summary.totalAchievementsEarned}</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-amber-700">
                <Target className="h-5 w-5" />
                <p className="text-sm font-medium text-zinc-500">Sfide attive</p>
              </div>
              <p className="mt-4 text-3xl font-bold text-amber-900">{data.summary.activeChallenges}</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-amber-700">
                <Users className="h-5 w-5" />
                <p className="text-sm font-medium text-zinc-500">Partecipanti</p>
              </div>
              <p className="mt-4 text-3xl font-bold text-amber-900">{data.summary.totalChallengeParticipants}</p>
            </div>
          </div>

          <section className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Medal className="h-5 w-5 text-amber-700" />
              <h2 className="text-lg font-semibold text-amber-900">Leaderboard top 10</h2>
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full divide-y divide-amber-100 text-sm">
                <thead>
                  <tr className="text-left text-zinc-500">
                    <th className="pb-3 pr-4 font-semibold">Rank</th>
                    <th className="pb-3 pr-4 font-semibold">Nome</th>
                    <th className="pb-3 pr-4 font-semibold">Punti</th>
                    <th className="pb-3 font-semibold">Badge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {data.leaderboard.slice(0, 10).map((entry) => (
                    <tr key={entry.memberId}>
                      <td className="py-4 pr-4 font-semibold text-amber-900">#{entry.rank}</td>
                      <td className="py-4 pr-4 font-semibold text-zinc-950">{entry.memberName}</td>
                      <td className="py-4 pr-4 text-zinc-700">{entry.points}</td>
                      <td className="py-4">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-lime-100 text-lime-800">
                          {entry.achievementCount} badge
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-amber-700" />
              <h2 className="text-lg font-semibold text-amber-900">Sfide attive</h2>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {activeChallenges.map((challenge) => {
                const progress = getChallengeProgress(challenge);
                return (
                  <article key={challenge.id} className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-950">{challenge.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-zinc-600">{challenge.description}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-lime-100 text-lime-800">Attiva</span>
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-zinc-600">
                      <p>
                        Target: <span className="font-semibold text-zinc-800">{challenge.targetValue} {challenge.unit}</span>
                      </p>
                      <p>
                        Periodo: <span className="font-semibold text-zinc-800">{formatDate(challenge.startDate)} - {formatDate(challenge.endDate)}</span>
                      </p>
                      <p>
                        Partecipanti: <span className="font-semibold text-zinc-800">{challenge.participantCount}</span>
                      </p>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-zinc-700">
                          {typeof challenge.myProgress === "number" ? "Progressione personale" : "Progressione sfida"}
                        </span>
                        <span className="text-zinc-600">{Math.round(progress)}%</span>
                      </div>
                      <div className="mt-2 h-3 overflow-hidden rounded-full bg-amber-100">
                        <div className="h-full rounded-full bg-lime-500" style={{ width: `${Math.min(progress, 100)}%` }} />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
