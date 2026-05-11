"use client";

import { useCallback, useEffect, useState } from "react";
import type { VoteRecord, VoteResults } from "@/lib/voting";

type VoteWithResults = VoteRecord & { results: VoteResults | null };

const statusClasses: Record<string, string> = {
  aperta: "bg-lime-100 text-lime-800",
  programmata: "bg-amber-100 text-amber-800",
  chiusa: "bg-zinc-100 text-zinc-700",
  annullata: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  aperta: "In corso",
  programmata: "Programmata",
  chiusa: "Chiusa",
  annullata: "Annullata",
};

export default function VotingPage() {
  const [votes, setVotes] = useState<VoteWithResults[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [castingVote, setCastingVote] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newVote, setNewVote] = useState({
    title: "",
    description: "",
    options: ["Favorevole", "Contrario", "Astenuto"],
    voteType: "open" as "open" | "secret",
    quorum: "Maggioranza semplice",
    quorumPct: 51,
  });

  const loadVotes = useCallback(async () => {
    try {
      const res = await fetch("/api/votes");
      const data = (await res.json()) as VoteWithResults[];
      setVotes(data);
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadVotes();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadVotes]);

  const handleCastVote = async (voteId: string, choice: string) => {
    setCastingVote(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cast",
          voteId,
          userId: "user-member-1",
          userName: "Mario Rossi",
          choice,
        }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        setFeedback((data as { error?: string })?.error || "Errore nel voto.");
      } else {
        setFeedback("Voto registrato correttamente!");
        loadVotes();
      }
    } catch {
      setFeedback("Errore di rete.");
    } finally {
      setCastingVote(false);
    }
  };

  const handleCreateVote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", ...newVote }),
      });
      if (res.ok) {
        setShowCreateForm(false);
        setNewVote({ title: "", description: "", options: ["Favorevole", "Contrario", "Astenuto"], voteType: "open", quorum: "Maggioranza semplice", quorumPct: 51 });
        loadVotes();
      }
    } catch {
      // ignore
    }
  };

  const selected = votes.find((v) => v.id === selectedVote);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-amber-200 bg-white/90 p-8 shadow-lg shadow-amber-100/40">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">Governance digitale</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
              Votazioni e assemblee CER
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600">
              Crea votazioni, esprimi il tuo voto e monitora quorum e risultati in tempo reale.
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="rounded-2xl bg-lime-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-lime-200 transition hover:bg-lime-700"
          >
            {showCreateForm ? "Chiudi" : "+ Nuova votazione"}
          </button>
        </div>
      </section>

      {showCreateForm && (
        <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-2xl font-bold text-zinc-950">Crea nuova votazione</h2>
          <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleCreateVote}>
            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-semibold text-zinc-700">Titolo</span>
              <input
                value={newVote.title}
                onChange={(e) => setNewVote({ ...newVote, title: e.target.value })}
                className="rounded-2xl border border-lime-200 bg-amber-50/60 px-4 py-3 outline-none transition focus:border-lime-500"
                required
              />
            </label>
            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-semibold text-zinc-700">Descrizione</span>
              <textarea
                value={newVote.description}
                onChange={(e) => setNewVote({ ...newVote, description: e.target.value })}
                className="rounded-2xl border border-lime-200 bg-amber-50/60 px-4 py-3 outline-none transition focus:border-lime-500"
                rows={3}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-zinc-700">Tipo voto</span>
              <select
                value={newVote.voteType}
                onChange={(e) => setNewVote({ ...newVote, voteType: e.target.value as "open" | "secret" })}
                className="rounded-2xl border border-lime-200 bg-amber-50/60 px-4 py-3 outline-none transition focus:border-lime-500"
              >
                <option value="open">Voto aperto</option>
                <option value="secret">Voto segreto</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-zinc-700">Quorum richiesto (%)</span>
              <input
                type="number"
                value={newVote.quorumPct}
                onChange={(e) => setNewVote({ ...newVote, quorumPct: Number(e.target.value) })}
                className="rounded-2xl border border-lime-200 bg-amber-50/60 px-4 py-3 outline-none transition focus:border-lime-500"
                min={1}
                max={100}
              />
            </label>
            <button
              type="submit"
              className="md:col-span-2 inline-flex items-center justify-center rounded-2xl bg-lime-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-lime-200 transition hover:bg-lime-700"
            >
              Crea votazione
            </button>
          </form>
        </section>
      )}

      {loading && <p className="text-sm text-zinc-500">Caricamento votazioni...</p>}

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-zinc-950">Votazioni</h2>
          {votes.map((vote) => (
            <article
              key={vote.id}
              onClick={() => setSelectedVote(vote.id)}
              className={`cursor-pointer rounded-2xl border p-5 transition ${
                selectedVote === vote.id
                  ? "border-lime-500 bg-lime-50/70 ring-1 ring-lime-200"
                  : "border-amber-100 bg-amber-50/70 hover:border-lime-300"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-semibold text-zinc-950">{vote.title}</h3>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[vote.status] || ""}`}>
                  {statusLabels[vote.status] || vote.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-600">{vote.description}</p>
              <div className="mt-3 flex gap-4 text-xs text-zinc-500">
                <span>Quorum: {vote.quorum}</span>
                <span>Tipo: {vote.voteType === "secret" ? "Segreto" : "Aperto"}</span>
                {vote.results && (
                  <span>Partecipazione: {vote.results.participationPct.toFixed(0)}%</span>
                )}
              </div>
            </article>
          ))}
        </section>

        {selected && (
          <section className="space-y-6">
            <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
              <h2 className="text-2xl font-bold text-zinc-950">{selected.title}</h2>
              <p className="mt-2 text-sm text-zinc-600">{selected.description}</p>

              {selected.results && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between rounded-2xl bg-amber-50/70 p-4">
                    <span className="text-sm font-semibold text-zinc-700">Quorum</span>
                    <span className={`text-sm font-bold ${selected.results.quorumReached ? "text-lime-700" : "text-amber-700"}`}>
                      {selected.results.quorumReached ? "✓ Raggiunto" : "✗ Non raggiunto"} ({selected.results.participationPct.toFixed(0)}% / {selected.quorumPct}%)
                    </span>
                  </div>

                  <div className="rounded-2xl bg-lime-50/70 p-4">
                    <p className="text-sm font-semibold text-zinc-700">Progressione quorum</p>
                    <div className="mt-2 h-4 overflow-hidden rounded-full bg-zinc-200">
                      <div
                        className={`h-full rounded-full transition-all ${selected.results.quorumReached ? "bg-lime-500" : "bg-amber-400"}`}
                        style={{ width: `${Math.min(selected.results.participationPct, 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {selected.results.totalBallots} voti su {selected.results.totalEligible} aventi diritto
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-zinc-950">Risultati</h3>
                    {selected.results.results.map((r) => (
                      <div key={r.option} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold text-zinc-700">{r.option}</span>
                          <span className="text-zinc-600">{r.count} voti ({r.pct.toFixed(1)}%)</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-zinc-100">
                          <div className="h-full rounded-full bg-lime-500" style={{ width: `${r.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selected.status === "aperta" && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-zinc-950">Esprimi il tuo voto</h3>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {selected.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleCastVote(selected.id, option)}
                        disabled={castingVote}
                        className="rounded-2xl border border-lime-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-lime-50 hover:border-lime-400 disabled:opacity-60"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  {feedback && (
                    <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-zinc-700">{feedback}</p>
                  )}
                </div>
              )}
            </div>

            {selected.voteType === "open" && selected.ballots.length > 0 && (
              <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
                <h3 className="text-lg font-semibold text-zinc-950">Registro voti (voto aperto)</h3>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-lime-100 text-sm">
                    <thead>
                      <tr className="text-left text-zinc-500">
                        <th className="pb-3 pr-4 font-semibold">Membro</th>
                        <th className="pb-3 pr-4 font-semibold">Scelta</th>
                        <th className="pb-3 font-semibold">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-lime-50">
                      {selected.ballots.slice(0, 10).map((b) => (
                        <tr key={b.id}>
                          <td className="py-3 pr-4 font-semibold text-zinc-950">{b.userName}</td>
                          <td className="py-3 pr-4 text-zinc-600">{b.choice}</td>
                          <td className="py-3 text-zinc-500 text-xs">{new Date(b.createdAt).toLocaleDateString("it-IT")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
