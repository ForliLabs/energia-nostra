"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SessionUser } from "@/lib/auth";
import {
  cerProfile,
  cerMembers,
  latestEnergyMonth,
  energySummary,
  energyData,
  memberIncentiveDistribution,
  announcements,
  optimizationSuggestions,
} from "@/lib/data";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

export default function MemberPortalPage() {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data: { user: SessionUser | null }) => setUser(data.user))
      .catch(() => {});
  }, []);

  // For demo, pick the first prosumer member
  const member = cerMembers.find((m) => m.name === "Famiglia Rossi") || cerMembers[0];
  const incentive = memberIncentiveDistribution.find((i) => i.memberId === member.id);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffbea_0%,#f7fee7_42%,#ffffff_100%)]">
      <header className="border-b border-lime-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <Link href="/dashboard" className="text-lg font-black text-lime-950">EnergiaNostra</Link>
            <p className="text-sm text-zinc-500">Portale membro</p>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm font-semibold text-zinc-700">{user.name}</span>
            )}
            <Link href="/dashboard" className="text-sm font-semibold text-lime-700 hover:underline">
              Dashboard CER →
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        <section className="rounded-3xl border border-amber-200 bg-white/90 p-8 shadow-lg shadow-amber-100/40">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">Il tuo riepilogo</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">
            Benvenuto, {member.name}
          </h1>
          <p className="mt-3 text-base text-zinc-600">
            Membro della CER &quot;{cerProfile.name}&quot; · {member.municipality} · {member.type}
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Saldo energetico</p>
            <p className={`mt-2 text-3xl font-bold ${member.energyBalanceKwh >= 0 ? "text-lime-700" : "text-amber-700"}`}>
              {member.energyBalanceKwh.toLocaleString("it-IT")} kWh
            </p>
          </div>
          <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Beneficio mensile</p>
            <p className="mt-2 text-3xl font-bold text-lime-700">
              {formatCurrency(member.monthlyBenefitEuro)}
            </p>
          </div>
          <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Incentivo GSE mese</p>
            <p className="mt-2 text-3xl font-bold text-zinc-950">
              {incentive ? formatCurrency(incentive.monthlyEuro) : "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Incentivo cumulato</p>
            <p className="mt-2 text-3xl font-bold text-zinc-950">
              {incentive ? formatCurrency(incentive.yearToDateEuro) : "—"}
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
            <h2 className="text-2xl font-bold text-zinc-950">Il tuo andamento nella CER</h2>
            <p className="mt-2 text-sm text-zinc-600">Confronto con la media della comunità energetica.</p>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-amber-50/70 p-4">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-zinc-700">La tua quota %</span>
                  <span className="font-bold text-lime-700">{incentive ? `${incentive.sharePct.toFixed(2)}%` : "—"}</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-zinc-200">
                  <div className="h-full rounded-full bg-lime-500" style={{ width: `${(incentive?.sharePct ?? 0) * 2.5}%` }} />
                </div>
                <p className="mt-1 text-xs text-zinc-500">Media CER: {(100 / cerMembers.length).toFixed(2)}%</p>
              </div>

              <div className="rounded-2xl bg-lime-50/70 p-4">
                <p className="text-sm font-semibold text-zinc-700">Energia condivisa CER (ultimo mese)</p>
                <p className="mt-1 text-2xl font-bold text-zinc-950">{latestEnergyMonth.sharedEnergyKwh.toLocaleString("it-IT")} kWh</p>
                <p className="mt-1 text-xs text-zinc-500">Autoconsumo condiviso: {latestEnergyMonth.selfConsumptionPct}%</p>
              </div>

              <div className="rounded-2xl bg-amber-50/70 p-4">
                <p className="text-sm font-semibold text-zinc-700">Risparmio CER complessivo (6 mesi)</p>
                <p className="mt-1 text-2xl font-bold text-zinc-950">{formatCurrency(energySummary.savingsEuro)}</p>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
              <h2 className="text-2xl font-bold text-zinc-950">Statement personale</h2>
              <div className="mt-4 rounded-2xl bg-lime-50 p-5">
                <p className="text-sm leading-6 text-zinc-700">
                  {member.energyBalanceKwh >= 0
                    ? `Metti a disposizione ${member.energyBalanceKwh} kWh netti e maturi un beneficio stimato di ${formatCurrency(member.monthlyBenefitEuro)} al mese.`
                    : `Assorbi ${Math.abs(member.energyBalanceKwh)} kWh condivisi e riduci la bolletta di circa ${formatCurrency(member.monthlyBenefitEuro)} al mese.`
                  }
                </p>
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                POD: {member.podCode} · Iscritto dal {member.joinedAt}
              </p>
            </div>

            <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
              <h2 className="text-2xl font-bold text-zinc-950">Suggerimenti per te</h2>
              <ul className="mt-4 space-y-3">
                {optimizationSuggestions.map((s, i) => (
                  <li key={i} className="rounded-2xl bg-amber-50/70 px-4 py-3 text-sm text-zinc-600">
                    💡 {s}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-2xl font-bold text-zinc-950">Storico energia condivisa</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-lime-100 text-sm">
              <thead>
                <tr className="text-left text-zinc-500">
                  <th className="pb-3 pr-4 font-semibold">Mese</th>
                  <th className="pb-3 pr-4 font-semibold">Produzione CER</th>
                  <th className="pb-3 pr-4 font-semibold">Consumo CER</th>
                  <th className="pb-3 pr-4 font-semibold">Energia condivisa</th>
                  <th className="pb-3 font-semibold">Risparmio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lime-50">
                {energyData.map((m) => (
                  <tr key={m.id}>
                    <td className="py-3 pr-4 font-semibold text-zinc-950">{m.label}</td>
                    <td className="py-3 pr-4 text-zinc-600">{m.productionKwh.toLocaleString("it-IT")} kWh</td>
                    <td className="py-3 pr-4 text-zinc-600">{m.consumptionKwh.toLocaleString("it-IT")} kWh</td>
                    <td className="py-3 pr-4 font-semibold text-lime-700">{m.sharedEnergyKwh.toLocaleString("it-IT")} kWh</td>
                    <td className="py-3 font-semibold text-zinc-950">{formatCurrency(m.savingsEuro)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-2xl font-bold text-zinc-950">Annunci dalla CER</h2>
          <div className="mt-4 space-y-4">
            {announcements.map((a) => (
              <article key={a.id} className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-semibold text-zinc-950">{a.title}</h3>
                  <span className="text-xs font-semibold text-lime-700">{a.publishedAt}</span>
                </div>
                <p className="mt-2 text-sm text-zinc-600">{a.message}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-100 to-lime-100 p-8 shadow-lg shadow-amber-100/40">
          <h2 className="text-2xl font-bold text-zinc-950">Azioni rapide</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <Link
              href="/dashboard/voting"
              className="rounded-2xl border border-lime-200 bg-white p-4 text-center text-sm font-semibold text-zinc-700 transition hover:bg-lime-50"
            >
              🗳️ Votazioni
            </Link>
            <Link
              href="/dashboard/energy"
              className="rounded-2xl border border-lime-200 bg-white p-4 text-center text-sm font-semibold text-zinc-700 transition hover:bg-lime-50"
            >
              ⚡ Energia
            </Link>
            <Link
              href="/dashboard/billing"
              className="rounded-2xl border border-lime-200 bg-white p-4 text-center text-sm font-semibold text-zinc-700 transition hover:bg-lime-50"
            >
              💰 Fatturazione
            </Link>
            <Link
              href="/dashboard/governance"
              className="rounded-2xl border border-lime-200 bg-white p-4 text-center text-sm font-semibold text-zinc-700 transition hover:bg-lime-50"
            >
              📋 Documenti
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
