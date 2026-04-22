"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

type BuildingType = "condominio" | "borgo-rurale" | "azienda-agricola" | "scuola";
type RoofAvailability = "ampia" | "parziale" | "limitata";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Dashboard demo", href: "/dashboard" },
  { label: "Governance", href: "/dashboard/governance" },
];

const buildingFactors: Record<BuildingType, number> = {
  condominio: 1,
  "borgo-rurale": 1.12,
  "azienda-agricola": 1.24,
  scuola: 0.94,
};

const roofFactors: Record<RoofAvailability, number> = {
  ampia: 1.15,
  parziale: 0.96,
  limitata: 0.72,
};

const roofLabels: Record<RoofAvailability, string> = {
  ampia: "Ampia superficie disponibile",
  parziale: "Parziale / condivisa",
  limitata: "Limitata o da valutare",
};

const buildingLabels: Record<BuildingType, string> = {
  condominio: "Condominio o supercondominio",
  "borgo-rurale": "Borgo rurale / centro storico",
  "azienda-agricola": "Azienda agricola o PMI",
  scuola: "Scuola / edificio pubblico",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);

export default function AssessmentPage() {
  const [address, setAddress] = useState("Bertinoro, Via della Rocca 12");
  const [buildingType, setBuildingType] = useState<BuildingType>("condominio");
  const [potentialMembers, setPotentialMembers] = useState(18);
  const [currentEnergyCosts, setCurrentEnergyCosts] = useState(36000);
  const [roofAvailability, setRoofAvailability] = useState<RoofAvailability>("parziale");
  const [showResults, setShowResults] = useState(true);
  const [pvgisData, setPvgisData] = useState<{
    annualProductionKwh: number;
    optimalTilt: number;
    optimalAzimuth: number;
    monthlyProduction: Array<{ month: string; kWh: number }>;
    location: { latitude: number; longitude: number; elevation: number };
  } | null>(null);
  const [pvgisLoading, setPvgisLoading] = useState(false);

  const results = useMemo(() => {
    const membersFactor = Math.min(0.16 + potentialMembers * 0.006, 0.34);
    const annualSavings = currentEnergyCosts * membersFactor * buildingFactors[buildingType] * roofFactors[roofAvailability];
    const annualIncentives = potentialMembers * 185 * roofFactors[roofAvailability];
    const estimatedInvestment = 26000 + potentialMembers * 1450 * roofFactors[roofAvailability];
    const roiYears = estimatedInvestment / Math.max(annualSavings + annualIncentives, 1);

    // Enhance with PVGIS data if available
    const pvgisAnnual = pvgisData?.annualProductionKwh;
    const adjustedSavings = pvgisAnnual
      ? annualSavings * (pvgisAnnual / (potentialMembers * 1200)) // Scale by actual vs estimated production
      : annualSavings;

    let recommendedCerType = "CER condominiale con prosumer diffusi";
    if (potentialMembers >= 24) {
      recommendedCerType = "CER multi-sito di quartiere con riparto incentivi centralizzato";
    } else if (buildingType === "azienda-agricola") {
      recommendedCerType = "CER agricola con produzione trainante e utenze satellite";
    } else if (buildingType === "borgo-rurale") {
      recommendedCerType = "CER di borgo con cabina primaria condivisa";
    } else if (buildingType === "scuola") {
      recommendedCerType = "CER pubblica con scuola capofila e famiglie aderenti";
    }

    return {
      estimatedSavings: Math.round(adjustedSavings + annualIncentives),
      estimatedRoi: roiYears.toFixed(1),
      recommendedCerType,
      rooftopReadiness: roofLabels[roofAvailability],
      pvgisAnnualKwh: pvgisAnnual ? Math.round(pvgisAnnual) : null,
    };
  }, [buildingType, currentEnergyCosts, potentialMembers, roofAvailability, pvgisData]);

  const fetchPvgisData = async () => {
    setPvgisLoading(true);
    try {
      const peakPower = Math.round(potentialMembers * 0.5 * roofFactors[roofAvailability]);
      const res = await fetch(`/api/pvgis?address=${encodeURIComponent(address)}&peakPower=${peakPower}`);
      if (res.ok) {
        const data = await res.json();
        setPvgisData(data);
      }
    } catch {
      // PVGIS data is optional
    } finally {
      setPvgisLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        brand="EnergiaNostra"
        items={navItems}
        ctaLabel="Vai alla dashboard"
        ctaHref="/dashboard"
      />

      <main className="flex-1 py-12 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <section className="rounded-3xl border border-amber-200 bg-white/90 p-8 shadow-xl shadow-amber-100/40 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">
              Assessment CER gratuito
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
              Verifica la fattibilità della tua comunità energetica
            </h1>
            <p className="mt-4 text-base leading-7 text-zinc-600 sm:text-lg">
              Inserisci i dati principali del tuo edificio o gruppo di utenze. La stima è calibrata sui profili di consumo tipici della Romagna.
            </p>

            <form
              className="mt-8 grid gap-5"
              onSubmit={(event) => {
                event.preventDefault();
                setShowResults(true);
              }}
            >
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-zinc-700">Indirizzo / località</span>
                <input
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  className="rounded-2xl border border-lime-200 bg-amber-50/60 px-4 py-3 text-zinc-900 outline-none transition focus:border-lime-500"
                  placeholder="Es. Bertinoro, Via del Sole 8"
                  required
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-zinc-700">Tipologia edificio</span>
                <select
                  value={buildingType}
                  onChange={(event) => setBuildingType(event.target.value as BuildingType)}
                  className="rounded-2xl border border-lime-200 bg-amber-50/60 px-4 py-3 text-zinc-900 outline-none transition focus:border-lime-500"
                >
                  {Object.entries(buildingLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-zinc-700">Numero potenziale membri</span>
                <input
                  type="number"
                  min={2}
                  max={120}
                  value={potentialMembers}
                  onChange={(event) => setPotentialMembers(Number(event.target.value))}
                  className="rounded-2xl border border-lime-200 bg-amber-50/60 px-4 py-3 text-zinc-900 outline-none transition focus:border-lime-500"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-zinc-700">Costi energetici annui attuali</span>
                <input
                  type="number"
                  min={1000}
                  step={500}
                  value={currentEnergyCosts}
                  onChange={(event) => setCurrentEnergyCosts(Number(event.target.value))}
                  className="rounded-2xl border border-lime-200 bg-amber-50/60 px-4 py-3 text-zinc-900 outline-none transition focus:border-lime-500"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-zinc-700">Disponibilità tetto per fotovoltaico</span>
                <select
                  value={roofAvailability}
                  onChange={(event) => setRoofAvailability(event.target.value as RoofAvailability)}
                  className="rounded-2xl border border-lime-200 bg-amber-50/60 px-4 py-3 text-zinc-900 outline-none transition focus:border-lime-500"
                >
                  {Object.entries(roofLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-lime-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-lime-200 transition hover:bg-lime-700 sm:w-fit"
              >
                Aggiorna assessment CER
              </button>

              <button
                type="button"
                onClick={fetchPvgisData}
                disabled={pvgisLoading}
                className="inline-flex w-full items-center justify-center rounded-2xl border border-lime-200 bg-amber-50 px-5 py-3.5 text-sm font-semibold text-zinc-700 transition hover:bg-amber-100 disabled:opacity-60 sm:w-fit"
              >
                {pvgisLoading ? "Analisi solare in corso..." : "☀️ Analisi potenziale solare (PVGIS)"}
              </button>
            </form>
          </section>

          <aside className="space-y-6">
            {showResults && (
              <div className="rounded-3xl border border-lime-200 bg-lime-950 p-8 text-white shadow-xl shadow-lime-200/40">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200">
                  Risultati preliminari
                </p>
                <h2 className="mt-4 text-2xl font-black">{address}</h2>
                <p className="mt-2 text-sm text-lime-100/85">{buildingLabels[buildingType]}</p>
                <div className="mt-8 grid gap-4">
                  <div className="rounded-2xl bg-white/10 p-5">
                    <p className="text-sm text-lime-100/80">Risparmio annuo stimato</p>
                    <p className="mt-2 text-3xl font-bold">{formatCurrency(results.estimatedSavings)}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-5">
                    <p className="text-sm text-lime-100/80">ROI stimato</p>
                    <p className="mt-2 text-3xl font-bold">{results.estimatedRoi} anni</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-5">
                    <p className="text-sm text-lime-100/80">Tipologia CER consigliata</p>
                    <p className="mt-2 text-lg font-semibold">{results.recommendedCerType}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-5">
                    <p className="text-sm text-lime-100/80">Prontezza fotovoltaico</p>
                    <p className="mt-2 text-lg font-semibold">{results.rooftopReadiness}</p>
                  </div>
                </div>
                <Link
                  href="/dashboard/governance"
                  className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-amber-300 px-5 py-3 text-sm font-semibold text-lime-950 transition hover:bg-amber-200"
                >
                  Avvia la formazione della CER
                </Link>
              </div>
            )}

            {pvgisData && (
              <div className="rounded-3xl border border-lime-200 bg-white/90 p-8 shadow-xl shadow-lime-100/40">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">
                  ☀️ Analisi solare PVGIS (EU JRC)
                </p>
                <h2 className="mt-4 text-2xl font-black text-zinc-950">{address}</h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Lat: {pvgisData.location.latitude.toFixed(3)}° · Lon: {pvgisData.location.longitude.toFixed(3)}° · Altitudine: {pvgisData.location.elevation}m
                </p>
                <div className="mt-6 grid gap-4">
                  <div className="rounded-2xl bg-lime-50 p-5">
                    <p className="text-sm text-zinc-600">Produzione annua stimata</p>
                    <p className="mt-2 text-3xl font-bold text-lime-700">{pvgisData.annualProductionKwh.toLocaleString("it-IT")} kWh</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-amber-50 p-4">
                      <p className="text-xs text-zinc-500">Inclinazione ottimale</p>
                      <p className="mt-1 text-xl font-bold text-zinc-950">{pvgisData.optimalTilt}°</p>
                    </div>
                    <div className="rounded-2xl bg-amber-50 p-4">
                      <p className="text-xs text-zinc-500">Azimuth ottimale</p>
                      <p className="mt-1 text-xl font-bold text-zinc-950">{pvgisData.optimalAzimuth}° {pvgisData.optimalAzimuth === 0 ? "(Sud)" : ""}</p>
                    </div>
                  </div>
                  {pvgisData.monthlyProduction.length > 0 && (
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-sm font-semibold text-zinc-700 mb-3">Produzione mensile</p>
                      <div className="grid grid-cols-6 gap-1">
                        {pvgisData.monthlyProduction.map((m) => (
                          <div key={m.month} className="text-center">
                            <div className="mx-auto w-6 overflow-hidden rounded-full bg-lime-100" style={{ height: "60px" }}>
                              <div
                                className="w-full rounded-full bg-lime-500"
                                style={{
                                  height: `${(m.kWh / Math.max(...pvgisData.monthlyProduction.map((x) => x.kWh))) * 60}px`,
                                  marginTop: `${60 - (m.kWh / Math.max(...pvgisData.monthlyProduction.map((x) => x.kWh))) * 60}px`,
                                }}
                              />
                            </div>
                            <p className="mt-1 text-[10px] font-semibold text-zinc-500">{m.month}</p>
                            <p className="text-[9px] text-zinc-400">{m.kWh}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-amber-200 bg-white/90 p-8 shadow-lg shadow-amber-100/40">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">
                Come leggere il risultato
              </p>
              <ul className="mt-5 space-y-4 text-sm leading-6 text-zinc-600">
                <li>• La stima considera autoconsumo condiviso, incentivo GSE e profilo orario tipico per Forlì-Cesena.</li>
                <li>• Il ROI migliora quando più membri spostano i consumi nella fascia 10:00-15:00.</li>
                <li>• Se il tetto è limitato, EnergiaNostra suggerisce configurazioni prosumer diffuse o superfici condivise.</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>

      <Footer
        brand="EnergiaNostra"
        tagline="Assessment preliminare CER per condomini, borghi e imprese della Romagna."
      />
    </div>
  );
}
