"use client";

import { Heart, MessageCircle, Trophy, UserPlus, Award, Leaf } from "lucide-react";
import { useEffect, useState } from "react";

interface CommunityDashboard {
  feed: Array<{ id: string; authorName: string; type: string; title: string | null; content: string; likesCount: number; commentsCount: number; isPinned: boolean; createdAt: string }>;
  stats: { totalPosts: number; totalReactions: number; totalMessages: number; activeReferrals: number; totalReferralRewardsEuro: number; communityScore: number; co2AvoidedKg: number; treesEquivalent: number; memberEngagementPct: number };
  leaderboard: Array<{ rank: number; memberName: string; sharedEnergyKwh: number; savingsEuro: number; engagementScore: number; streak: number }>;
  activeChallenges: Array<{ id: string; title: string; description: string; progress: number; target: number; unit: string; daysRemaining: number; participantCount: number }>;
  milestones: Array<{ title: string; value: number; unit: string; icon: string; achieved: boolean }>;
}

export default function CommunityPage() {
  const [data, setData] = useState<CommunityDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/community")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">👥 Community & Social</h1>
        <p className="text-zinc-600 mt-1">Feed, messaggi, classifiche, sfide e programma referral</p>
      </div>

      {data?.stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Score community", value: data.stats.communityScore, icon: Heart, color: "text-pink-600" },
            { label: "Post totali", value: data.stats.totalPosts, icon: MessageCircle, color: "text-blue-600" },
            { label: "CO₂ evitata", value: `${(data.stats.co2AvoidedKg / 1000).toFixed(1)}t`, icon: Leaf, color: "text-green-600" },
            { label: "Referral attivi", value: data.stats.activeReferrals, icon: UserPlus, color: "text-purple-600" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-zinc-200 p-4">
              <div className="flex items-center gap-2"><stat.icon className={`h-5 w-5 ${stat.color}`} /><span className="text-sm text-zinc-500">{stat.label}</span></div>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {data?.milestones && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold mb-4">🏆 Traguardi Community</h2>
          <div className="flex flex-wrap gap-4">
            {data.milestones.map((m, i) => (
              <div key={i} className={`flex items-center gap-2 px-4 py-2 rounded-full border ${m.achieved ? "bg-amber-50 border-amber-300" : "bg-zinc-50 border-zinc-200 opacity-60"}`}>
                <span className="text-xl">{m.icon}</span>
                <span className={`text-sm font-medium ${m.achieved ? "text-amber-800" : "text-zinc-500"}`}>{m.title}</span>
                {m.achieved && <Award className="h-4 w-4 text-amber-600" />}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data?.leaderboard && data.leaderboard.length > 0 && (
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <h2 className="text-lg font-semibold mb-4">🥇 Classifica Energia</h2>
            <div className="space-y-3">
              {data.leaderboard.slice(0, 5).map((m) => (
                <div key={m.rank} className="flex items-center gap-3">
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${m.rank === 1 ? "bg-amber-100 text-amber-700" : m.rank === 2 ? "bg-zinc-200 text-zinc-700" : m.rank === 3 ? "bg-orange-100 text-orange-700" : "bg-zinc-50 text-zinc-500"}`}>{m.rank}</span>
                  <div className="flex-1">
                    <span className="font-medium">{m.memberName}</span>
                    <div className="text-xs text-zinc-500">{m.sharedEnergyKwh} kWh condivisi · 🔥 {m.streak}g</div>
                  </div>
                  <span className="text-sm font-bold text-green-600">€{m.savingsEuro}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data?.activeChallenges && data.activeChallenges.length > 0 && (
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <h2 className="text-lg font-semibold mb-4">🎯 Sfide Attive</h2>
            <div className="space-y-4">
              {data.activeChallenges.map((c) => (
                <div key={c.id} className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">{c.title}</h3>
                    <span className="text-xs text-zinc-500">{c.daysRemaining}g rimanenti</span>
                  </div>
                  <p className="text-sm text-zinc-600 mt-1">{c.description}</p>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-zinc-500 mb-1">
                      <span>{c.progress}/{c.target} {c.unit}</span>
                      <span>{c.participantCount} partecipanti</span>
                    </div>
                    <div className="w-full bg-zinc-200 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${Math.min((c.progress / c.target) * 100, 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {data?.feed && data.feed.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold mb-4">📰 Feed Community</h2>
          <div className="space-y-4">
            {data.feed.slice(0, 10).map((post) => (
              <div key={post.id} className={`p-4 rounded-lg border ${post.isPinned ? "bg-amber-50 border-amber-200" : "bg-zinc-50 border-zinc-200"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-sm font-bold text-amber-800">{post.authorName.charAt(0)}</span>
                  <div>
                    <span className="font-medium text-sm">{post.authorName}</span>
                    <span className="text-xs text-zinc-500 ml-2">{new Date(post.createdAt).toLocaleDateString("it-IT")}</span>
                  </div>
                  {post.isPinned && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full ml-auto">📌 In evidenza</span>}
                </div>
                {post.title && <h3 className="font-medium">{post.title}</h3>}
                <p className="text-sm text-zinc-700 mt-1">{post.content}</p>
                <div className="flex gap-4 mt-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {post.likesCount}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {post.commentsCount}</span>
                  <span className="capitalize">{post.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
