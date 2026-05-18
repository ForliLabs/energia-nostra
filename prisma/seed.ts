import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "node:path";

const dbPath = path.join(import.meta.dirname || __dirname, "..", "dev.db");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

type MemberType = "produttore" | "consumatore" | "prosumer";
type UserRole = "admin" | "member" | "auditor" | "superadmin";

type MemberSeed = {
  slug: string;
  name: string;
  userRole: UserRole;
  type: MemberType;
  municipality: string;
  joinedAt: string;
  baseConsumption: number;
  baseProduction: number;
  roofKwp: number;
  note: string;
};

type CerSeed = {
  id: string;
  slug: string;
  name: string;
  territory: string;
  municipality: string;
  province: string;
  foundedYear: number;
  referenceNote: string;
  cabinaPrimaria: string;
  latitude: number;
  longitude: number;
  members: MemberSeed[];
};

type MemberContext = MemberSeed & {
  id: string;
  userId: string;
  cerId: string;
  podCode: string;
};

type MonthlyMemberTotals = {
  production: number;
  consumption: number;
};

type MonthlyCerTotals = {
  cerId: string;
  period: string;
  label: string;
  production: number;
  consumption: number;
  shared: number;
  savings: number;
  incentive: number;
  co2: number;
};

const incentiveRateEuroPerMwh = 118;
const monthNames = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
const notificationCategories = ["billing", "voting", "energy", "trading", "governance", "gamification"];

const round = (value: number, decimals = 2) => Number(value.toFixed(decimals));

function utcDate(year: number, month: number, day: number, hour = 12) {
  return new Date(Date.UTC(year, month, day, hour, 0, 0, 0));
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function addMonths(date: Date, months: number) {
  const copy = new Date(date);
  copy.setUTCMonth(copy.getUTCMonth() + months, 1);
  return copy;
}

function startOfMonth(date: Date) {
  return utcDate(date.getUTCFullYear(), date.getUTCMonth(), 1);
}

function endOfMonth(date: Date) {
  return utcDate(date.getUTCFullYear(), date.getUTCMonth() + 1, 0);
}

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return `${monthNames[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function sinusoid(dayIndex: number, offset: number, amplitude: number, period = 28) {
  return 1 + Math.sin((dayIndex + offset) / period) * amplitude;
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "energia-nostra-salt-2025");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function createManyInChunks<T>(items: T[], size: number, callback: (chunk: T[]) => Promise<unknown>) {
  for (let index = 0; index < items.length; index += size) {
    await callback(items.slice(index, index + size));
  }
}

function productionFor(member: MemberSeed, day: Date, dayIndex: number, memberIndex: number) {
  if (member.baseProduction <= 0) return 0;
  const seasonal = 0.62 + Math.sin((day.getUTCMonth() - 1.2) / 11 * Math.PI) * 0.28;
  const daylight = day.getUTCMonth() >= 3 && day.getUTCMonth() <= 8 ? 1.08 : 0.92;
  const weekend = day.getUTCDay() === 0 || day.getUTCDay() === 6 ? 1.03 : 1;
  const cloudPenalty = 1 - ((dayIndex + memberIndex * 3) % 9) * 0.015;
  return round(member.baseProduction * seasonal * daylight * weekend * cloudPenalty * sinusoid(dayIndex, memberIndex, 0.12));
}

function consumptionFor(member: MemberSeed, day: Date, dayIndex: number, memberIndex: number) {
  const seasonal = day.getUTCMonth() <= 1 || day.getUTCMonth() === 11 ? 1.17 : day.getUTCMonth() <= 3 ? 1.06 : 0.94;
  const weekend = day.getUTCDay() === 0 || day.getUTCDay() === 6 ? 1.08 : 1;
  const eveningPeak = 1 + ((dayIndex + memberIndex) % 5) * 0.018;
  return round(member.baseConsumption * seasonal * weekend * eveningPeak * sinusoid(dayIndex, memberIndex * 2, 0.08, 21));
}

function shareWeight(member: MemberSeed, totals: MonthlyMemberTotals) {
  const typeWeight = member.type === "produttore" ? 1.34 : member.type === "prosumer" ? 1.18 : 0.94;
  const flexibility = member.type === "consumatore" ? totals.consumption * 0.35 : totals.production * 0.22;
  const contribution = member.type === "consumatore"
    ? totals.consumption * 0.18
    : totals.production * 0.55 + Math.max(0, totals.production - totals.consumption * 0.3);
  return Math.max(1, typeWeight * (flexibility + contribution));
}

const cerSeeds: CerSeed[] = [
  {
    id: "cer-forli-centro",
    slug: "forli-centro",
    name: "CER Forlì Centro",
    territory: "Centro storico, San Biagio, Cava e viale Roma",
    municipality: "Forlì",
    province: "Forlì-Cesena",
    foundedYear: 2024,
    referenceNote: "Comunità urbana con condomini residenziali, negozi di prossimità e piccoli uffici tra il centro storico e la prima cintura di Forlì.",
    cabinaPrimaria: "Forlì Centro",
    latitude: 44.2222,
    longitude: 12.0404,
    members: [
      { slug: "alessandra-fabbri", name: "Alessandra Fabbri", userRole: "admin", type: "prosumer", municipality: "Forlì", joinedAt: "2024-02-12", baseConsumption: 11.8, baseProduction: 16.4, roofKwp: 7.5, note: "Condominio con impianto condiviso da 18 kWp" },
      { slug: "luca-benelli", name: "Luca Benelli", userRole: "member", type: "prosumer", municipality: "Forlì", joinedAt: "2024-03-02", baseConsumption: 10.2, baseProduction: 13.2, roofKwp: 6.2, note: "Studio tecnico con carichi diurni stabili" },
      { slug: "sara-donati", name: "Sara Donati", userRole: "member", type: "consumatore", municipality: "Forlì", joinedAt: "2024-03-15", baseConsumption: 12.9, baseProduction: 0, roofKwp: 0, note: "Famiglia in appartamento con pompa di calore" },
      { slug: "matteo-casadei", name: "Matteo Casadei", userRole: "member", type: "consumatore", municipality: "Forlì", joinedAt: "2024-04-11", baseConsumption: 14.4, baseProduction: 0, roofKwp: 0, note: "Ristorante di quartiere con picchi serali" },
      { slug: "giulia-montanari", name: "Giulia Montanari", userRole: "member", type: "prosumer", municipality: "Forlì", joinedAt: "2024-05-07", baseConsumption: 9.4, baseProduction: 11.5, roofKwp: 5.4, note: "Villetta con wallbox domestica" },
      { slug: "paolo-ricci", name: "Paolo Ricci", userRole: "member", type: "produttore", municipality: "Forlì", joinedAt: "2024-02-21", baseConsumption: 4.8, baseProduction: 25.8, roofKwp: 18.7, note: "Capannone artigianale con tetto fotovoltaico" },
      { slug: "elena-zoli", name: "Elena Zoli", userRole: "member", type: "consumatore", municipality: "Forlì", joinedAt: "2024-06-10", baseConsumption: 8.6, baseProduction: 0, roofKwp: 0, note: "Studio medico con carichi refrigerazione" },
      { slug: "davide-bellini", name: "Davide Bellini", userRole: "member", type: "prosumer", municipality: "Forlì", joinedAt: "2024-05-24", baseConsumption: 10.8, baseProduction: 12.6, roofKwp: 5.8, note: "Abitazione con batteria da 10 kWh" },
      { slug: "francesca-miserocchi", name: "Francesca Miserocchi", userRole: "member", type: "consumatore", municipality: "Forlì", joinedAt: "2024-07-01", baseConsumption: 7.8, baseProduction: 0, roofKwp: 0, note: "Negozio alimentare di prossimità" },
    ],
  },
  {
    id: "cer-valle-bidente",
    slug: "valle-bidente",
    name: "CER Valle del Bidente",
    territory: "Meldola, Cusercoli, Santa Sofia e prima valle del Bidente",
    municipality: "Meldola",
    province: "Forlì-Cesena",
    foundedYear: 2024,
    referenceNote: "Comunità diffusa in area valliva con aziende agricole, famiglie e servizi di prossimità tra Meldola e Santa Sofia.",
    cabinaPrimaria: "Meldola-Bidente",
    latitude: 44.1264,
    longitude: 12.0618,
    members: [
      { slug: "stefano-valentini", name: "Stefano Valentini", userRole: "admin", type: "prosumer", municipality: "Meldola", joinedAt: "2024-01-28", baseConsumption: 12.2, baseProduction: 15.2, roofKwp: 7.1, note: "Casa bifamiliare con accumulo condiviso" },
      { slug: "martina-ghetti", name: "Martina Ghetti", userRole: "member", type: "consumatore", municipality: "Cusercoli", joinedAt: "2024-03-06", baseConsumption: 9.8, baseProduction: 0, roofKwp: 0, note: "Appartamento con pompa di calore" },
      { slug: "lorenzo-rossi", name: "Lorenzo Rossi", userRole: "member", type: "produttore", municipality: "Santa Sofia", joinedAt: "2024-02-10", baseConsumption: 5.6, baseProduction: 28.4, roofKwp: 21.2, note: "Azienda agricola con essiccatoio e tetto FV" },
      { slug: "chiara-bartolini", name: "Chiara Bartolini", userRole: "member", type: "prosumer", municipality: "Meldola", joinedAt: "2024-03-19", baseConsumption: 10.1, baseProduction: 12.4, roofKwp: 5.9, note: "Abitazione con auto elettrica" },
      { slug: "andrea-bassi", name: "Andrea Bassi", userRole: "member", type: "consumatore", municipality: "Meldola", joinedAt: "2024-04-09", baseConsumption: 13.8, baseProduction: 0, roofKwp: 0, note: "Laboratorio gastronomico con celle frigo" },
      { slug: "valentina-liverani", name: "Valentina Liverani", userRole: "member", type: "prosumer", municipality: "Santa Sofia", joinedAt: "2024-05-03", baseConsumption: 8.9, baseProduction: 10.8, roofKwp: 5.1, note: "B&B collinare con consumi nel weekend" },
      { slug: "nicola-paganelli", name: "Nicola Paganelli", userRole: "member", type: "consumatore", municipality: "Meldola", joinedAt: "2024-06-12", baseConsumption: 8.4, baseProduction: 0, roofKwp: 0, note: "Piccola farmacia di paese" },
      { slug: "federica-neri", name: "Federica Neri", userRole: "member", type: "produttore", municipality: "Cusercoli", joinedAt: "2024-04-28", baseConsumption: 6.2, baseProduction: 22.6, roofKwp: 16.5, note: "Cantina con impianto FV su tettoia" },
      { slug: "marco-maltoni", name: "Marco Maltoni", userRole: "member", type: "consumatore", municipality: "Meldola", joinedAt: "2024-07-08", baseConsumption: 11.3, baseProduction: 0, roofKwp: 0, note: "Condominio con utenze comuni in fascia serale" },
    ],
  },
];

async function main() {
  console.log("🌱 Seeding energia-nostra demo data...");

  await prisma.translation.deleteMany();
  await prisma.translationKey.deleteMany();
  await prisma.countryConfig.deleteMany();
  await prisma.carbonTransaction.deleteMany();
  await prisma.carbonCredit.deleteMany();
  await prisma.webhookDelivery.deleteMany();
  await prisma.webhookSubscription.deleteMany();
  await prisma.apiUsageLog.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.challengeParticipant.deleteMany();
  await prisma.challenge.deleteMany();
  await prisma.memberAchievement.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.signatureRequest.deleteMany();
  await prisma.generatedDocument.deleteMany();
  await prisma.documentTemplate.deleteMany();
  await prisma.tradeMatch.deleteMany();
  await prisma.energyOffer.deleteMany();
  await prisma.tradingAccount.deleteMany();
  await prisma.weatherCache.deleteMany();
  await prisma.energyForecast.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.pnrrGrant.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.paymentMandate.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.postComment.deleteMany();
  await prisma.postReaction.deleteMany();
  await prisma.communityPost.deleteMany();
  await prisma.directMessage.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.deviceCommand.deleteMany();
  await prisma.deviceTelemetry.deleteMany();
  await prisma.chargingSession.deleteMany();
  await prisma.smartDevice.deleteMany();
  await prisma.gseSubmission.deleteMany();
  await prisma.gseReconciliation.deleteMany();
  await prisma.taxDocument.deleteMany();
  await prisma.bankTransaction.deleteMany();
  await prisma.importJob.deleteMany();
  await prisma.storageObject.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.gseReport.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.ballotCast.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.document.deleteMany();
  await prisma.incentiveShare.deleteMany();
  await prisma.meterReading.deleteMany();
  await prisma.meterUpload.deleteMany();
  await prisma.energyReading.deleteMany();
  await prisma.member.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.cer.deleteMany();

  const passwordHash = await hashPassword("demo2025");
  const today = utcDate(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate());
  const startDate = startOfMonth(addMonths(today, -5));
  const periodStarts = Array.from({ length: 6 }, (_, index) => startOfMonth(addMonths(startDate, index)));

  const superAdmin = await prisma.user.create({
    data: {
      id: "user-superadmin",
      email: "superadmin@energianostra.it",
      name: "Piattaforma Energia Nostra",
      passwordHash,
      role: "superadmin",
      authProvider: "local",
      lastLoginAt: addDays(today, -1),
    },
  });

  const cerContexts: Array<{ seed: CerSeed; memberContexts: MemberContext[]; adminUserId: string; userIds: string[] }> = [];

  for (const [cerIndex, cerSeed] of cerSeeds.entries()) {
    await prisma.cer.create({
      data: {
        id: cerSeed.id,
        name: cerSeed.name,
        territory: cerSeed.territory,
        municipality: cerSeed.municipality,
        province: cerSeed.province,
        foundedYear: cerSeed.foundedYear,
        referenceNote: cerSeed.referenceNote,
        cabinaPrimaria: cerSeed.cabinaPrimaria,
      },
    });

    const auditor = await prisma.user.create({
      data: {
        id: `${cerSeed.id}-auditor`,
        email: `revisore.${cerSeed.slug}@energianostra.it`,
        name: `Revisore ${cerSeed.name}`,
        passwordHash,
        role: "auditor",
        cerId: cerSeed.id,
        authProvider: "local",
        lastLoginAt: addDays(today, -3 - cerIndex),
      },
    });

    const memberContexts: MemberContext[] = [];
    const userIds = [auditor.id];
    let adminUserId = auditor.id;

    for (const [memberIndex, memberSeed] of cerSeed.members.entries()) {
      const userId = `user-${memberSeed.slug}`;
      const memberId = `member-${memberSeed.slug}`;
      const podCode = `IT001E${String(880000000 + cerIndex * 100 + memberIndex + 1).padStart(9, "0")}`;

      await prisma.user.create({
        data: {
          id: userId,
          email: `${memberSeed.slug}@energianostra.it`,
          name: memberSeed.name,
          passwordHash,
          role: memberSeed.userRole,
          cerId: cerSeed.id,
          authProvider: "local",
          fiscalCode: `${memberSeed.slug.slice(0, 3).toUpperCase()}${String(1984 + memberIndex).slice(-2)}${String(10 + memberIndex).padStart(2, "0")}F${String(100 + memberIndex).slice(-3)}`,
          lastLoginAt: addDays(today, -(memberIndex % 6) - 1),
        },
      });

      await prisma.member.create({
        data: {
          id: memberId,
          name: memberSeed.name,
          type: memberSeed.type,
          podCode,
          energyBalanceKwh: 0,
          monthlyBenefitEuro: 0,
          municipality: memberSeed.municipality,
          joinedAt: memberSeed.joinedAt,
          cerId: cerSeed.id,
        },
      });

      memberContexts.push({ ...memberSeed, id: memberId, userId, cerId: cerSeed.id, podCode });
      userIds.push(userId);
      if (memberSeed.userRole === "admin") adminUserId = userId;
    }

    cerContexts.push({ seed: cerSeed, memberContexts, adminUserId, userIds });
  }

  await prisma.notificationPreference.createMany({
    data: cerContexts.flatMap((cer) =>
      cer.userIds.flatMap((userId) =>
        notificationCategories.map((category) => ({
          userId,
          category,
          pushEnabled: category !== "trading",
          emailEnabled: true,
          inAppEnabled: true,
        })),
      ),
    ),
  });

  console.log(`  ✓ ${cerContexts.length} CER created`);
  console.log(`  ✓ ${1 + cerContexts.reduce((sum, cer) => sum + cer.userIds.length, 0)} users created`);
  console.log(`  ✓ ${cerContexts.reduce((sum, cer) => sum + cer.memberContexts.length, 0)} members created`);

  const uploadIdByKey = new Map<string, string>();
  const uploadTallies = new Map<string, { recordCount: number; validCount: number; anomalyCount: number }>();

  for (const cer of cerContexts) {
    for (const periodStart of periodStarts) {
      const upload = await prisma.meterUpload.create({
        data: {
          fileName: `misure_${cer.seed.slug}_${monthKey(periodStart)}.csv`,
          recordCount: 0,
          validCount: 0,
          anomalyCount: 0,
          status: "completed",
          uploadedById: cer.adminUserId,
          cerId: cer.seed.id,
        },
      });
      uploadIdByKey.set(`${cer.seed.id}:${monthKey(periodStart)}`, upload.id);
      uploadTallies.set(upload.id, { recordCount: 0, validCount: 0, anomalyCount: 0 });
    }
  }

  const meterReadingRows: Array<{
    memberId: string;
    timestamp: Date;
    consumptionKwh: number;
    productionKwh: number;
    source: string;
    validated: boolean;
    anomaly?: string;
    uploadId: string;
  }> = [];

  const monthlyCerTotals = new Map<string, MonthlyCerTotals>();
  const monthlyMemberTotals = new Map<string, MonthlyMemberTotals>();

  let cursor = new Date(startDate);
  let dayIndex = 0;
  while (cursor <= today) {
    for (const cer of cerContexts) {
      const monthId = monthKey(cursor);
      const cerMonthKey = `${cer.seed.id}:${monthId}`;
      const uploadId = uploadIdByKey.get(cerMonthKey)!;
      let cerDayProduction = 0;
      let cerDayConsumption = 0;

      for (const [memberIndex, member] of cer.memberContexts.entries()) {
        const production = productionFor(member, cursor, dayIndex, memberIndex);
        const consumption = consumptionFor(member, cursor, dayIndex, memberIndex);
        const anomaly = ((dayIndex + memberIndex + cer.seed.id.length) % 67 === 0)
          ? member.type === "consumatore"
            ? "prelievo_notturno_fuori_profilo"
            : "latenza_upload_misuratore"
          : undefined;

        meterReadingRows.push({
          memberId: member.id,
          timestamp: new Date(cursor),
          consumptionKwh: consumption,
          productionKwh: production,
          source: member.type === "consumatore" ? "csv" : "api",
          validated: !anomaly,
          anomaly,
          uploadId,
        });

        cerDayProduction += production;
        cerDayConsumption += consumption;

        const memberMonthKey = `${member.id}:${monthId}`;
        const memberMonthTotals = monthlyMemberTotals.get(memberMonthKey) ?? { production: 0, consumption: 0 };
        memberMonthTotals.production += production;
        memberMonthTotals.consumption += consumption;
        monthlyMemberTotals.set(memberMonthKey, memberMonthTotals);

        const tallies = uploadTallies.get(uploadId)!;
        tallies.recordCount += 1;
        if (anomaly) {
          tallies.anomalyCount += 1;
        } else {
          tallies.validCount += 1;
        }
      }

      const sharedDaily = Math.min(cerDayProduction * 0.91, cerDayConsumption * 0.83);
      const monthly = monthlyCerTotals.get(cerMonthKey) ?? {
        cerId: cer.seed.id,
        period: monthId,
        label: monthLabel(cursor),
        production: 0,
        consumption: 0,
        shared: 0,
        savings: 0,
        incentive: 0,
        co2: 0,
      };

      monthly.production += cerDayProduction;
      monthly.consumption += cerDayConsumption;
      monthly.shared += sharedDaily;
      monthly.savings += sharedDaily * 0.187;
      monthly.incentive += (sharedDaily / 1000) * incentiveRateEuroPerMwh;
      monthly.co2 += sharedDaily * 0.362;
      monthlyCerTotals.set(cerMonthKey, monthly);
    }

    cursor = addDays(cursor, 1);
    dayIndex += 1;
  }

  await createManyInChunks(meterReadingRows, 400, (chunk) => prisma.meterReading.createMany({ data: chunk }));

  for (const [uploadId, tally] of uploadTallies.entries()) {
    await prisma.meterUpload.update({
      where: { id: uploadId },
      data: tally,
    });
  }

  await prisma.energyReading.createMany({
    data: Array.from(monthlyCerTotals.values()).map((reading) => ({
      id: `energy-${reading.cerId}-${reading.period}`,
      label: reading.label,
      productionKwh: round(reading.production),
      consumptionKwh: round(reading.consumption),
      sharedEnergyKwh: round(reading.shared),
      selfConsumptionPct: round((reading.shared / reading.consumption) * 100, 1),
      savingsEuro: round(reading.savings),
      gseIncentiveEuro: round(reading.incentive),
      co2AvoidedKg: round(reading.co2),
      cerId: reading.cerId,
    })),
  });

  console.log(`  ✓ ${meterReadingRows.length} daily meter readings created`);
  console.log(`  ✓ ${monthlyCerTotals.size} monthly CER energy readings created`);

  const documents = [
    {
      id: "doc-forli-statuto",
      title: "Statuto CER Forlì Centro",
      category: "statuto",
      status: "approvato",
      owner: "Consiglio direttivo",
      fileUrl: "s3://energia-nostra/atti/forli-centro/statuto-approvato.pdf",
      cerId: "cer-forli-centro",
      signedAt: addDays(today, -180),
    },
    {
      id: "doc-forli-verbale-marzo",
      title: "Verbale assemblea ordinaria del 21 marzo 2026",
      category: "verbale",
      status: "approvato",
      owner: "Segreteria CER",
      fileUrl: "s3://energia-nostra/verbali/forli-centro/2026-03-21.pdf",
      cerId: "cer-forli-centro",
      signedAt: addDays(today, -58),
    },
    {
      id: "doc-forli-fattura-gse-apr",
      title: "Fattura GSE aprile 2026 - CER Forlì Centro",
      category: "fattura_gse",
      status: "approvato",
      owner: "Amministrazione",
      fileUrl: "s3://energia-nostra/fatture/forli-centro/gse-apr-2026.pdf",
      cerId: "cer-forli-centro",
      signedAt: addDays(today, -10),
    },
    {
      id: "doc-forli-contratto-accumulo",
      title: "Contratto manutenzione accumulo condominiale",
      category: "contratto",
      status: "da_firmare",
      owner: "Energy manager",
      fileUrl: "s3://energia-nostra/contratti/forli-centro/manutenzione-accumulo.pdf",
      cerId: "cer-forli-centro",
    },
    {
      id: "doc-forli-regolamento",
      title: "Regolamento di riparto incentivi 2026",
      category: "regolamento",
      status: "in_revisione",
      owner: "Comitato tecnico",
      fileUrl: "s3://energia-nostra/atti/forli-centro/regolamento-riparto-2026.pdf",
      cerId: "cer-forli-centro",
    },
    {
      id: "doc-bidente-statuto",
      title: "Statuto CER Valle del Bidente",
      category: "statuto",
      status: "approvato",
      owner: "Consiglio direttivo",
      fileUrl: "s3://energia-nostra/atti/valle-bidente/statuto-approvato.pdf",
      cerId: "cer-valle-bidente",
      signedAt: addDays(today, -210),
    },
    {
      id: "doc-bidente-verbale-feb",
      title: "Verbale assemblea investimenti del 17 febbraio 2026",
      category: "verbale",
      status: "approvato",
      owner: "Segreteria CER",
      fileUrl: "s3://energia-nostra/verbali/valle-bidente/2026-02-17.pdf",
      cerId: "cer-valle-bidente",
      signedAt: addDays(today, -91),
    },
    {
      id: "doc-bidente-fattura-gse-apr",
      title: "Fattura GSE aprile 2026 - CER Valle del Bidente",
      category: "fattura_gse",
      status: "approvato",
      owner: "Amministrazione",
      fileUrl: "s3://energia-nostra/fatture/valle-bidente/gse-apr-2026.pdf",
      cerId: "cer-valle-bidente",
      signedAt: addDays(today, -12),
    },
    {
      id: "doc-bidente-contratto-cabina",
      title: "Contratto ampliamento POD consorzio Cusercoli",
      category: "contratto",
      status: "da_firmare",
      owner: "Presidenza CER",
      fileUrl: "s3://energia-nostra/contratti/valle-bidente/ampliamento-cusercoli.pdf",
      cerId: "cer-valle-bidente",
    },
    {
      id: "doc-bidente-report-tecnico",
      title: "Report tecnico microgrid valliva Q1 2026",
      category: "report",
      status: "approvato",
      owner: "Advisor tecnico",
      fileUrl: "s3://energia-nostra/report/valle-bidente/q1-2026.pdf",
      cerId: "cer-valle-bidente",
      signedAt: addDays(today, -34),
    },
  ];
  await prisma.document.createMany({ data: documents });

  const voteSeeds = [
    {
      id: "vote-forli-storage",
      cerId: "cer-forli-centro",
      title: "Investimento in batteria condivisa da 120 kWh",
      description: "Approvazione dell'ordine per batteria LFP da installare nel condominio capofila di viale Roma.",
      options: JSON.stringify(["Favorevole", "Contrario", "Astenuto"]),
      voteType: "secret",
      quorum: "Maggioranza semplice dei soci presenti",
      scheduledAt: addDays(today, -42).toISOString(),
      closesAt: addDays(today, -39).toISOString(),
      status: "chiusa",
      turnout: 0.89,
      resultPattern: ["Favorevole", "Favorevole", "Favorevole", "Favorevole", "Contrario", "Favorevole", "Astenuto", "Favorevole", "Favorevole"],
    },
    {
      id: "vote-forli-rules",
      cerId: "cer-forli-centro",
      title: "Nuove regole di prenotazione per le ricariche condominiali",
      description: "Fasce orarie dedicate ai soci con auto elettrica e priorità nei weekend di picco.",
      options: JSON.stringify(["Approvo", "Non approvo", "Astenuto"]),
      voteType: "open",
      quorum: "50% + 1 degli aventi diritto",
      scheduledAt: addDays(today, -8).toISOString(),
      closesAt: addDays(today, -5).toISOString(),
      status: "chiusa",
      turnout: 0.78,
      resultPattern: ["Approvo", "Approvo", "Approvo", "Non approvo", "Approvo", "Approvo", "Astenuto", "Approvo"],
    },
    {
      id: "vote-forli-expansion",
      cerId: "cer-forli-centro",
      title: "Ingresso di tre nuovi POD commerciali in corso Mazzini",
      description: "Consultazione per l'ampliamento della comunità a botteghe e studio professionale del centro.",
      options: JSON.stringify(["Favorevole", "Contrario", "Astenuto"]),
      voteType: "open",
      quorum: "Maggioranza semplice",
      scheduledAt: addDays(today, 4).toISOString(),
      closesAt: addDays(today, 7).toISOString(),
      status: "programmata",
      turnout: 0,
      resultPattern: [],
    },
    {
      id: "vote-bidente-pod",
      cerId: "cer-valle-bidente",
      title: "Estensione della CER verso Cusercoli e San Piero",
      description: "Delibera sull'attivazione di un secondo cluster di POD agricoli e residenziali in valle.",
      options: JSON.stringify(["Favorevole", "Contrario", "Astenuto"]),
      voteType: "open",
      quorum: "Maggioranza qualificata 2/3",
      scheduledAt: addDays(today, -61).toISOString(),
      closesAt: addDays(today, -58).toISOString(),
      status: "chiusa",
      turnout: 1,
      resultPattern: ["Favorevole", "Favorevole", "Contrario", "Favorevole", "Favorevole", "Favorevole", "Astenuto", "Favorevole", "Favorevole"],
    },
    {
      id: "vote-bidente-social-fund",
      cerId: "cer-valle-bidente",
      title: "Fondo solidarietà energetica per famiglie fragili",
      description: "Destinazione del 15% dei crediti di carbonio a un fondo mutualistico per le utenze vulnerabili.",
      options: JSON.stringify(["Approvo", "Non approvo", "Astenuto"]),
      voteType: "open",
      quorum: "Maggioranza semplice",
      scheduledAt: addDays(today, -14).toISOString(),
      closesAt: addDays(today, -11).toISOString(),
      status: "chiusa",
      turnout: 0.89,
      resultPattern: ["Approvo", "Approvo", "Approvo", "Approvo", "Non approvo", "Approvo", "Approvo", "Astenuto"],
    },
    {
      id: "vote-bidente-inverter",
      cerId: "cer-valle-bidente",
      title: "Sostituzione inverter di campo presso la cantina di Cusercoli",
      description: "Votazione urgente su ordine e installazione entro fine giugno per evitare perdita di produzione estiva.",
      options: JSON.stringify(["Favorevole", "Contrario", "Astenuto"]),
      voteType: "secret",
      quorum: "50% + 1 degli aventi diritto",
      scheduledAt: addDays(today, 2).toISOString(),
      closesAt: addDays(today, 4).toISOString(),
      status: "aperta",
      turnout: 0.56,
      resultPattern: ["Favorevole", "Favorevole", "Contrario", "Favorevole", "Astenuto"],
    },
  ];

  await prisma.vote.createMany({
    data: voteSeeds.map((vote) => ({
      id: vote.id,
      cerId: vote.cerId,
      title: vote.title,
      description: vote.description,
      options: vote.options,
      voteType: vote.voteType,
      quorum: vote.quorum,
      scheduledAt: vote.scheduledAt,
      closesAt: vote.closesAt,
      status: vote.status,
    })),
  });

  const ballotRows = [] as Array<{ voteId: string; userId: string; choice: string }>;
  for (const vote of voteSeeds) {
    const cer = cerContexts.find((item) => item.seed.id === vote.cerId)!;
    const eligibleUsers = cer.memberContexts.map((member) => member.userId);
    const turnoutCount = Math.round(eligibleUsers.length * vote.turnout);
    for (let index = 0; index < turnoutCount; index += 1) {
      ballotRows.push({
        voteId: vote.id,
        userId: eligibleUsers[index],
        choice: vote.resultPattern[index] ?? (index % 4 === 0 ? JSON.parse(vote.options)[1] : JSON.parse(vote.options)[0]),
      });
    }
  }
  await prisma.ballotCast.createMany({ data: ballotRows });

  const announcements = [
    { id: "ann-forli-1", cerId: "cer-forli-centro", title: "Open day CER in Piazza Saffi", message: "Sabato mattina gazebo informativo con simulatore bolletta condivisa e demo dashboard live per nuovi soci.", publishedAt: "05 mag 2026" },
    { id: "ann-forli-2", cerId: "cer-forli-centro", title: "Upload misure di aprile validato al 98,7%", message: "Resta aperta una sola anomalia su POD commerciale, già pianificato sopralluogo con il distributore.", publishedAt: "09 mag 2026" },
    { id: "ann-forli-3", cerId: "cer-forli-centro", title: "Nuova convenzione per manutenzione inverter condominiali", message: "Tariffa calmierata per soci su verifiche annuali e interventi rapidi entro 48 ore.", publishedAt: "14 mag 2026" },
    { id: "ann-bidente-1", cerId: "cer-valle-bidente", title: "Piano estate: più accumulo per weekend turistici", message: "Attivata la logica di ottimizzazione per B&B e agriturismi della valle con previsioni su occupazione e meteo.", publishedAt: "03 mag 2026" },
    { id: "ann-bidente-2", cerId: "cer-valle-bidente", title: "Conferenza con i sindaci della valle del Bidente", message: "Presentati i risultati del primo trimestre e la proposta di fondo solidarietà energetica territoriale.", publishedAt: "11 mag 2026" },
    { id: "ann-bidente-3", cerId: "cer-valle-bidente", title: "Verifica straordinaria inverter cantina Cusercoli", message: "Intervento programmato martedì alle 7:30 con riduzione minima attesa della produzione giornaliera.", publishedAt: "16 mag 2026" },
  ];
  await prisma.announcement.createMany({ data: announcements });

  await prisma.gseReport.createMany({
    data: Array.from(monthlyCerTotals.values()).map((reading) => ({
      id: `gse-${reading.cerId}-${reading.period}`,
      period: reading.label,
      sharedEnergyKwh: round(reading.shared),
      totalIncentiveEuro: round(reading.incentive),
      status: reading.period === monthKey(periodStarts[periodStarts.length - 1]) ? "validato" : "approvato",
      reportData: JSON.stringify({
        productionKwh: round(reading.production),
        consumptionKwh: round(reading.consumption),
        selfConsumptionPct: round((reading.shared / reading.consumption) * 100, 1),
        podValidatedPct: 98.4,
        anomaliesClosed: 3,
      }),
      submittedAt: addDays(today, -7),
      cerId: reading.cerId,
    })),
  });

  const latestPeriod = monthKey(periodStarts[periodStarts.length - 1]);
  const latestBenefits = new Map<string, number>();
  const latestBalances = new Map<string, number>();
  const invoicePeriods = new Set(periodStarts.slice(-3).map((period) => monthKey(period)));
  const incentiveRows: Array<{ memberId: string; period: string; sharePct: number; monthlyEuro: number; yearToDateEuro: number }> = [];
  const invoiceRows: Array<{
    id: string;
    invoiceNumber: string;
    memberId: string;
    cerId: string;
    userId: string;
    period: string;
    amountEuro: number;
    status: string;
    dueDate: string;
    paidAt?: Date;
    description: string;
  }> = [];
  const paymentRows: Array<{
    invoiceId: string;
    userId: string;
    provider: string;
    providerPaymentId: string;
    amount: number;
    status: string;
    paymentMethod: string;
    receiptUrl: string;
    metadata: string;
    createdAt?: Date;
  }> = [];
  let invoiceCounter = 1;

  for (const cer of cerContexts) {
    const ytdByMember = new Map<string, number>();
    for (const periodStart of periodStarts) {
      const periodId = monthKey(periodStart);
      const cerMonth = monthlyCerTotals.get(`${cer.seed.id}:${periodId}`)!;
      const weightByMember = new Map<string, number>();
      let totalWeight = 0;

      for (const member of cer.memberContexts) {
        const totals = monthlyMemberTotals.get(`${member.id}:${periodId}`)!;
        const weight = shareWeight(member, totals);
        weightByMember.set(member.id, weight);
        totalWeight += weight;
      }

      for (const member of cer.memberContexts) {
        const share = (weightByMember.get(member.id) ?? 0) / totalWeight;
        const monthlyEuro = round(cerMonth.incentive * share);
        const yearToDate = round((ytdByMember.get(member.id) ?? 0) + monthlyEuro);
        ytdByMember.set(member.id, yearToDate);
        incentiveRows.push({
          memberId: member.id,
          period: cerMonth.label,
          sharePct: round(share * 100, 2),
          monthlyEuro,
          yearToDateEuro: yearToDate,
        });

        if (periodId === latestPeriod) {
          const latestTotals = monthlyMemberTotals.get(`${member.id}:${periodId}`)!;
          latestBenefits.set(member.id, monthlyEuro);
          latestBalances.set(member.id, round(latestTotals.production - latestTotals.consumption));
        }

        if (invoicePeriods.has(periodId)) {
          const serviceAdjustment = member.type === "consumatore" ? 12 : member.type === "prosumer" ? 18 : 24;
          const amountEuro = round(monthlyEuro + serviceAdjustment);
          const invoiceDate = addDays(endOfMonth(periodStart), 12);
          const isOldest = periodId === monthKey(periodStarts[periodStarts.length - 3]);
          const isMiddle = periodId === monthKey(periodStarts[periodStarts.length - 2]);
          const paidAt = isOldest || (isMiddle && member.type !== "consumatore") ? addDays(invoiceDate, -3) : undefined;
          const status = paidAt ? "pagata" : isMiddle && member.type === "consumatore" ? "scaduta" : "emessa";
          const invoiceId = `invoice-${invoiceCounter}`;

          invoiceRows.push({
            id: invoiceId,
            invoiceNumber: `EN-${periodStart.getUTCFullYear()}-${String(invoiceCounter).padStart(4, "0")}`,
            memberId: member.id,
            cerId: cer.seed.id,
            userId: member.userId,
            period: cerMonth.label,
            amountEuro,
            status,
            dueDate: isoDate(invoiceDate),
            paidAt,
            description: `Riparto incentivi, fee di gestione e servizi digitali · ${cerMonth.label}`,
          });

          if (paidAt) {
            paymentRows.push({
              invoiceId,
              userId: member.userId,
              provider: member.type === "consumatore" ? "pagopa" : "stripe",
              providerPaymentId: `pay_${member.slug}_${periodId}`,
              amount: amountEuro,
              status: "succeeded",
              paymentMethod: member.type === "consumatore" ? "pagopa_notice" : "sepa_debit",
              receiptUrl: `https://demo.energianostra.it/receipts/${invoiceId}`,
              metadata: JSON.stringify({ period: cerMonth.label, cer: cer.seed.name }),
              createdAt: paidAt,
            });
          }

          invoiceCounter += 1;
        }
      }
    }
  }

  await prisma.incentiveShare.createMany({ data: incentiveRows });
  await prisma.invoice.createMany({ data: invoiceRows });
  await prisma.payment.createMany({ data: paymentRows });

  for (const cer of cerContexts) {
    for (const member of cer.memberContexts) {
      await prisma.member.update({
        where: { id: member.id },
        data: {
          energyBalanceKwh: latestBalances.get(member.id) ?? 0,
          monthlyBenefitEuro: latestBenefits.get(member.id) ?? 0,
        },
      });
    }
  }

  console.log(`  ✓ ${incentiveRows.length} incentive shares created`);
  console.log(`  ✓ ${invoiceRows.length} invoices and ${paymentRows.length} payments created`);

  const grants = [
    {
      title: "Accumulo condominiale e sensoristica quartiere Cava",
      eligibleBudgetEuro: 198000,
      approvedEuro: 142000,
      disbursedEuro: 91000,
      progressPct: 64,
      nextMilestone: "Installazione batteria LFP e collaudo sistema EMS · giugno 2026",
      cerId: "cer-forli-centro",
    },
    {
      title: "Microgrid agricola e monitoraggio vallivo",
      eligibleBudgetEuro: 224000,
      approvedEuro: 165500,
      disbursedEuro: 104300,
      progressPct: 58,
      nextMilestone: "Sostituzione inverter di campo e onboarding nuovi POD agrituristici · luglio 2026",
      cerId: "cer-valle-bidente",
    },
  ];
  await prisma.pnrrGrant.createMany({ data: grants });

  const achievements = [
    { code: "primo_mese", name: "Primo Mese", description: "Primo mese attivo nella CER", icon: "🌟", category: "community", criteria: JSON.stringify({ type: "membership_months", threshold: 1 }), points: 10 },
    { code: "auto_consumatore", name: "Auto-Consumatore", description: "Autoconsumo superiore all'80%", icon: "⚡", category: "energy", criteria: JSON.stringify({ type: "self_consumption_pct", threshold: 80 }), points: 25 },
    { code: "ambasciatore", name: "Ambasciatore", description: "Ha portato 2 nuovi soci alla CER", icon: "🤝", category: "community", criteria: JSON.stringify({ type: "referrals", threshold: 2 }), points: 30 },
    { code: "campione_solare", name: "Campione Solare", description: "Miglior produttore del mese", icon: "☀️", category: "energy", criteria: JSON.stringify({ type: "top_producer", threshold: 1 }), points: 50 },
    { code: "risparmiatore", name: "Risparmiatore", description: "Riduzione consumi del 10%", icon: "💰", category: "energy", criteria: JSON.stringify({ type: "consumption_reduction_pct", threshold: 10 }), points: 20 },
    { code: "verde_costante", name: "Verde Costante", description: "3 mesi consecutivi sotto la media consumi", icon: "🌿", category: "consistency", criteria: JSON.stringify({ type: "consecutive_below_avg", threshold: 3 }), points: 35 },
    { code: "co2_fighter", name: "CO₂ Fighter", description: "Prima tonnellata di CO₂ evitata", icon: "🌍", category: "environment", criteria: JSON.stringify({ type: "co2_avoided_kg", threshold: 1000 }), points: 40 },
    { code: "partecipante_attivo", name: "Partecipante Attivo", description: "Ha partecipato ad almeno 4 votazioni", icon: "🗳️", category: "community", criteria: JSON.stringify({ type: "votes_cast", threshold: 4 }), points: 15 },
    { code: "fascia_solare", name: "Fascia Solare", description: "70% dei consumi in fascia solare", icon: "🔆", category: "energy", criteria: JSON.stringify({ type: "solar_window_pct", threshold: 70 }), points: 30 },
    { code: "carbon_hero", name: "Carbon Hero", description: "5 tonnellate di CO₂ evitate", icon: "🦸", category: "environment", criteria: JSON.stringify({ type: "co2_avoided_kg", threshold: 5000 }), points: 75 },
  ];
  await prisma.achievement.createMany({ data: achievements });

  const achievementRecords = await prisma.achievement.findMany();
  const achievementMap = new Map(achievementRecords.map((achievement) => [achievement.code, achievement.id]));
  const memberAchievementRows = cerContexts.flatMap((cer) =>
    cer.memberContexts.flatMap((member, index) => {
      const codes = ["primo_mese"];
      if (member.type !== "consumatore") codes.push("fascia_solare");
      if (member.type === "produttore") codes.push("campione_solare", "co2_fighter");
      if (index < 2) codes.push("ambasciatore");
      if (index % 2 === 0) codes.push("partecipante_attivo");
      return [...new Set(codes)].map((code) => ({
        memberId: member.id,
        memberName: member.name,
        achievementId: achievementMap.get(code)!,
        earnedAt: addDays(today, -(index + 5)),
        notified: index % 3 === 0,
      }));
    }),
  );
  await prisma.memberAchievement.createMany({ data: memberAchievementRows });

  const challenges = [
    {
      id: "challenge-solar-shift",
      title: "Sfida Fascia Solare di Maggio",
      description: "Spostare almeno il 12% dei consumi tra le 11:00 e le 15:00 rispetto al mese precedente.",
      type: "shift",
      targetValue: 12,
      unit: "%",
      startDate: isoDate(startOfMonth(today)),
      endDate: isoDate(addDays(endOfMonth(today), 0)),
      status: "active",
      cerId: "cer-forli-centro",
    },
    {
      id: "challenge-bidente-savings",
      title: "Weekend Vallata 100% condiviso",
      description: "Aumentare l'energia condivisa nei weekend turistici di almeno 85 kWh.",
      type: "production",
      targetValue: 85,
      unit: "kWh",
      startDate: isoDate(addDays(today, -25)),
      endDate: isoDate(addDays(today, 6)),
      status: "active",
      cerId: "cer-valle-bidente",
    },
    {
      id: "challenge-winter-reduction",
      title: "Riduzione prelievi serali inverno",
      description: "Ridurre del 7% i prelievi tra le 19:00 e le 22:00 rispetto al trimestre precedente.",
      type: "reduction",
      targetValue: 7,
      unit: "%",
      startDate: isoDate(addDays(today, -120)),
      endDate: isoDate(addDays(today, -30)),
      status: "completed",
      cerId: "cer-forli-centro",
    },
  ];
  await prisma.challenge.createMany({ data: challenges });

  await prisma.challengeParticipant.createMany({
    data: [
      ...cerContexts[0].memberContexts.slice(0, 6).map((member, index) => ({
        challengeId: "challenge-solar-shift",
        memberId: member.id,
        memberName: member.name,
        currentValue: round(5.5 + index * 1.4),
        completed: index >= 4,
      })),
      ...cerContexts[1].memberContexts.slice(0, 6).map((member, index) => ({
        challengeId: "challenge-bidente-savings",
        memberId: member.id,
        memberName: member.name,
        currentValue: round(34 + index * 9.8),
        completed: index >= 5,
      })),
      ...cerContexts[0].memberContexts.slice(2, 7).map((member, index) => ({
        challengeId: "challenge-winter-reduction",
        memberId: member.id,
        memberName: member.name,
        currentValue: round(4.2 + index * 1.1),
        completed: true,
      })),
    ],
  });

  const documentTemplates = [
    { name: "Atto costitutivo CER", category: "atto_costitutivo", content: "Atto costitutivo {{cerName}} con soci fondatori, cabina primaria e territorio di riferimento." },
    { name: "Statuto CER", category: "statuto", content: "Statuto aggiornato {{cerName}} con riparto incentivi, governance digitale e regolamento voti." },
    { name: "Verbale assemblea", category: "verbale", content: "Verbale con presenze, quorum, delibere e firme digitali per {{cerName}}." },
    { name: "Contratto adesione socio", category: "contratto_adesione", content: "Contratto di adesione con POD, dati anagrafici, quote e consensi privacy." },
  ];
  await prisma.documentTemplate.createMany({ data: documentTemplates });

  const templateMap = new Map((await prisma.documentTemplate.findMany()).map((template) => [template.category, template.id]));
  const generatedDocs = await Promise.all([
    prisma.generatedDocument.create({
      data: {
        templateId: templateMap.get("contratto_adesione")!,
        cerId: "cer-forli-centro",
        title: "Contratto adesione · Giulia Montanari",
        content: "Contratto adesione CER Forlì Centro per Giulia Montanari con POD IT001... e quota servizi annuale.",
        status: "signing",
      },
    }),
    prisma.generatedDocument.create({
      data: {
        templateId: templateMap.get("verbale")!,
        cerId: "cer-valle-bidente",
        title: "Verbale assemblea investimenti febbraio 2026",
        content: "Verbale assemblea CER Valle del Bidente con delibera su inverter, ampliamento POD e fondo solidarietà.",
        status: "signed",
      },
    }),
  ]);

  await prisma.signatureRequest.createMany({
    data: [
      {
        documentId: generatedDocs[0].id,
        signerName: "Giulia Montanari",
        signerEmail: "giulia-montanari@energianostra.it",
        status: "sent",
        otpCode: "483921",
        otpExpiresAt: addDays(today, 1),
      },
      {
        documentId: generatedDocs[0].id,
        signerName: "Alessandra Fabbri",
        signerEmail: "alessandra-fabbri@energianostra.it",
        status: "pending",
        otpCode: "774210",
        otpExpiresAt: addDays(today, 1),
      },
      {
        documentId: generatedDocs[1].id,
        signerName: "Stefano Valentini",
        signerEmail: "stefano-valentini@energianostra.it",
        status: "signed",
        signedAt: addDays(today, -88),
      },
    ],
  });

  await prisma.countryConfig.createMany({
    data: [
      { countryCode: "IT", countryName: "Italia", incentiveFormula: JSON.stringify({ type: "GSE", rateEuroPerMwh: 118, selfConsumptionBonus: 12 }), reportingFormat: "GSE", gridEmissionFactor: 256, regulatoryReference: "D.Lgs. 199/2021, TIAD ARERA, Regole Operative GSE 2025" },
      { countryCode: "ES", countryName: "España", incentiveFormula: JSON.stringify({ type: "CNMC", rateEuroPerMwh: 58, selfConsumptionBonus: 7 }), reportingFormat: "CNMC", gridEmissionFactor: 214, regulatoryReference: "RD 244/2019" },
      { countryCode: "FR", countryName: "France", incentiveFormula: JSON.stringify({ type: "ENEDIS", rateEuroPerMwh: 64, selfConsumptionBonus: 8 }), reportingFormat: "ENEDIS", gridEmissionFactor: 58, regulatoryReference: "Code de l'énergie" },
    ],
  });

  const carbonCredits = await Promise.all([
    prisma.carbonCredit.create({
      data: {
        cerId: "cer-forli-centro",
        cerName: "CER Forlì Centro",
        vintage: "2026",
        co2Tonnes: round(Array.from(monthlyCerTotals.values()).filter((row) => row.cerId === "cer-forli-centro").reduce((sum, row) => sum + row.co2, 0) / 1000, 2),
        methodology: "ISO-14064",
        verificationStatus: "verified",
        registryId: "IT-REC-FC-2026-014",
        pricePerTonne: 47,
        status: "available",
      },
    }),
    prisma.carbonCredit.create({
      data: {
        cerId: "cer-valle-bidente",
        cerName: "CER Valle del Bidente",
        vintage: "2026",
        co2Tonnes: round(Array.from(monthlyCerTotals.values()).filter((row) => row.cerId === "cer-valle-bidente").reduce((sum, row) => sum + row.co2, 0) / 1000, 2),
        methodology: "Gold Standard community microgrid",
        verificationStatus: "verified",
        registryId: "IT-REC-FC-2026-021",
        pricePerTonne: 45,
        status: "reserved",
      },
    }),
  ]);

  await prisma.carbonTransaction.createMany({
    data: [
      { creditId: carbonCredits[0].id, buyerName: "Fondazione Cassa dei Risparmi di Forlì", buyerType: "business", tonnes: 8.5, pricePerTonne: 47, totalEuro: 399.5, status: "completed", certificateId: "CC-2026-031", completedAt: addDays(today, -18) },
      { creditId: carbonCredits[1].id, buyerName: "Unione dei Comuni della Romagna Forlivese", buyerType: "municipality", tonnes: 6.2, pricePerTonne: 45, totalEuro: 279, status: "pending" },
    ],
  });

  const weatherRows = [] as Array<{ latitude: number; longitude: number; date: string; tempC: number; cloudCover: number; irradiance: number; source: string }>;
  const forecastRows = [] as Array<{
    cerId: string;
    forecastType: string;
    periodStart: string;
    periodEnd: string;
    forecastedKwh: number;
    confidenceLow: number;
    confidenceHigh: number;
    actualKwh?: number;
    accuracy?: number;
    model: string;
    weatherData: string;
  }>;

  for (const cer of cerContexts) {
    for (let offset = 1; offset <= 7; offset += 1) {
      const day = addDays(today, offset);
      const tempC = round(14.5 + offset * 0.7 + (cer.seed.latitude % 1) * 4, 1);
      const cloudCover = round(28 + ((offset + cer.seed.slug.length) % 5) * 9, 1);
      const irradiance = round(4.6 + offset * 0.28 - cloudCover * 0.02, 2);
      weatherRows.push({
        latitude: cer.seed.latitude,
        longitude: cer.seed.longitude,
        date: isoDate(day),
        tempC,
        cloudCover,
        irradiance,
        source: "open-meteo",
      });
    }

    const latestMonth = Array.from(monthlyCerTotals.values()).find((row) => row.cerId === cer.seed.id && row.period === latestPeriod)!;
    const forecastBase = {
      cerId: cer.seed.id,
      periodStart: isoDate(addDays(today, 1)),
      periodEnd: isoDate(addDays(today, 30)),
      model: "linear_seasonal_v2",
    };

    forecastRows.push(
      {
        ...forecastBase,
        forecastType: "production",
        forecastedKwh: round(latestMonth.production * 1.07),
        confidenceLow: round(latestMonth.production * 0.98),
        confidenceHigh: round(latestMonth.production * 1.14),
        actualKwh: latestMonth.production,
        accuracy: 94.6,
        weatherData: JSON.stringify({ trend: "più soleggiato", avgTempC: 19.1, avgIrradiance: 6.2 }),
      },
      {
        ...forecastBase,
        forecastType: "consumption",
        forecastedKwh: round(latestMonth.consumption * 0.94),
        confidenceLow: round(latestMonth.consumption * 0.9),
        confidenceHigh: round(latestMonth.consumption * 1.02),
        actualKwh: latestMonth.consumption,
        accuracy: 92.8,
        weatherData: JSON.stringify({ occupancy: "stabile", holidayImpact: false, avgTempC: 19.1 }),
      },
      {
        ...forecastBase,
        forecastType: "shared_energy",
        forecastedKwh: round(latestMonth.shared * 1.08),
        confidenceLow: round(latestMonth.shared * 0.97),
        confidenceHigh: round(latestMonth.shared * 1.13),
        actualKwh: latestMonth.shared,
        accuracy: 93.2,
        weatherData: JSON.stringify({ optimizationMode: "midday_shift", batteryDispatch: true }),
      },
    );
  }

  await prisma.weatherCache.createMany({ data: weatherRows });
  await prisma.energyForecast.createMany({ data: forecastRows });

  const smartDevices = await Promise.all([
    prisma.smartDevice.create({ data: { cerId: "cer-forli-centro", name: "Inverter condominiale Viale Roma", type: "solar_inverter", protocol: "sunspec_modbus", manufacturer: "Fronius", model: "Tauro 50-3-D", serialNumber: "FRL-INV-001", firmwareVersion: "3.14.7", status: "online", lastHeartbeat: addDays(today, 0), configuration: JSON.stringify({ maxPowerKw: 50, strings: 6 }), locationDesc: "Locale tecnico condominio capofila" } }),
    prisma.smartDevice.create({ data: { cerId: "cer-forli-centro", name: "Battery hub Centro Storico", type: "battery", protocol: "mqtt", manufacturer: "Huawei", model: "LUNA2000-215", serialNumber: "FRL-BAT-002", firmwareVersion: "2.9.1", status: "discharging", lastHeartbeat: addDays(today, 0), configuration: JSON.stringify({ capacityKwh: 120, maxDischargeKw: 45 }), locationDesc: "Cabina secondaria San Biagio" } }),
    prisma.smartDevice.create({ data: { cerId: "cer-forli-centro", name: "Smart meter Piazza Saffi", type: "smart_meter", protocol: "api", manufacturer: "Carlo Gavazzi", model: "EM340", serialNumber: "FRL-MTR-003", firmwareVersion: "1.5.2", status: "online", lastHeartbeat: addDays(today, 0), configuration: JSON.stringify({ pods: 9, refreshMinutes: 15 }), locationDesc: "Quadro misure centro storico" } }),
    prisma.smartDevice.create({ data: { cerId: "cer-valle-bidente", name: "Inverter campo Cusercoli", type: "solar_inverter", protocol: "sunspec_modbus", manufacturer: "SMA", model: "Sunny Tripower CORE2", serialNumber: "BID-INV-001", firmwareVersion: "4.2.0", status: "maintenance", lastHeartbeat: addDays(today, -1), configuration: JSON.stringify({ maxPowerKw: 60, strings: 8 }), locationDesc: "Tettoia azienda agricola Rossi" } }),
    prisma.smartDevice.create({ data: { cerId: "cer-valle-bidente", name: "Battery cluster Meldola", type: "battery", protocol: "mqtt", manufacturer: "BYD", model: "Battery-Box Premium LVL", serialNumber: "BID-BAT-002", firmwareVersion: "5.0.3", status: "online", lastHeartbeat: addDays(today, 0), configuration: JSON.stringify({ capacityKwh: 150, maxChargeKw: 55 }), locationDesc: "Hub logistico comunitario" } }),
    prisma.smartDevice.create({ data: { cerId: "cer-valle-bidente", name: "Meter vallata Santa Sofia", type: "smart_meter", protocol: "api", manufacturer: "ABB", model: "B23", serialNumber: "BID-MTR-003", firmwareVersion: "2.1.0", status: "online", lastHeartbeat: addDays(today, 0), configuration: JSON.stringify({ pods: 9, refreshMinutes: 15 }), locationDesc: "Cabina primaria Bidente" } }),
  ]);

  const telemetryRows = [] as Array<{ deviceId: string; metric: string; value: number; unit: string; timestamp: Date }>;
  const commandRows = [] as Array<{ deviceId: string; command: string; parameters: string; status: string; sentAt: Date; completedAt?: Date; result?: string }>;

  smartDevices.forEach((device, deviceIndex) => {
    for (let step = 0; step < 8; step += 1) {
      const timestamp = addDays(today, -2);
      timestamp.setUTCHours(6 + step * 3, 0, 0, 0);
      if (device.type === "solar_inverter") {
        telemetryRows.push(
          { deviceId: device.id, metric: "power_w", value: round(18500 + deviceIndex * 1400 + step * 950), unit: "W", timestamp: new Date(timestamp) },
          { deviceId: device.id, metric: "energy_kwh", value: round(128 + deviceIndex * 11 + step * 7.4), unit: "kWh", timestamp: new Date(timestamp) },
          { deviceId: device.id, metric: "temperature_c", value: round(31 + step * 0.8 + deviceIndex * 0.4, 1), unit: "°C", timestamp: new Date(timestamp) },
        );
      } else if (device.type === "battery") {
        telemetryRows.push(
          { deviceId: device.id, metric: "soc_pct", value: round(58 + step * 3.2 - deviceIndex, 1), unit: "%", timestamp: new Date(timestamp) },
          { deviceId: device.id, metric: "power_w", value: round(6200 + step * 410 + deviceIndex * 230), unit: "W", timestamp: new Date(timestamp) },
          { deviceId: device.id, metric: "temperature_c", value: round(25.5 + step * 0.35, 1), unit: "°C", timestamp: new Date(timestamp) },
        );
      } else {
        telemetryRows.push(
          { deviceId: device.id, metric: "power_w", value: round(8400 + step * 520 + deviceIndex * 150), unit: "W", timestamp: new Date(timestamp) },
          { deviceId: device.id, metric: "voltage_v", value: round(229 + ((step + deviceIndex) % 3), 1), unit: "V", timestamp: new Date(timestamp) },
          { deviceId: device.id, metric: "current_a", value: round(18.4 + step * 0.7, 1), unit: "A", timestamp: new Date(timestamp) },
        );
      }
    }

    commandRows.push({
      deviceId: device.id,
      command: device.type === "battery" ? "set_discharge" : "reboot",
      parameters: device.type === "battery" ? JSON.stringify({ targetKw: 18, window: "18:00-21:00" }) : JSON.stringify({ reason: "weekly_maintenance" }),
      status: device.type === "battery" ? "completed" : "acknowledged",
      sentAt: addDays(today, -3),
      completedAt: device.type === "battery" ? addDays(today, -3) : undefined,
      result: JSON.stringify({ ok: true, operator: "energy-ops" }),
    });
  });

  await prisma.deviceTelemetry.createMany({ data: telemetryRows });
  await prisma.deviceCommand.createMany({ data: commandRows });

  const postRecords = await Promise.all([
    prisma.communityPost.create({ data: { cerId: "cer-forli-centro", authorId: cerContexts[0].memberContexts[0].userId, authorName: cerContexts[0].memberContexts[0].name, type: "milestone", title: "Superati i 100 MWh condivisi nel semestre", content: "Grazie al nuovo profilo di accumulo e agli spostamenti di carico a pranzo abbiamo tagliato i prelievi serali del 9%.", metadata: JSON.stringify({ sharedMWh: 101.8, savingsEuro: 18940 }), likesCount: 7, isPinned: true } }),
    prisma.communityPost.create({ data: { cerId: "cer-forli-centro", authorId: cerContexts[0].memberContexts[4].userId, authorName: cerContexts[0].memberContexts[4].name, type: "discussion", title: "Esperienze con fascia solare e lavatrici condominiali", content: "Chi ha già provato il nuovo calendario di utilizzo? Da noi ha funzionato molto bene nel weekend.", metadata: JSON.stringify({ topic: "load_shift" }), likesCount: 4 } }),
    prisma.communityPost.create({ data: { cerId: "cer-valle-bidente", authorId: cerContexts[1].memberContexts[0].userId, authorName: cerContexts[1].memberContexts[0].name, type: "announcement", title: "Visita tecnica al campo FV di Cusercoli", content: "Giovedì alle 18:30 sopralluogo aperto ai soci per vedere il nuovo inverter e il monitoraggio da remoto.", metadata: JSON.stringify({ location: "Cusercoli" }), likesCount: 6, isPinned: true } }),
    prisma.communityPost.create({ data: { cerId: "cer-valle-bidente", authorId: cerContexts[1].memberContexts[5].userId, authorName: cerContexts[1].memberContexts[5].name, type: "achievement", title: "Weekend turistici alimentati al 78% da energia condivisa", content: "Nel B&B abbiamo spostato lavanderia e ricarica bici elettriche in fascia solare: il risultato si vede subito.", metadata: JSON.stringify({ sharedWeekendPct: 78 }), likesCount: 5 } }),
  ]);

  await prisma.postReaction.createMany({
    data: [
      { postId: postRecords[0].id, userId: cerContexts[0].memberContexts[1].userId, emoji: "⚡" },
      { postId: postRecords[0].id, userId: cerContexts[0].memberContexts[2].userId, emoji: "🎉" },
      { postId: postRecords[1].id, userId: cerContexts[0].memberContexts[0].userId, emoji: "��" },
      { postId: postRecords[1].id, userId: cerContexts[0].memberContexts[7].userId, emoji: "🌱" },
      { postId: postRecords[2].id, userId: cerContexts[1].memberContexts[2].userId, emoji: "⚡" },
      { postId: postRecords[2].id, userId: cerContexts[1].memberContexts[3].userId, emoji: "🎉" },
      { postId: postRecords[3].id, userId: cerContexts[1].memberContexts[0].userId, emoji: "❤️" },
      { postId: postRecords[3].id, userId: cerContexts[1].memberContexts[6].userId, emoji: "🌱" },
    ],
  });

  await prisma.postComment.createMany({
    data: [
      { postId: postRecords[0].id, authorId: cerContexts[0].memberContexts[5].userId, authorName: cerContexts[0].memberContexts[5].name, content: "Se approviamo la batteria da 120 kWh possiamo consolidare il risultato già a giugno." },
      { postId: postRecords[1].id, authorId: cerContexts[0].memberContexts[3].userId, authorName: cerContexts[0].memberContexts[3].name, content: "Noi abbiamo spostato la lavastoviglie alle 13:30: incide davvero sul conto energia." },
      { postId: postRecords[2].id, authorId: cerContexts[1].memberContexts[7].userId, authorName: cerContexts[1].memberContexts[7].name, content: "Porto anche i dati della cantina così confrontiamo la curva di generazione." },
      { postId: postRecords[3].id, authorId: cerContexts[1].memberContexts[4].userId, authorName: cerContexts[1].memberContexts[4].name, content: "Possiamo usare questo caso nel pitch con i sindaci della valle." },
    ],
  });

  await prisma.notification.createMany({
    data: [
      ...cerContexts.flatMap((cer) => [
        {
          userId: cer.adminUserId,
          type: "vote_opened",
          title: `${cer.seed.name}: nuova votazione governance`,
          body: "È disponibile una consultazione su investimenti e regole operative del prossimo trimestre.",
          actionUrl: `/cers/${cer.seed.id}/votes`,
          read: false,
          channel: "in_app",
          cerId: cer.seed.id,
        },
        {
          userId: cer.adminUserId,
          type: "document_signed",
          title: "Contratto pronto per firma digitale",
          body: "Un contratto di adesione è pronto per la controfirma del referente CER.",
          actionUrl: `/cers/${cer.seed.id}/documents`,
          read: false,
          channel: "email",
          cerId: cer.seed.id,
        },
      ]),
      ...cerContexts.flatMap((cer) =>
        cer.memberContexts.slice(0, 4).map((member, index) => ({
          userId: member.userId,
          type: index % 2 === 0 ? "achievement_earned" : "invoice_due",
          title: index % 2 === 0 ? "Nuovo badge sbloccato" : "Prospetto economico disponibile",
          body: index % 2 === 0
            ? `Complimenti ${member.name.split(" ")[0]}: hai ottenuto il badge ${member.type === "consumatore" ? "Partecipante Attivo" : "Fascia Solare"}.`
            : `È disponibile il prospetto economico di ${monthLabel(periodStarts[periodStarts.length - 1])}.`,
          actionUrl: index % 2 === 0 ? `/community/achievements` : `/billing/invoices`,
          read: index === 3,
          channel: index % 3 === 0 ? "push" : "in_app",
          cerId: cer.seed.id,
        })),
      ),
      {
        userId: superAdmin.id,
        type: "anomaly_detected",
        title: "Allineamento misure CER completato",
        body: "I due tenant demo hanno dati coerenti per 6 mesi di storico giornaliero e reportistica GSE.",
        actionUrl: "/admin/health",
        read: false,
        channel: "in_app",
      },
    ],
  });

  await prisma.gseSubmission.createMany({
    data: [
      { cerId: "cer-forli-centro", reportId: `gse-cer-forli-centro-${latestPeriod}`, period: monthLabel(periodStarts[periodStarts.length - 1]), type: "monthly_report", status: "submitted", submissionRef: "GSE-FC-2026-0514", receiptUrl: "s3://energia-nostra/gse/forli-centro/receipt-0514.pdf", attempts: 1, lastAttemptAt: addDays(today, -4), confirmedAt: addDays(today, -3) },
      { cerId: "cer-valle-bidente", reportId: `gse-cer-valle-bidente-${latestPeriod}`, period: monthLabel(periodStarts[periodStarts.length - 1]), type: "monthly_report", status: "confirmed", submissionRef: "GSE-BID-2026-0516", receiptUrl: "s3://energia-nostra/gse/valle-bidente/receipt-0516.pdf", attempts: 1, lastAttemptAt: addDays(today, -2), confirmedAt: addDays(today, -1) },
    ],
  });

  await prisma.gseReconciliation.createMany({
    data: [
      { cerId: "cer-forli-centro", period: monthLabel(periodStarts[periodStarts.length - 1]), platformIncentive: 3268, gseIncentive: 3239, discrepancyEuro: 29, discrepancyPct: 0.89, status: "resolved", resolution: "Arrotondamento misure su due POD commerciali chiuso con nota di credito GSE.", resolvedAt: addDays(today, -1) },
      { cerId: "cer-valle-bidente", period: monthLabel(periodStarts[periodStarts.length - 1]), platformIncentive: 3486, gseIncentive: 3481, discrepancyEuro: 5, discrepancyPct: 0.14, status: "matched" },
    ],
  });

  await prisma.bankTransaction.createMany({
    data: [
      { cerId: "cer-forli-centro", externalId: "TRX-FRL-1001", date: addDays(today, -9), description: "Bonifico GSE incentivo aprile", amountEuro: 3239, direction: "credit", counterparty: "Gestore Servizi Energetici", bankName: "BCC Ravennate Forlivese", matchedInvoiceId: invoiceRows[0]?.id, matchConfidence: 0.94, status: "confirmed" },
      { cerId: "cer-forli-centro", externalId: "TRX-FRL-1002", date: addDays(today, -6), description: "Canone manutenzione inverter condominiale", amountEuro: 480, direction: "debit", counterparty: "Enertech Service", bankName: "BCC Ravennate Forlivese", status: "matched" },
      { cerId: "cer-valle-bidente", externalId: "TRX-BID-2101", date: addDays(today, -8), description: "Pagamento fornitura sensoristica valliva", amountEuro: 1260, direction: "debit", counterparty: "SmartGrid Romagna", bankName: "Crédit Agricole Italia", status: "matched" },
      { cerId: "cer-valle-bidente", externalId: "TRX-BID-2102", date: addDays(today, -5), description: "Bonifico GSE incentivo aprile", amountEuro: 3481, direction: "credit", counterparty: "Gestore Servizi Energetici", bankName: "Crédit Agricole Italia", status: "confirmed" },
    ],
  });

  await prisma.taxDocument.createMany({
    data: [
      { cerId: "cer-forli-centro", type: "bilancio", fiscalYear: today.getUTCFullYear(), totalIncome: 18940, totalWithholding: 0, netAmount: 18940, documentData: JSON.stringify({ status: "preconsuntivo", members: 9 }), pdfUrl: "s3://energia-nostra/tax/forli-centro/bilancio-2026.pdf", status: "generated", generatedAt: addDays(today, -6) },
      { cerId: "cer-valle-bidente", type: "bilancio", fiscalYear: today.getUTCFullYear(), totalIncome: 20110, totalWithholding: 0, netAmount: 20110, documentData: JSON.stringify({ status: "preconsuntivo", members: 9 }), pdfUrl: "s3://energia-nostra/tax/valle-bidente/bilancio-2026.pdf", status: "generated", generatedAt: addDays(today, -6) },
    ],
  });

  console.log("\n✅ energia-nostra seed completed successfully!");
  console.log(`   - 2 CER demo: ${cerSeeds.map((cer) => cer.name).join(", ")}`);
  console.log(`   - ${cerSeeds.reduce((sum, cer) => sum + cer.members.length, 0)} members with 6 months of daily readings`);
  console.log(`   - ${documents.length} documents, ${voteSeeds.length} votes, ${announcements.length} announcements`);
  console.log(`   - ${smartDevices.length} smart devices, ${telemetryRows.length} telemetry points`);
  console.log(`   - ${invoiceRows.length} invoices, ${paymentRows.length} payments, ${carbonCredits.length} carbon credit portfolios`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
