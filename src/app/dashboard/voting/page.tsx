"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { VoteRecord, VoteResults } from "@/lib/voting";
import { DataFreshness } from "@/components/ui/data-freshness";
import { EmptyState } from "@/components/ui/empty-state";
import { FetchError } from "@/components/ui/fetch-error";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast-provider";

type VoteWithResults = VoteRecord & { results: VoteResults | null };

type SessionUser = { id: string; name: string; role: string } | null;

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

const defaultOptions = ["Favorevole", "Contrario", "Astenuto"];

/** Returns a short relative-time label for open/scheduled votes, or null for others. */
function getUrgencyPill(vote: VoteWithResults): { label: string; className: string } | null {
  const now = Date.now();
  const scheduledMs = new Date(vote.scheduledAt).getTime();
  const closesMs = new Date(vote.closesAt).getTime();

  const formatRelative = (diffMs: number): string => {
    const totalMinutes = Math.floor(diffMs / 60_000);
    if (totalMinutes < 60) return `${totalMinutes} min`;
    const totalHours = Math.floor(diffMs / 3_600_000);
    if (totalHours < 24) return `${totalHours} ora${totalHours !== 1 ? "e" : ""}`;
    const totalDays = Math.floor(diffMs / 86_400_000);
    return `${totalDays} giorno${totalDays !== 1 ? "i" : ""}`;
  };

  if (vote.status === "aperta" && closesMs > now) {
    const diff = closesMs - now;
    const label = `Chiude tra ${formatRelative(diff)}`;
    const urgent = diff < 24 * 3_600_000;
    return { label, className: urgent ? "bg-red-100 text-red-700" : "bg-lime-100 text-lime-800" };
  }

  if (vote.status === "programmata" && scheduledMs > now) {
    const diff = scheduledMs - now;
    return { label: `Apre tra ${formatRelative(diff)}`, className: "bg-amber-100 text-amber-800" };
  }

  return null;
}

function createDefaultVoteForm() {
  const now = new Date();
  const scheduledAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
  const closesAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

  return {
    title: "",
    description: "",
    optionsInput: defaultOptions.join(", "),
    voteType: "open" as "open" | "secret",
    quorum: "Maggioranza semplice",
    quorumPct: 51,
    scheduledAt,
    closesAt,
  };
}

export default function VotingPage() {
  const { showToast } = useToast();
  const [votes, setVotes] = useState<VoteWithResults[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [castingVote, setCastingVote] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentUser, setCurrentUser] = useState<SessionUser>(null);
  const [newVote, setNewVote] = useState(createDefaultVoteForm);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  // Tracks the choice committed by the current user in-session, keyed by voteId.
  // Only stored client-side to preserve secret-ballot constraints.
  const [myChoices, setMyChoices] = useState<Record<string, string>>({});

  const loadVotes = useCallback(async () => {
    setLoadError(null);
    try {
      const [votesResponse, sessionResponse] = await Promise.all([fetch("/api/votes"), fetch("/api/auth/session")]);
      if (!votesResponse.ok) {
        throw new Error(`Errore ${votesResponse.status}: impossibile caricare le votazioni.`);
      }
      const votesData = (await votesResponse.json()) as VoteWithResults[];
      setVotes(votesData);
      setSelectedVote((current) => current || votesData[0]?.id || null);
      setLastUpdated(new Date().toISOString());

      if (sessionResponse.ok) {
        const sessionData = (await sessionResponse.json()) as { user?: SessionUser };
        setCurrentUser(sessionData.user || null);
      } else {
        setCurrentUser(null);
      }
    } catch (caughtError) {
      setLoadError((caughtError as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoadError(null);
      try {
        const [votesResponse, sessionResponse] = await Promise.all([fetch("/api/votes"), fetch("/api/auth/session")]);
        if (!votesResponse.ok) throw new Error(`Errore ${votesResponse.status}: impossibile caricare le votazioni.`);
        const votesData = (await votesResponse.json()) as VoteWithResults[];
        if (!active) return;
        setVotes(votesData);
        setSelectedVote((current) => current || votesData[0]?.id || null);
        setLastUpdated(new Date().toISOString());
        if (sessionResponse.ok) {
          const sessionData = (await sessionResponse.json()) as { user?: SessionUser };
          setCurrentUser(sessionData.user || null);
        } else {
          setCurrentUser(null);
        }
      } catch (caughtError) {
        if (active) setLoadError((caughtError as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const handleCastVote = async (voteId: string, choice: string) => {
    setCastingVote(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cast", voteId, choice }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Errore nel voto.");
      }
      setFeedback("Voto registrato correttamente!");
      setMyChoices((prev) => ({ ...prev, [voteId]: choice }));
      showToast({ title: "Voto registrato", description: "La tua preferenza è stata salvata nella votazione corrente.", variant: "success" });
      await loadVotes();
    } catch (caughtError) {
      const message = (caughtError as Error).message;
      setFeedback(message);
      showToast({ title: "Votazione non riuscita", description: message, variant: "error" });
    } finally {
      setCastingVote(false);
    }
  };

  const handleCreateVote = async (event: React.FormEvent) => {
    event.preventDefault();
    const options = newVote.optionsInput.split(",").map((option) => option.trim()).filter(Boolean);

    try {
      const response = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          title: newVote.title,
          description: newVote.description,
          options,
          voteType: newVote.voteType,
          quorum: newVote.quorum,
          quorumPct: newVote.quorumPct,
          scheduledAt: new Date(newVote.scheduledAt).toISOString(),
          closesAt: new Date(newVote.closesAt).toISOString(),
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Impossibile creare la votazione.");
      }
      setShowCreateForm(false);
      setNewVote(createDefaultVoteForm());
      showToast({ title: "Votazione creata", description: "L'ordine del giorno è pronto e visibile ai membri autorizzati.", variant: "success" });
      await loadVotes();
    } catch (caughtError) {
      showToast({ title: "Creazione non riuscita", description: (caughtError as Error).message, variant: "error" });
    }
  };

  const selected = useMemo(() => votes.find((vote) => vote.id === selectedVote) || null, [selectedVote, votes]);
  const hasAlreadyVoted = Boolean(selected && currentUser && selected.ballots.some((ballot) => ballot.userId === currentUser.id));
  // The choice committed in this session for the selected vote (if any)
  const committedChoice = selected ? (myChoices[selected.id] ?? null) : null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Governance digitale"
        title="Votazioni e assemblee CER"
        description="Dalla preparazione dell'ordine del giorno alla raccolta del quorum: ora la piattaforma usa la sessione reale del membro e rende più chiari tempi, esito e prossimi passi."
        actions={
          <div className="flex items-center gap-4">
            <DataFreshness
              lastUpdated={lastUpdated}
              onRefresh={() => { setLoading(true); void loadVotes(); }}
              refreshing={loading}
            />
            <button
              onClick={() => setShowCreateForm((current) => !current)}
              className="rounded-2xl bg-lime-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-lime-200 transition hover:bg-lime-700"
            >
              {showCreateForm ? "Chiudi" : "+ Nuova votazione"}
            </button>
          </div>
        }
      />

      {!currentUser ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-zinc-700">
          Accedi con il tuo account CER per votare o creare una nuova consultazione.
        </div>
      ) : null}

      {showCreateForm ? (
        <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-2xl font-bold text-zinc-950">Crea nuova votazione</h2>
          <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleCreateVote}>
            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-semibold text-zinc-700">Titolo</span>
              <input value={newVote.title} onChange={(event) => setNewVote({ ...newVote, title: event.target.value })} className="rounded-2xl border border-lime-200 bg-amber-50/60 px-4 py-3 outline-none transition focus:border-lime-500" required />
            </label>
            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-semibold text-zinc-700">Descrizione</span>
              <textarea value={newVote.description} onChange={(event) => setNewVote({ ...newVote, description: event.target.value })} className="rounded-2xl border border-lime-200 bg-amber-50/60 px-4 py-3 outline-none transition focus:border-lime-500" rows={3} />
            </label>
            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-semibold text-zinc-700">Opzioni di voto</span>
              <input value={newVote.optionsInput} onChange={(event) => setNewVote({ ...newVote, optionsInput: event.target.value })} className="rounded-2xl border border-lime-200 bg-amber-50/60 px-4 py-3 outline-none transition focus:border-lime-500" placeholder="Favorevole, Contrario, Astenuto" required />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-zinc-700">Tipo voto</span>
              <select value={newVote.voteType} onChange={(event) => setNewVote({ ...newVote, voteType: event.target.value as "open" | "secret" })} className="rounded-2xl border border-lime-200 bg-amber-50/60 px-4 py-3 outline-none transition focus:border-lime-500">
                <option value="open">Voto aperto</option>
                <option value="secret">Voto segreto</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-zinc-700">Quorum richiesto (%)</span>
              <input type="number" value={newVote.quorumPct} onChange={(event) => setNewVote({ ...newVote, quorumPct: Number(event.target.value), quorum: `${event.target.value}%` })} className="rounded-2xl border border-lime-200 bg-amber-50/60 px-4 py-3 outline-none transition focus:border-lime-500" min={1} max={100} />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-zinc-700">Apre il</span>
              <input type="datetime-local" value={newVote.scheduledAt} onChange={(event) => setNewVote({ ...newVote, scheduledAt: event.target.value })} className="rounded-2xl border border-lime-200 bg-amber-50/60 px-4 py-3 outline-none transition focus:border-lime-500" required />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-zinc-700">Chiude il</span>
              <input type="datetime-local" value={newVote.closesAt} onChange={(event) => setNewVote({ ...newVote, closesAt: event.target.value })} className="rounded-2xl border border-lime-200 bg-amber-50/60 px-4 py-3 outline-none transition focus:border-lime-500" required />
            </label>
            <button type="submit" className="inline-flex items-center justify-center rounded-2xl bg-lime-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-lime-200 transition hover:bg-lime-700 md:col-span-2">
              Crea votazione
            </button>
          </form>
        </section>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : null}

      {loadError ? (
        <FetchError
          title="Impossibile caricare le votazioni"
          description="Verifica la connessione e riprova. Le votazioni della CER saranno disponibili appena il servizio risponde."
          errorDetail={loadError}
          onRetry={() => { setLoading(true); void loadVotes(); }}
        />
      ) : null}

      {votes.length === 0 && !loading && !loadError ? (
        <EmptyState
          title="Nessuna votazione disponibile"
          description="Quando il board aprirà il prossimo ordine del giorno, troverai qui agenda, quorum e pulsanti di voto."
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-zinc-950">Votazioni</h2>
          {votes.map((vote) => (
            <button
              key={vote.id}
              type="button"
              onClick={() => setSelectedVote(vote.id)}
              className={`w-full rounded-2xl border p-5 text-left transition ${
                selectedVote === vote.id ? "border-lime-500 bg-lime-50/70 ring-1 ring-lime-200" : "border-amber-100 bg-amber-50/70 hover:border-lime-300"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-semibold text-zinc-950">{vote.title}</h3>
                <div className="flex items-center gap-2 shrink-0">
                  {(() => { const pill = getUrgencyPill(vote); return pill ? <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${pill.className}`}>{pill.label}</span> : null; })()}
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[vote.status] || ""}`}>
                    {statusLabels[vote.status] || vote.status}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm text-zinc-600">{vote.description}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-500">
                <span>Quorum: {vote.quorum}</span>
                <span>Tipo: {vote.voteType === "secret" ? "Segreto" : "Aperto"}</span>
                <span>Apre: {new Date(vote.scheduledAt).toLocaleString("it-IT")}</span>
                {vote.results ? <span>Partecipazione: {vote.results.participationPct.toFixed(0)}%</span> : null}
              </div>
            </button>
          ))}
        </section>

        {selected ? (
          <section className="space-y-6">
            <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-2xl font-bold text-zinc-950">{selected.title}</h2>
                {(() => { const pill = getUrgencyPill(selected); return pill ? <span className={`rounded-full px-3 py-1 text-sm font-semibold ${pill.className}`}>{pill.label}</span> : null; })()}
              </div>
              <p className="mt-2 text-sm text-zinc-600">{selected.description}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-amber-50/70 p-4 text-sm text-zinc-700">
                  <p className="font-semibold text-zinc-950">Finestra di voto</p>
                  <p className="mt-1">Dal {new Date(selected.scheduledAt).toLocaleString("it-IT")} al {new Date(selected.closesAt).toLocaleString("it-IT")}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 text-sm text-zinc-700 ring-1 ring-lime-100">
                  <p className="font-semibold text-zinc-950">Il tuo stato</p>
                  <p className="mt-1">{currentUser ? (hasAlreadyVoted ? "Hai già espresso il voto per questa consultazione." : "Puoi partecipare con l'identità associata alla tua sessione.") : "Accedi per vedere e usare il pulsante di voto."}</p>
                </div>
              </div>

              {selected.results ? (
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
                      <div className={`h-full rounded-full transition-all ${selected.results.quorumReached ? "bg-lime-500" : "bg-amber-400"}`} style={{ width: `${Math.min(selected.results.participationPct, 100)}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">{selected.results.totalBallots} voti su {selected.results.totalEligible} aventi diritto</p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-zinc-950">Risultati</h3>
                    {selected.results.results.map((result) => (
                      <div key={result.option} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold text-zinc-700">{result.option}</span>
                          <span className="text-zinc-600">{result.count} voti ({result.pct.toFixed(1)}%)</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-zinc-100">
                          <div className="h-full rounded-full bg-lime-500" style={{ width: `${result.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {selected.status === "aperta" ? (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-zinc-950">Esprimi il tuo voto</h3>
                  {!currentUser ? <p className="mt-2 text-sm text-zinc-600">Accedi per usare i pulsanti di voto.</p> : null}
                  {hasAlreadyVoted ? (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm text-lime-700">Hai già votato per questa consultazione.</span>
                      {committedChoice && (
                        <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-semibold text-lime-800">
                          ✓ La tua scelta: {committedChoice}
                        </span>
                      )}
                    </div>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-3">
                    {selected.options.map((option) => {
                      const isPressed = committedChoice === option;
                      return (
                        <button
                          key={option}
                          onClick={() => void handleCastVote(selected.id, option)}
                          disabled={castingVote || !currentUser || hasAlreadyVoted}
                          aria-pressed={isPressed}
                          className={`rounded-2xl border px-5 py-3 text-sm font-semibold transition disabled:opacity-60 ${
                            isPressed
                              ? "border-lime-500 bg-lime-100 text-lime-900 ring-1 ring-lime-400"
                              : "border-lime-200 bg-white text-zinc-700 hover:border-lime-400 hover:bg-lime-50"
                          }`}
                        >
                          {isPressed ? `✓ ${option}` : option}
                        </button>
                      );
                    })}
                  </div>
                  {feedback ? <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-zinc-700">{feedback}</p> : null}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                  {selected.status === "programmata"
                    ? "La votazione non è ancora aperta: usa date e orari sopra per organizzare il promemoria ai membri."
                    : "La votazione è chiusa: consulta i risultati e il registro per la verbalizzazione."}
                </div>
              )}
            </div>

            {selected.voteType === "open" && selected.ballots.length > 0 ? (
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
                      {selected.ballots.slice(0, 10).map((ballot) => (
                        <tr key={ballot.id}>
                          <td className="py-3 pr-4 font-semibold text-zinc-950">{ballot.userName}</td>
                          <td className="py-3 pr-4 text-zinc-600">{ballot.choice}</td>
                          <td className="py-3 text-xs text-zinc-500">{new Date(ballot.createdAt).toLocaleDateString("it-IT")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}
