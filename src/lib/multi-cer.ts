export interface CerSummary {
  id: string;
  name: string;
  municipality: string;
  province: string;
  memberCount: number;
  productionKwh: number;
  consumptionKwh: number;
  sharedEnergyKwh: number;
  selfConsumptionPct: number;
  totalIncentiveEuro: number;
  savingsEuro: number;
  co2AvoidedKg: number;
  foundedYear: number;
  status: "attiva" | "in_formazione" | "sospesa";
  performanceScore: number; // 0-100
}

// Seed data for multiple CERs
export const multiCerData: CerSummary[] = [
  {
    id: "cer-bertinoro",
    name: "Energia Insieme Bertinoro",
    municipality: "Bertinoro",
    province: "Forlì-Cesena",
    memberCount: 25,
    productionKwh: 154600,
    consumptionKwh: 169200,
    sharedEnergyKwh: 119450,
    selfConsumptionPct: 70.6,
    totalIncentiveEuro: 13140,
    savingsEuro: 21740,
    co2AvoidedKg: 44197,
    foundedYear: 2024,
    status: "attiva",
    performanceScore: 88,
  },
  {
    id: "cer-forli-centro",
    name: "Sole Urbano Forlì Centro",
    municipality: "Forlì",
    province: "Forlì-Cesena",
    memberCount: 42,
    productionKwh: 228000,
    consumptionKwh: 310000,
    sharedEnergyKwh: 178000,
    selfConsumptionPct: 57.4,
    totalIncentiveEuro: 19580,
    savingsEuro: 32396,
    co2AvoidedKg: 65860,
    foundedYear: 2024,
    status: "attiva",
    performanceScore: 76,
  },
  {
    id: "cer-cesena-sud",
    name: "CER Cesena Sud Valle Savio",
    municipality: "Cesena",
    province: "Forlì-Cesena",
    memberCount: 18,
    productionKwh: 98000,
    consumptionKwh: 125000,
    sharedEnergyKwh: 72000,
    selfConsumptionPct: 57.6,
    totalIncentiveEuro: 7920,
    savingsEuro: 13104,
    co2AvoidedKg: 26640,
    foundedYear: 2025,
    status: "attiva",
    performanceScore: 72,
  },
  {
    id: "cer-forlimpopoli",
    name: "Luce di Forlimpopoli",
    municipality: "Forlimpopoli",
    province: "Forlì-Cesena",
    memberCount: 12,
    productionKwh: 64000,
    consumptionKwh: 82000,
    sharedEnergyKwh: 48000,
    selfConsumptionPct: 58.5,
    totalIncentiveEuro: 5280,
    savingsEuro: 8736,
    co2AvoidedKg: 17760,
    foundedYear: 2025,
    status: "in_formazione",
    performanceScore: 65,
  },
  {
    id: "cer-meldola",
    name: "Green Hills Meldola",
    municipality: "Meldola",
    province: "Forlì-Cesena",
    memberCount: 8,
    productionKwh: 42000,
    consumptionKwh: 55000,
    sharedEnergyKwh: 31000,
    selfConsumptionPct: 56.4,
    totalIncentiveEuro: 3410,
    savingsEuro: 5642,
    co2AvoidedKg: 11470,
    foundedYear: 2025,
    status: "in_formazione",
    performanceScore: 58,
  },
];

export function getMultiCerStats() {
  const active = multiCerData.filter((c) => c.status === "attiva");
  const inFormation = multiCerData.filter((c) => c.status === "in_formazione");

  return {
    totalCers: multiCerData.length,
    activeCers: active.length,
    inFormationCers: inFormation.length,
    totalMembers: multiCerData.reduce((s, c) => s + c.memberCount, 0),
    totalProductionKwh: multiCerData.reduce((s, c) => s + c.productionKwh, 0),
    totalSharedEnergyKwh: multiCerData.reduce((s, c) => s + c.sharedEnergyKwh, 0),
    totalIncentiveEuro: multiCerData.reduce((s, c) => s + c.totalIncentiveEuro, 0),
    totalSavingsEuro: multiCerData.reduce((s, c) => s + c.savingsEuro, 0),
    totalCo2AvoidedKg: multiCerData.reduce((s, c) => s + c.co2AvoidedKg, 0),
    avgPerformanceScore: Math.round(multiCerData.reduce((s, c) => s + c.performanceScore, 0) / multiCerData.length),
    avgSelfConsumptionPct: Number((multiCerData.reduce((s, c) => s + c.selfConsumptionPct, 0) / multiCerData.length).toFixed(1)),
    benchmarks: {
      bestPerformer: multiCerData.reduce((best, c) => (c.performanceScore > best.performanceScore ? c : best)),
      highestSelfConsumption: multiCerData.reduce((best, c) => (c.selfConsumptionPct > best.selfConsumptionPct ? c : best)),
      largestCer: multiCerData.reduce((best, c) => (c.memberCount > best.memberCount ? c : best)),
    },
  };
}
