import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getPricingTiers } from "@/lib/trial";

const navItems = [
  { label: "Funzionalità", href: "/#funzionalita" },
  { label: "Prezzi", href: "/pricing" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Accedi", href: "/login" },
];

export const metadata = {
  title: "Prezzi",
  description: "Piani e prezzi per la gestione della tua Comunità Energetica Rinnovabile.",
};

export default function PricingPage() {
  const tiers = getPricingTiers();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar brand="EnergiaNostra" items={navItems} ctaLabel="Prova gratuita" ctaHref="/registrazione" />

      <main id="main-content" className="flex-1">
        <section className="bg-gradient-to-b from-amber-50 to-white py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl">
                Prezzi semplici, trasparenti
              </h1>
              <p className="mt-4 text-lg text-zinc-600">
                Scegli il piano giusto per la tua CER. Prova gratuita di 30 giorni, senza impegno.
              </p>
            </div>

            <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-3">
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`flex flex-col rounded-2xl border bg-white p-8 shadow-sm ${
                    tier.highlighted ? "border-lime-500 ring-2 ring-lime-400/50 shadow-lg" : "border-lime-100"
                  }`}
                >
                  {tier.highlighted && (
                    <div className="mb-4 inline-flex self-start rounded-full bg-lime-100 px-3 py-1 text-xs font-semibold text-lime-700">
                      Più popolare
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-zinc-950">{tier.name}</h3>
                  <div className="mt-4">
                    {tier.price > 0 ? (
                      <>
                        <span className="text-4xl font-bold text-zinc-950">€{tier.price}</span>
                        <span className="text-sm text-zinc-500">/{tier.period}</span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-zinc-950">Su misura</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-zinc-500">
                    {tier.maxMembers > 0 ? `Fino a ${tier.maxMembers} membri` : "Membri illimitati"}
                  </p>
                  <ul className="mt-8 flex-1 space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-zinc-600">
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-lime-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={tier.id === "enterprise" ? "/assessment" : "/registrazione"}
                    className={`mt-8 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${
                      tier.highlighted
                        ? "bg-lime-600 text-white hover:bg-lime-700"
                        : "border border-lime-200 text-zinc-700 hover:bg-amber-50"
                    }`}
                  >
                    {tier.ctaLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature comparison */}
        <section className="py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl font-bold text-zinc-950">Confronto funzionalità</h2>
            <div className="mt-8 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="py-3 text-left font-medium text-zinc-500">Funzionalità</th>
                    <th className="py-3 text-center font-medium text-zinc-500">Starter</th>
                    <th className="py-3 text-center font-medium text-lime-700">Pro</th>
                    <th className="py-3 text-center font-medium text-zinc-500">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {[
                    ["Dashboard energia", "✓", "✓", "✓"],
                    ["Report GSE", "Mensile", "Automatico", "Automatico"],
                    ["Fatturazione", "Base", "Avanzata", "Personalizzata"],
                    ["Governance digitale", "—", "✓", "✓"],
                    ["Trading P2P", "—", "✓", "✓"],
                    ["AI Optimization", "—", "✓", "✓"],
                    ["SPID/CIE", "—", "—", "✓"],
                    ["API Developer", "—", "Read-only", "Full access"],
                    ["White-label", "—", "—", "✓"],
                    ["SLA", "—", "99%", "99.9%"],
                    ["Support", "Email", "Prioritario", "Dedicato"],
                  ].map(([feature, starter, pro, enterprise]) => (
                    <tr key={feature}>
                      <td className="py-3 text-zinc-700">{feature}</td>
                      <td className="py-3 text-center text-zinc-500">{starter}</td>
                      <td className="py-3 text-center font-medium text-zinc-700">{pro}</td>
                      <td className="py-3 text-center text-zinc-500">{enterprise}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-amber-50/60 py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl font-bold text-zinc-950">Domande frequenti</h2>
            <dl className="mt-8 space-y-6">
              {[
                {
                  q: "Posso provare gratis prima di pagare?",
                  a: "Sì, offriamo una prova gratuita di 30 giorni senza carta di credito. Potrai esplorare tutte le funzionalità del piano Pro.",
                },
                {
                  q: "Posso cambiare piano in qualsiasi momento?",
                  a: "Sì, puoi passare a un piano superiore o inferiore in qualsiasi momento. Il cambio è immediato e la fatturazione viene adeguata.",
                },
                {
                  q: "I dati della mia CER sono al sicuro?",
                  a: "Assolutamente. Utilizziamo crittografia end-to-end, backup giornalieri e siamo conformi al GDPR. I dati restano in EU.",
                },
                {
                  q: "Serve assistenza tecnica per l'installazione?",
                  a: "No, EnergiaNostra è una piattaforma cloud (SaaS). Basta registrarsi e iniziare. Per l'Enterprise self-hosted, forniamo supporto dedicato.",
                },
              ].map(({ q, a }) => (
                <div key={q} className="rounded-xl border border-lime-100 bg-white p-6">
                  <dt className="font-semibold text-zinc-950">{q}</dt>
                  <dd className="mt-2 text-sm text-zinc-600">{a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <Footer
        brand="EnergiaNostra"
        tagline="CER, incentivi GSE e governance digitale per la Romagna."
      />
    </div>
  );
}
