import { InMemoryStore } from "@/lib/db";

export type MemberType = "produttore" | "consumatore" | "prosumer";

export interface CerProfile {
  id: string;
  name: string;
  territory: string;
  municipality: string;
  province: string;
  members: number;
  foundedYear: number;
  referenceNote: string;
}

export interface CerMember extends Record<string, unknown> {
  id: string;
  name: string;
  type: MemberType;
  podCode: string;
  energyBalanceKwh: number;
  monthlyBenefitEuro: number;
  municipality: string;
  joinedAt: string;
}

export interface EnergyMonth {
  id: string;
  label: string;
  productionKwh: number;
  consumptionKwh: number;
  sharedEnergyKwh: number;
  selfConsumptionPct: number;
  savingsEuro: number;
  gseIncentiveEuro: number;
  co2AvoidedKg: number;
}

export interface IncentiveShare {
  memberId: string;
  name: string;
  sharePct: number;
  monthlyEuro: number;
  yearToDateEuro: number;
}

export interface GovernanceDocument {
  id: string;
  title: string;
  category: "statuto" | "regolamento" | "verbale" | "report";
  status: "approvato" | "in revisione" | "da firmare";
  updatedAt: string;
  owner: string;
}

export interface GovernanceVote {
  id: string;
  title: string;
  scheduledAt: string;
  quorum: string;
  status: "convocata" | "aperta" | "programmata";
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  publishedAt: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  tone: "positive" | "neutral" | "attention";
}

export interface HealthIndicator {
  id: string;
  label: string;
  value: string;
  status: "excellent" | "good" | "attention";
  note: string;
}

const incentiveRateEuroPerMwh = 110;

const round = (value: number, decimals = 2) => Number(value.toFixed(decimals));

const calculateMemberBenefit = (type: MemberType, balance: number) => {
  const base = type === "produttore" ? 96 : type === "prosumer" ? 82 : 44;
  const variable = balance >= 0 ? balance * 0.07 : Math.abs(balance) * 0.025;
  return round(base + variable);
};

export const cerProfile: CerProfile = {
  id: "cer-forli-centro",
  name: "Energia Insieme Bertinoro",
  territory: "Collina e pianura forlivese",
  municipality: "Bertinoro",
  province: "Forlì-Cesena",
  members: 25,
  foundedYear: 2024,
  referenceNote:
    "Scenario CER calibrato su profili energetici di condomini, piccole imprese e aziende agricole tra Bertinoro, Forlimpopoli e la cintura di Forlì.",
};

const memberSeeds: Array<Pick<CerMember, "name" | "type" | "energyBalanceKwh" | "municipality">> = [
  { name: "Condominio Panorama Bertinoro", type: "prosumer", energyBalanceKwh: 640, municipality: "Bertinoro" },
  { name: "Azienda Agricola La Panighina", type: "produttore", energyBalanceKwh: 1240, municipality: "Bertinoro" },
  { name: "Bottega del Borgo", type: "consumatore", energyBalanceKwh: -180, municipality: "Bertinoro" },
  { name: "Scuola Primaria Carducci", type: "consumatore", energyBalanceKwh: -320, municipality: "Forlimpopoli" },
  { name: "Casa di Cura Villa del Colle", type: "consumatore", energyBalanceKwh: -280, municipality: "Fratta Terme" },
  { name: "Podere Ca' de Be'", type: "produttore", energyBalanceKwh: 980, municipality: "Bertinoro" },
  { name: "Famiglia Rossi", type: "prosumer", energyBalanceKwh: 210, municipality: "Bertinoro" },
  { name: "Famiglia Gardini", type: "prosumer", energyBalanceKwh: 140, municipality: "Forlimpopoli" },
  { name: "Famiglia Miserocchi", type: "consumatore", energyBalanceKwh: -90, municipality: "Bertinoro" },
  { name: "Palestra Comunale Bertinoro", type: "consumatore", energyBalanceKwh: -260, municipality: "Bertinoro" },
  { name: "Biblioteca Civica Novello", type: "consumatore", energyBalanceKwh: -75, municipality: "Bertinoro" },
  { name: "Ristorante Colline Romagnole", type: "prosumer", energyBalanceKwh: 110, municipality: "Bertinoro" },
  { name: "Cantina Sociale Bertinoro", type: "produttore", energyBalanceKwh: 1520, municipality: "Bertinoro" },
  { name: "Laboratorio Artigiano del Sangiovese", type: "prosumer", energyBalanceKwh: 160, municipality: "Forlì" },
  { name: "Cooperativa Sociale Il Mandorlo", type: "consumatore", energyBalanceKwh: -130, municipality: "Forlimpopoli" },
  { name: "Farmacia Centrale Bertinoro", type: "consumatore", energyBalanceKwh: -70, municipality: "Bertinoro" },
  { name: "Frantoio della Rocca", type: "produttore", energyBalanceKwh: 860, municipality: "Bertinoro" },
  { name: "Famiglia Zanetti", type: "prosumer", energyBalanceKwh: 95, municipality: "Forlì" },
  { name: "Famiglia Bandini", type: "consumatore", energyBalanceKwh: -60, municipality: "Meldola" },
  { name: "Albergo Panorama Romagna", type: "prosumer", energyBalanceKwh: 230, municipality: "Bertinoro" },
  { name: "Centro Sportivo Berti", type: "consumatore", energyBalanceKwh: -210, municipality: "Forlimpopoli" },
  { name: "Azienda Ortofrutticola San Donato", type: "produttore", energyBalanceKwh: 1180, municipality: "Forlì" },
  { name: "Famiglia Casadei", type: "prosumer", energyBalanceKwh: 125, municipality: "Bertinoro" },
  { name: "Officina Meccanica Forlivese", type: "consumatore", energyBalanceKwh: -170, municipality: "Forlì" },
  { name: "Casa Vacanze Balcone di Romagna", type: "prosumer", energyBalanceKwh: 205, municipality: "Bertinoro" },
];

export const cerMembers: CerMember[] = memberSeeds.map((member, index) => ({
  id: `member-${index + 1}`,
  ...member,
  podCode: `IT001E${String(990000001 + index).padStart(9, "0")}`,
  monthlyBenefitEuro: calculateMemberBenefit(member.type, member.energyBalanceKwh),
  joinedAt: `2024-${String((index % 9) + 1).padStart(2, "0")}-15`,
}));

export const energyData: EnergyMonth[] = [
  { label: "Nov 2024", productionKwh: 22400, consumptionKwh: 28900, sharedEnergyKwh: 18750 },
  { label: "Dic 2024", productionKwh: 19100, consumptionKwh: 27800, sharedEnergyKwh: 16200 },
  { label: "Gen 2025", productionKwh: 21500, consumptionKwh: 29400, sharedEnergyKwh: 17300 },
  { label: "Feb 2025", productionKwh: 24600, consumptionKwh: 28700, sharedEnergyKwh: 19600 },
  { label: "Mar 2025", productionKwh: 31200, consumptionKwh: 27500, sharedEnergyKwh: 22900 },
  { label: "Apr 2025", productionKwh: 35800, consumptionKwh: 26900, sharedEnergyKwh: 24700 },
].map((month) => ({
  id: month.label.toLowerCase().replace(/\s+/g, "-"),
  ...month,
  selfConsumptionPct: round((month.sharedEnergyKwh / month.consumptionKwh) * 100, 1),
  savingsEuro: round(month.sharedEnergyKwh * 0.182),
  gseIncentiveEuro: round((month.sharedEnergyKwh / 1000) * incentiveRateEuroPerMwh),
  co2AvoidedKg: round(month.sharedEnergyKwh * 0.37),
}));

export const energySummary = energyData.reduce(
  (acc, month) => {
    acc.productionKwh += month.productionKwh;
    acc.consumptionKwh += month.consumptionKwh;
    acc.sharedEnergyKwh += month.sharedEnergyKwh;
    acc.savingsEuro += month.savingsEuro;
    acc.gseIncentiveEuro += month.gseIncentiveEuro;
    return acc;
  },
  {
    productionKwh: 0,
    consumptionKwh: 0,
    sharedEnergyKwh: 0,
    savingsEuro: 0,
    gseIncentiveEuro: 0,
  }
);

export const latestEnergyMonth = energyData[energyData.length - 1];

const weightForMember = (member: CerMember) => {
  const typeWeight = member.type === "produttore" ? 1.3 : member.type === "prosumer" ? 1.1 : 0.85;
  const balanceWeight = member.energyBalanceKwh >= 0 ? 1 + member.energyBalanceKwh / 2200 : 0.92 + Math.abs(member.energyBalanceKwh) / 5000;
  return typeWeight * balanceWeight;
};

const totalDistributionWeight = cerMembers.reduce((sum, member) => sum + weightForMember(member), 0);

export const memberIncentiveDistribution: IncentiveShare[] = cerMembers.map((member) => {
  const share = weightForMember(member) / totalDistributionWeight;
  return {
    memberId: member.id,
    name: member.name,
    sharePct: round(share * 100),
    monthlyEuro: round(latestEnergyMonth.gseIncentiveEuro * share),
    yearToDateEuro: round(energySummary.gseIncentiveEuro * share),
  };
});

export const governanceDocuments: GovernanceDocument[] = [
  {
    id: "statuto-cer",
    title: "Statuto CER Energia Insieme Bertinoro",
    category: "statuto",
    status: "approvato",
    updatedAt: "15 apr 2025",
    owner: "Consiglio direttivo",
  },
  {
    id: "regolamento-riparto",
    title: "Regolamento riparto incentivi e condivisione energia",
    category: "regolamento",
    status: "in revisione",
    updatedAt: "08 mag 2025",
    owner: "Comitato tecnico",
  },
  {
    id: "verbale-aprile",
    title: "Verbale assemblea straordinaria del 24 aprile 2025",
    category: "verbale",
    status: "da firmare",
    updatedAt: "25 apr 2025",
    owner: "Segreteria CER",
  },
  {
    id: "report-gse",
    title: "Report GSE primo quadrimestre 2025",
    category: "report",
    status: "approvato",
    updatedAt: "06 mag 2025",
    owner: "Energy manager",
  },
];

export const governanceVotes: GovernanceVote[] = [
  {
    id: "vote-q2",
    title: "Approvazione piano di distribuzione incentivi Q2 2025",
    scheduledAt: "20 mag 2025 · 20:45",
    quorum: "50% + 1 dei soci",
    status: "convocata",
  },
  {
    id: "vote-pnrr",
    title: "Scelta fornitore accumulo condiviso da 80 kWh",
    scheduledAt: "03 giu 2025 · 18:30",
    quorum: "2/3 dei membri votanti",
    status: "programmata",
  },
  {
    id: "vote-expansion",
    title: "Ingresso nuovi prosumer area Santa Maria Nuova",
    scheduledAt: "12 giu 2025 · 21:00",
    quorum: "Maggioranza semplice",
    status: "programmata",
  },
];

export const announcements: Announcement[] = [
  {
    id: "ann-1",
    title: "Apertura nuove adesioni per Santa Maria Nuova",
    message: "Disponibili 6 quote per famiglie e piccole attività con tetto condiviso e accesso al contributo PNRR.",
    publishedAt: "09 mag 2025",
  },
  {
    id: "ann-2",
    title: "Webinar su contabilizzazione e bolletta CER",
    message: "Mercoledì alle 18:00 analizziamo il consuntivo di aprile e il profilo orario 10:00-15:00 per massimizzare l'autoconsumo.",
    publishedAt: "07 mag 2025",
  },
  {
    id: "ann-3",
    title: "Monitoraggio POD completato al 100%",
    message: "Allineati tutti i 25 POD su portale GSE, nessuna anomalia aperta sulle misure di rete.",
    publishedAt: "06 mag 2025",
  },
];

export const recentActivity: ActivityItem[] = [
  {
    id: "activity-1",
    title: "Caricate le misure GSE di aprile",
    description: "Verificati i 25 POD e chiusa la pratica di rendicontazione mensile senza scostamenti.",
    timestamp: "Oggi · 09:20",
    tone: "positive",
  },
  {
    id: "activity-2",
    title: "Nuova richiesta di adesione da Forlimpopoli",
    description: "Un condominio da 12 unità abitative ha avviato l'assessment preliminare.",
    timestamp: "Ieri · 16:40",
    tone: "neutral",
  },
  {
    id: "activity-3",
    title: "Segnalata fascia serale sopra target",
    description: "Consumi 19:00-22:00 superiori del 12% rispetto al piano ottimale condiviso.",
    timestamp: "Ieri · 11:05",
    tone: "attention",
  },
  {
    id: "activity-4",
    title: "Verbale assemblea inviato per firma digitale",
    description: "Il documento è disponibile nell'area governance con notifica ai 25 membri.",
    timestamp: "05 mag 2025",
    tone: "positive",
  },
];

export const healthIndicators: HealthIndicator[] = [
  {
    id: "autoconsumo",
    label: "Autoconsumo condiviso",
    value: "82%",
    status: "excellent",
    note: "Oltre il benchmark CER Emilia-Romagna del primo trimestre.",
  },
  {
    id: "pod-sync",
    label: "Allineamento POD e misure",
    value: "100%",
    status: "excellent",
    note: "Nessun POD in anomalia sul tracciato GSE.",
  },
  {
    id: "governance",
    label: "Partecipazione governance",
    value: "76%",
    status: "good",
    note: "Presenza media alle ultime due assemblee digitali.",
  },
  {
    id: "peak-shift",
    label: "Spostamento carichi in fascia solare",
    value: "+9%",
    status: "attention",
    note: "Margine di miglioramento su ricarica EV e pompe di calore.",
  },
];

export const gseReportingStatus = {
  currentRateEuroPerMwh: incentiveRateEuroPerMwh,
  lastSubmission: "06 mag 2025",
  nextDeadline: "31 mag 2025",
  statusLabel: "Allineato e pronto per invio",
  completeness: "100% POD validati",
};

export const pnrrGrantTracker = {
  eligibleBudgetEuro: 186000,
  approvedEuro: 132000,
  disbursedEuro: 79200,
  progressPct: 60,
  nextMilestone: "Collaudo inverter e monitoraggio condiviso · giugno 2025",
};

export const optimizationSuggestions = [
  "Sposta i consumi tra 10:00-15:00 per massimizzare l'autoconsumo.",
  "Programma pompe di calore e accumuli domestici nelle ore di picco fotovoltaico di aprile-settembre.",
  "Raggruppa i carichi delle utenze produttive il martedì e giovedì per aumentare la quota condivisa oltre 25 MWh/mese.",
];

export function getMemberBenefitStatement(member: CerMember) {
  if (member.energyBalanceKwh >= 0) {
    return `${member.name} mette a disposizione ${member.energyBalanceKwh} kWh netti e matura un beneficio stimato di €${member.monthlyBenefitEuro.toFixed(2)} al mese.`;
  }

  return `${member.name} assorbe ${Math.abs(member.energyBalanceKwh)} kWh condivisi e riduce la bolletta di circa €${member.monthlyBenefitEuro.toFixed(2)} al mese.`;
}

export function buildMember(input: {
  name: string;
  type: MemberType;
  podCode: string;
  energyBalanceKwh: number;
  municipality?: string;
}): CerMember {
  return {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    type: input.type,
    podCode: input.podCode.trim().toUpperCase(),
    energyBalanceKwh: input.energyBalanceKwh,
    monthlyBenefitEuro: calculateMemberBenefit(input.type, input.energyBalanceKwh),
    municipality: input.municipality?.trim() || cerProfile.municipality,
    joinedAt: new Date().toISOString().slice(0, 10),
  };
}

export const memberStore = new InMemoryStore<CerMember>();
memberStore.seed(cerMembers);
