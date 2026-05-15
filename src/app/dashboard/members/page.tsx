"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getMemberBenefitStatement, type CerMember, cerMembers, type MemberType } from "@/lib/data";
import { DataFreshness } from "@/components/ui/data-freshness";
import { FetchError } from "@/components/ui/fetch-error";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

interface FormState {
  name: string;
  type: MemberType;
  podCode: string;
  energyBalanceKwh: string;
}

function isApiError(value: unknown): value is { error: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as { error?: unknown }).error === "string"
  );
}

type FeedbackState = { message: string; variant: "success" | "error" } | null;

export default function MembersPage() {
  const [members, setMembers] = useState<CerMember[]>(cerMembers);
  const [form, setForm] = useState<FormState>({
    name: "",
    type: "prosumer",
    podCode: "",
    energyBalanceKwh: "120",
  });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    setFetchError(null);
    try {
      const response = await fetch("/api/members");
      if (!response.ok) {
        throw new Error(`Errore ${response.status}: impossibile caricare l'anagrafica.`);
      }
      const data: CerMember[] = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setMembers(data);
      }
      setLastUpdated(new Date().toISOString());
    } catch (caughtError) {
      setFetchError((caughtError as Error).message);
    }
  }, []);

  useEffect(() => {
    let active = true;

    fetch("/api/members")
      .then((response) => {
        if (!response.ok) throw new Error(`Errore ${response.status}`);
        return response.json();
      })
      .then((data: CerMember[]) => {
        if (active && Array.isArray(data) && data.length > 0) {
          setMembers(data);
          setLastUpdated(new Date().toISOString());
        }
      })
      .catch((err) => {
        if (active) {
          setFetchError((err as Error).message);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const counters = useMemo(
    () => ({
      produttori: members.filter((member) => member.type === "produttore").length,
      consumatori: members.filter((member) => member.type === "consumatore").length,
      prosumer: members.filter((member) => member.type === "prosumer").length,
    }),
    [members]
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          podCode: form.podCode,
          energyBalanceKwh: Number(form.energyBalanceKwh),
        }),
      });

      const payload: unknown = await response.json();

      if (!response.ok) {
        setFeedback({
          message: isApiError(payload) ? payload.error : "Impossibile aggiungere il membro.",
          variant: "error",
        });
        return;
      }

      if (isApiError(payload)) {
        setFeedback({ message: payload.error, variant: "error" });
        return;
      }

      const createdMember = payload as CerMember;
      setMembers((current) => [createdMember, ...current]);
      setForm({ name: "", type: "prosumer", podCode: "", energyBalanceKwh: "120" });
      setFeedback({ message: "Membro aggiunto correttamente alla CER.", variant: "success" });
    } catch {
      setFeedback({ message: "Errore di rete: impossibile contattare l'API membri. Controlla la connessione e riprova.", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-amber-200 bg-white/90 p-8 shadow-lg shadow-amber-100/40">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">Gestione membri</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
              Anagrafiche, ruoli e benefici della CER
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600">
              Monitora pod, saldi energetici e prospetti economici mensili di produttori, consumatori e prosumer.
            </p>
          </div>
          <DataFreshness
            lastUpdated={lastUpdated}
            onRefresh={() => void loadMembers()}
          />
        </div>
      </section>

      {fetchError ? (
        <FetchError
          title="Impossibile caricare l'anagrafica membri"
          description="I dati visualizzati potrebbero non essere aggiornati. Riprova per ottenere l'elenco dal database."
          errorDetail={fetchError}
          onRetry={() => void loadMembers()}
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Produttori</p>
          <p className="mt-2 text-3xl font-bold text-zinc-950">{counters.produttori}</p>
        </div>
        <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Prosumer</p>
          <p className="mt-2 text-3xl font-bold text-zinc-950">{counters.prosumer}</p>
        </div>
        <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Consumatori</p>
          <p className="mt-2 text-3xl font-bold text-zinc-950">{counters.consumatori}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-2xl font-bold text-zinc-950">Aggiungi membro</h2>
          <p className="mt-2 text-sm text-zinc-600">Registra un nuovo soggetto con POD e saldo energetico iniziale.</p>

          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-zinc-700">Nome membro</span>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="rounded-2xl border border-lime-200 bg-amber-50/60 px-4 py-3 outline-none transition focus:border-lime-500"
                placeholder="Es. Condominio Via Roma"
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-zinc-700">Tipologia</span>
              <select
                value={form.type}
                onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as MemberType }))}
                className="rounded-2xl border border-lime-200 bg-amber-50/60 px-4 py-3 outline-none transition focus:border-lime-500"
              >
                <option value="produttore">Produttore</option>
                <option value="consumatore">Consumatore</option>
                <option value="prosumer">Prosumer</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-zinc-700">Codice POD</span>
              <input
                value={form.podCode}
                onChange={(event) => setForm((current) => ({ ...current, podCode: event.target.value.toUpperCase() }))}
                className="rounded-2xl border border-lime-200 bg-amber-50/60 px-4 py-3 uppercase outline-none transition focus:border-lime-500"
                placeholder="IT001E123456789"
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-zinc-700">Saldo energetico iniziale (kWh)</span>
              <input
                type="number"
                value={form.energyBalanceKwh}
                onChange={(event) => setForm((current) => ({ ...current, energyBalanceKwh: event.target.value }))}
                className="rounded-2xl border border-lime-200 bg-amber-50/60 px-4 py-3 outline-none transition focus:border-lime-500"
                required
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-2xl bg-lime-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-lime-200 transition hover:bg-lime-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Salvataggio..." : "Aggiungi membro"}
            </button>
          </form>

          {feedback && (
            <div
              role={feedback.variant === "error" ? "alert" : "status"}
              className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
                feedback.variant === "success"
                  ? "border border-lime-200 bg-lime-50 text-lime-800"
                  : "border border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {feedback.variant === "success" ? "✓ " : "✗ "}
              {feedback.message}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-zinc-950">Elenco membri</h2>
              <p className="mt-2 text-sm text-zinc-600">Anagrafica completa con statement di beneficio mensile.</p>
            </div>
            <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-semibold text-lime-800">
              {members.length} record
            </span>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-lime-100 text-sm">
              <thead>
                <tr className="text-left text-zinc-500">
                  <th className="pb-3 pr-4 font-semibold">Nome</th>
                  <th className="pb-3 pr-4 font-semibold">Tipo</th>
                  <th className="pb-3 pr-4 font-semibold">POD</th>
                  <th className="pb-3 pr-4 font-semibold">Saldo energia</th>
                  <th className="pb-3 font-semibold">Statement beneficio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lime-50">
                {members.map((member) => (
                  <tr key={member.id} className="align-top">
                    <td className="py-4 pr-4 font-semibold text-zinc-950">{member.name}</td>
                    <td className="py-4 pr-4 capitalize text-zinc-600">{member.type}</td>
                    <td className="py-4 pr-4 font-mono text-xs text-zinc-600">{member.podCode}</td>
                    <td className={`py-4 pr-4 font-semibold ${member.energyBalanceKwh >= 0 ? "text-lime-700" : "text-amber-700"}`}>
                      {member.energyBalanceKwh.toLocaleString("it-IT")} kWh
                    </td>
                    <td className="py-4 text-zinc-600">
                      <p>{getMemberBenefitStatement(member)}</p>
                      <p className="mt-1 text-xs font-semibold text-zinc-500">
                        Benefit stimato: {formatCurrency(member.monthlyBenefitEuro)} / mese
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
