import { prisma } from "@/lib/prisma";

const round = (value: number, decimals = 2) => Number(value.toFixed(decimals));

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

export interface CerMember {
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

export interface IncentiveShareRecord {
  memberId: string;
  name: string;
  sharePct: number;
  monthlyEuro: number;
  yearToDateEuro: number;
}

export interface GovernanceDocument {
  id: string;
  title: string;
  category: string;
  status: string;
  updatedAt: string;
  owner: string;
}

export interface GovernanceVote {
  id: string;
  title: string;
  scheduledAt: string;
  quorum: string;
  status: string;
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

const calculateMemberBenefit = (type: MemberType, balance: number) => {
  const base = type === "produttore" ? 96 : type === "prosumer" ? 82 : 44;
  const variable = balance >= 0 ? balance * 0.07 : Math.abs(balance) * 0.025;
  return round(base + variable);
};

// ── Database query functions ──

export async function getCerProfile(cerId = "cer-bertinoro"): Promise<CerProfile> {
  const cer = await prisma.cer.findUnique({ where: { id: cerId }, include: { members: true } });
  if (!cer) {
    return {
      id: cerId, name: "CER Demo", territory: "", municipality: "", province: "",
      members: 0, foundedYear: 2024, referenceNote: "",
    };
  }
  return {
    id: cer.id, name: cer.name, territory: cer.territory, municipality: cer.municipality,
    province: cer.province, members: cer.members.length, foundedYear: cer.foundedYear,
    referenceNote: cer.referenceNote || "",
  };
}

export async function getMembers(cerId = "cer-bertinoro"): Promise<CerMember[]> {
  const members = await prisma.member.findMany({ where: { cerId }, orderBy: { name: "asc" } });
  return members.map((m) => ({
    id: m.id, name: m.name, type: m.type as MemberType, podCode: m.podCode,
    energyBalanceKwh: m.energyBalanceKwh, monthlyBenefitEuro: m.monthlyBenefitEuro,
    municipality: m.municipality, joinedAt: m.joinedAt,
  }));
}

export async function getEnergyData(cerId = "cer-bertinoro"): Promise<EnergyMonth[]> {
  const readings = await prisma.energyReading.findMany({ where: { cerId }, orderBy: { createdAt: "asc" } });
  return readings.map((r) => ({
    id: r.id, label: r.label, productionKwh: r.productionKwh, consumptionKwh: r.consumptionKwh,
    sharedEnergyKwh: r.sharedEnergyKwh, selfConsumptionPct: r.selfConsumptionPct,
    savingsEuro: r.savingsEuro, gseIncentiveEuro: r.gseIncentiveEuro, co2AvoidedKg: r.co2AvoidedKg,
  }));
}

export async function getEnergySummary(cerId = "cer-bertinoro") {
  const data = await getEnergyData(cerId);
  return data.reduce(
    (acc, month) => {
      acc.productionKwh += month.productionKwh;
      acc.consumptionKwh += month.consumptionKwh;
      acc.sharedEnergyKwh += month.sharedEnergyKwh;
      acc.savingsEuro += month.savingsEuro;
      acc.gseIncentiveEuro += month.gseIncentiveEuro;
      return acc;
    },
    { productionKwh: 0, consumptionKwh: 0, sharedEnergyKwh: 0, savingsEuro: 0, gseIncentiveEuro: 0 }
  );
}

export async function getIncentiveDistribution(cerId = "cer-bertinoro"): Promise<IncentiveShareRecord[]> {
  const members = await getMembers(cerId);
  const shares = await prisma.incentiveShare.findMany({
    where: { memberId: { in: members.map((m) => m.id) } },
  });
  return shares.map((s) => {
    const member = members.find((m) => m.id === s.memberId);
    return {
      memberId: s.memberId, name: member?.name || "Sconosciuto",
      sharePct: s.sharePct, monthlyEuro: s.monthlyEuro, yearToDateEuro: s.yearToDateEuro,
    };
  });
}

export async function getDocuments(cerId = "cer-bertinoro"): Promise<GovernanceDocument[]> {
  const docs = await prisma.document.findMany({ where: { cerId } });
  return docs.map((d) => ({
    id: d.id, title: d.title, category: d.category,
    status: d.status.replace("_", " "), updatedAt: d.updatedAt.toLocaleDateString("it-IT"),
    owner: d.owner,
  }));
}

export async function getVotes(cerId = "cer-bertinoro"): Promise<GovernanceVote[]> {
  const votes = await prisma.vote.findMany({ where: { cerId } });
  return votes.map((v) => ({
    id: v.id, title: v.title, scheduledAt: v.scheduledAt, quorum: v.quorum, status: v.status,
  }));
}

export async function getAnnouncements(cerId = "cer-bertinoro"): Promise<Announcement[]> {
  const anns = await prisma.announcement.findMany({ where: { cerId }, orderBy: { createdAt: "desc" } });
  return anns.map((a) => ({
    id: a.id, title: a.title, message: a.message, publishedAt: a.publishedAt,
  }));
}

export async function createMember(input: {
  name: string;
  type: MemberType;
  podCode: string;
  energyBalanceKwh: number;
  municipality?: string;
  cerId?: string;
}): Promise<CerMember> {
  const cerId = input.cerId || "cer-bertinoro";
  const cer = await prisma.cer.findUnique({ where: { id: cerId } });
  const member = await prisma.member.create({
    data: {
      name: input.name.trim(),
      type: input.type,
      podCode: input.podCode.trim().toUpperCase(),
      energyBalanceKwh: input.energyBalanceKwh,
      monthlyBenefitEuro: calculateMemberBenefit(input.type, input.energyBalanceKwh),
      municipality: input.municipality?.trim() || cer?.municipality || "Bertinoro",
      joinedAt: new Date().toISOString().slice(0, 10),
      cerId,
    },
  });
  return {
    id: member.id, name: member.name, type: member.type as MemberType,
    podCode: member.podCode, energyBalanceKwh: member.energyBalanceKwh,
    monthlyBenefitEuro: member.monthlyBenefitEuro, municipality: member.municipality,
    joinedAt: member.joinedAt,
  };
}

export async function memberExistsByPod(podCode: string): Promise<boolean> {
  const member = await prisma.member.findUnique({ where: { podCode: podCode.trim().toUpperCase() } });
  return !!member;
}

export function getMemberBenefitStatement(member: CerMember) {
  if (member.energyBalanceKwh >= 0) {
    return `${member.name} mette a disposizione ${member.energyBalanceKwh} kWh netti e matura un beneficio stimato di €${member.monthlyBenefitEuro.toFixed(2)} al mese.`;
  }
  return `${member.name} assorbe ${Math.abs(member.energyBalanceKwh)} kWh condivisi e riduce la bolletta di circa €${member.monthlyBenefitEuro.toFixed(2)} al mese.`;
}

export async function getPnrrGrant(cerId = "cer-bertinoro") {
  const grant = await prisma.pnrrGrant.findFirst({ where: { cerId } });
  if (!grant) {
    return {
      eligibleBudgetEuro: 0, approvedEuro: 0, disbursedEuro: 0,
      progressPct: 0, nextMilestone: "N/A",
    };
  }
  return {
    eligibleBudgetEuro: grant.eligibleBudgetEuro, approvedEuro: grant.approvedEuro,
    disbursedEuro: grant.disbursedEuro, progressPct: grant.progressPct,
    nextMilestone: grant.nextMilestone || "N/A",
  };
}

export const gseReportingStatus = {
  currentRateEuroPerMwh: incentiveRateEuroPerMwh,
  lastSubmission: "06 mag 2025",
  nextDeadline: "31 mag 2025",
  statusLabel: "Allineato e pronto per invio",
  completeness: "100% POD validati",
};

export const optimizationSuggestions = [
  "Sposta i consumi tra 10:00-15:00 per massimizzare l'autoconsumo.",
  "Programma pompe di calore e accumuli domestici nelle ore di picco fotovoltaico di aprile-settembre.",
  "Raggruppa i carichi delle utenze produttive il martedì e giovedì per aumentare la quota condivisa oltre 25 MWh/mese.",
];

export const recentActivity: ActivityItem[] = [
  { id: "activity-1", title: "Caricate le misure GSE di aprile", description: "Verificati i 25 POD e chiusa la pratica di rendicontazione mensile senza scostamenti.", timestamp: "Oggi · 09:20", tone: "positive" },
  { id: "activity-2", title: "Nuova richiesta di adesione da Forlimpopoli", description: "Un condominio da 12 unità abitative ha avviato l'assessment preliminare.", timestamp: "Ieri · 16:40", tone: "neutral" },
  { id: "activity-3", title: "Segnalata fascia serale sopra target", description: "Consumi 19:00-22:00 superiori del 12% rispetto al piano ottimale condiviso.", timestamp: "Ieri · 11:05", tone: "attention" },
  { id: "activity-4", title: "Verbale assemblea inviato per firma digitale", description: "Il documento è disponibile nell'area governance con notifica ai 25 membri.", timestamp: "05 mag 2025", tone: "positive" },
];

export const healthIndicators: HealthIndicator[] = [
  { id: "autoconsumo", label: "Autoconsumo condiviso", value: "82%", status: "excellent", note: "Oltre il benchmark CER Emilia-Romagna del primo trimestre." },
  { id: "pod-sync", label: "Allineamento POD e misure", value: "100%", status: "excellent", note: "Nessun POD in anomalia sul tracciato GSE." },
  { id: "governance", label: "Partecipazione governance", value: "76%", status: "good", note: "Presenza media alle ultime due assemblee digitali." },
  { id: "peak-shift", label: "Spostamento carichi in fascia solare", value: "+9%", status: "attention", note: "Margine di miglioramento su ricarica EV e pompe di calore." },
];

// Health check for the database connection
export async function checkDatabaseHealth(): Promise<{ connected: boolean; tables: number; error?: string }> {
  try {
    const userCount = await prisma.user.count();
    return { connected: true, tables: userCount > 0 ? 16 : 0 };
  } catch (error) {
    return { connected: false, tables: 0, error: String(error) };
  }
}
