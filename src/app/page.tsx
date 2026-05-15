import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BatteryCharging,
  Coins,
  Leaf,
  Settings2,
  SunMedium,
  Users,
  Vote,
} from "lucide-react";
import { FeatureCard, FeatureGrid } from "@/components/features";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { Navbar } from "@/components/navbar";
import { getCerProfile, getEnergyData, gseReportingStatus } from "@/lib/data-db";

const navItems = [
  { label: "Funzionalità", href: "#funzionalita" },
  { label: "Assessment CER", href: "/assessment" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Portale membro", href: "/portale" },
  { label: "Accedi", href: "/login" },
];

const features = [
  {
    title: "Configuratore CER",
    description: "Valuta rapidamente la fattibilità per condomini, borghi e imprese agricole della Romagna.",
    icon: <Settings2 className="h-6 w-6" />,
  },
  {
    title: "Gestione membri",
    description: "Anagrafiche, POD, ruoli e consuntivi economici sempre allineati.",
    icon: <Users className="h-6 w-6" />,
  },
  {
    title: "Contabilizzazione energia",
    description: "Bilanci mensili di produzione, consumo e quota condivisa pronti per il GSE.",
    icon: <BatteryCharging className="h-6 w-6" />,
  },
  {
    title: "Distribuzione incentivi",
    description: "Riparti incentivi e benefici economici con criteri trasparenti e verificabili.",
    icon: <Coins className="h-6 w-6" />,
  },
  {
    title: "Governance digitale",
    description: "Assemblee, votazioni, verbali e comunicazioni centralizzati in un'unica area.",
    icon: <Vote className="h-6 w-6" />,
  },
  {
    title: "Conformità GSE",
    description: "Checklist operative e tracciamento pratiche per restare sempre compliant.",
    icon: <BadgeCheck className="h-6 w-6" />,
  },
];

export const dynamic = "force-dynamic";

export default async function Home() {
  const [cerProfile, energyData] = await Promise.all([getCerProfile(), getEnergyData()]);
  const latestEnergyMonth = energyData[energyData.length - 1];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        brand="EnergiaNostra"
        items={navItems}
        ctaLabel="Assessment gratuito"
        ctaHref="/assessment"
      />

      <main id="main-content" className="flex-1">
        <Hero
          title="L'energia della tua comunità, gestita insieme"
          subtitle="Crea e gestisci la tua Comunità Energetica Rinnovabile — dalla fondazione alla bolletta"
          ctaLabel="Richiedi assessment gratuito"
          ctaHref="/assessment"
          secondaryLabel="Apri la dashboard demo"
          secondaryHref="/dashboard"
        >
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
              <p className="text-sm font-medium text-zinc-500">Territorio servito</p>
              <p className="mt-2 text-2xl font-bold text-lime-950">Forlì · Cesena · Bertinoro</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
              <p className="text-sm font-medium text-zinc-500">CER demo attiva</p>
              <p className="mt-2 text-2xl font-bold text-lime-950">{cerProfile.members} membri</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
              <p className="text-sm font-medium text-zinc-500">Incentivo GSE</p>
              <p className="mt-2 text-2xl font-bold text-lime-950">
                €{gseReportingStatus.currentRateEuroPerMwh}/MWh
              </p>
            </div>
          </div>
        </Hero>

        <section aria-label="Dati energia Romagna" className="py-16">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.5fr_1fr] lg:px-8">
            <div className="rounded-3xl border border-amber-200 bg-white/90 p-8 shadow-xl shadow-amber-100/40">
              <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
                <Leaf className="h-4 w-4" />
                Dati energia Romagna
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
                Forlì-Cesena: 71.2% energia da rinnovabili — la più alta d&apos;Italia
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">
                Un contesto ideale per comunità energetiche locali: fotovoltaico diffuso, imprese agricole energivore e condomini pronti a condividere produzione e benefici economici.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-amber-50 p-5">
                  <p className="text-sm font-medium text-zinc-500">Energia condivisa ultimo mese</p>
                  <p className="mt-2 text-2xl font-bold text-zinc-950">
                    {latestEnergyMonth ? `${latestEnergyMonth.sharedEnergyKwh.toLocaleString("it-IT")} kWh` : "In attesa di dati"}
                  </p>
                </div>
                <div className="rounded-2xl bg-lime-50 p-5">
                  <p className="text-sm font-medium text-zinc-500">Beneficio economico mensile</p>
                  <p className="mt-2 text-2xl font-bold text-zinc-950">
                    {latestEnergyMonth ? `€${latestEnergyMonth.savingsEuro.toLocaleString("it-IT")}` : "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-lime-200 bg-lime-950 p-8 text-white shadow-xl shadow-lime-200/40">
              <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-amber-200">
                <SunMedium className="h-4 w-4" />
                Check CER gratuito
              </div>
              <h3 className="mt-4 text-2xl font-black">
                Scopri in pochi minuti se il tuo edificio è pronto per una CER.
              </h3>
              <p className="mt-4 text-sm leading-6 text-lime-100/85">
                Analisi preliminare su costi energetici, tetto disponibile e numero di membri potenziali, con suggerimento sul modello CER più adatto.
              </p>
              <Link
                href="/assessment"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-amber-300 px-5 py-3 text-sm font-semibold text-lime-950 transition hover:bg-amber-200"
              >
                Avvia assessment gratuito
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <div id="funzionalita" className="scroll-mt-24">
          <FeatureGrid
            title="Tutto quello che serve per far crescere una CER locale"
            subtitle="Dal primo studio di fattibilità alla distribuzione mensile degli incentivi: EnergiaNostra coordina ogni fase operativa."
          >
            {features.map((feature) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </FeatureGrid>
        </div>

        <section aria-label="Invito all'azione per assessment CER" className="pb-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-100 via-yellow-50 to-lime-100 p-8 shadow-lg shadow-amber-100/40 sm:p-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">
                    EnergiaNostra per la comunità
                  </p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
                    Porta in assemblea una proposta CER concreta, sostenibile e già pronta per il GSE.
                  </h2>
                  <p className="mt-4 text-base leading-7 text-zinc-600 sm:text-lg">
                    Ricevi simulazione economica, configurazione membri e roadmap di costituzione per partire con basi tecniche solide.
                  </p>
                </div>
                <Link
                  href="/assessment"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-lime-200 transition hover:bg-lime-700"
                >
                  Richiedi assessment gratuito
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer
        brand="EnergiaNostra"
        tagline="CER, incentivi GSE e governance digitale per la Romagna che produce energia insieme."
      />
    </div>
  );
}
