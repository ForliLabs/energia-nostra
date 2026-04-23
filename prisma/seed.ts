import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "node:path";

const dbPath = path.join(import.meta.dirname || __dirname, "..", "dev.db");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "energia-nostra-salt-2025");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type MemberType = "produttore" | "consumatore" | "prosumer";

const round = (value: number, decimals = 2) => Number(value.toFixed(decimals));

const calculateMemberBenefit = (type: MemberType, balance: number) => {
  const base = type === "produttore" ? 96 : type === "prosumer" ? 82 : 44;
  const variable = balance >= 0 ? balance * 0.07 : Math.abs(balance) * 0.025;
  return round(base + variable);
};

const incentiveRateEuroPerMwh = 110;

const memberSeeds: Array<{ name: string; type: MemberType; energyBalanceKwh: number; municipality: string }> = [
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

const energyMonths = [
  { label: "Nov 2024", productionKwh: 22400, consumptionKwh: 28900, sharedEnergyKwh: 18750 },
  { label: "Dic 2024", productionKwh: 19100, consumptionKwh: 27800, sharedEnergyKwh: 16200 },
  { label: "Gen 2025", productionKwh: 21500, consumptionKwh: 29400, sharedEnergyKwh: 17300 },
  { label: "Feb 2025", productionKwh: 24600, consumptionKwh: 28700, sharedEnergyKwh: 19600 },
  { label: "Mar 2025", productionKwh: 31200, consumptionKwh: 27500, sharedEnergyKwh: 22900 },
  { label: "Apr 2025", productionKwh: 35800, consumptionKwh: 26900, sharedEnergyKwh: 24700 },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data using Prisma delete operations (order matters for FK constraints)
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

  // 1. Create CER
  const cer = await prisma.cer.create({
    data: {
      id: "cer-bertinoro",
      name: "Energia Insieme Bertinoro",
      territory: "Collina e pianura forlivese",
      municipality: "Bertinoro",
      province: "Forlì-Cesena",
      foundedYear: 2024,
      referenceNote: "Scenario CER calibrato su profili energetici di condomini, piccole imprese e aziende agricole tra Bertinoro, Forlimpopoli e la cintura di Forlì.",
      cabinaPrimaria: "Bertinoro-Forlimpopoli",
    },
  });

  // 2. Create Users
  const hash = await hashPassword("demo2025");
  const users = await Promise.all([
    prisma.user.create({ data: { id: "user-admin-1", email: "admin@energianostra.it", name: "Admin CER Bertinoro", passwordHash: hash, role: "admin", cerId: cer.id } }),
    prisma.user.create({ data: { id: "user-member-1", email: "membro@energianostra.it", name: "Mario Rossi", passwordHash: hash, role: "member", cerId: cer.id } }),
    prisma.user.create({ data: { id: "user-auditor-1", email: "auditor@energianostra.it", name: "Revisore CER", passwordHash: hash, role: "auditor", cerId: cer.id } }),
    prisma.user.create({ data: { id: "user-super-1", email: "super@energianostra.it", name: "Super Admin Piattaforma", passwordHash: hash, role: "superadmin" } }),
  ]);
  console.log(`  ✓ ${users.length} users created`);

  // 3. Create Members
  const members = [];
  for (let i = 0; i < memberSeeds.length; i++) {
    const seed = memberSeeds[i];
    const member = await prisma.member.create({
      data: {
        id: `member-${i + 1}`,
        name: seed.name,
        type: seed.type,
        podCode: `IT001E${String(990000001 + i).padStart(9, "0")}`,
        energyBalanceKwh: seed.energyBalanceKwh,
        monthlyBenefitEuro: calculateMemberBenefit(seed.type, seed.energyBalanceKwh),
        municipality: seed.municipality,
        joinedAt: `2024-${String((i % 9) + 1).padStart(2, "0")}-15`,
        cerId: cer.id,
      },
    });
    members.push(member);
  }
  console.log(`  ✓ ${members.length} members created`);

  // 4. Create Energy Readings
  for (const month of energyMonths) {
    const selfConsumptionPct = round((month.sharedEnergyKwh / month.consumptionKwh) * 100, 1);
    await prisma.energyReading.create({
      data: {
        id: month.label.toLowerCase().replace(/\s+/g, "-"),
        label: month.label,
        productionKwh: month.productionKwh,
        consumptionKwh: month.consumptionKwh,
        sharedEnergyKwh: month.sharedEnergyKwh,
        selfConsumptionPct,
        savingsEuro: round(month.sharedEnergyKwh * 0.182),
        gseIncentiveEuro: round((month.sharedEnergyKwh / 1000) * incentiveRateEuroPerMwh),
        co2AvoidedKg: round(month.sharedEnergyKwh * 0.37),
        cerId: cer.id,
      },
    });
  }
  console.log(`  ✓ ${energyMonths.length} energy readings created`);

  // 5. Create Documents
  const docs = [
    { id: "statuto-cer", title: "Statuto CER Energia Insieme Bertinoro", category: "statuto", status: "approvato", owner: "Consiglio direttivo" },
    { id: "regolamento-riparto", title: "Regolamento riparto incentivi e condivisione energia", category: "regolamento", status: "in_revisione", owner: "Comitato tecnico" },
    { id: "verbale-aprile", title: "Verbale assemblea straordinaria del 24 aprile 2025", category: "verbale", status: "da_firmare", owner: "Segreteria CER" },
    { id: "report-gse", title: "Report GSE primo quadrimestre 2025", category: "report", status: "approvato", owner: "Energy manager" },
  ];
  for (const doc of docs) {
    await prisma.document.create({ data: { ...doc, cerId: cer.id } });
  }
  console.log(`  ✓ ${docs.length} documents created`);

  // 6. Create Votes
  const votes = [
    { id: "vote-q2", title: "Approvazione piano di distribuzione incentivi Q2 2025", description: "Votazione sull'approvazione del piano di ripartizione incentivi GSE per il secondo trimestre 2025.", options: JSON.stringify(["Approvo", "Non approvo", "Astenuto"]), voteType: "open", quorum: "50% + 1 dei soci", scheduledAt: "2025-05-20T20:45:00", closesAt: "2025-05-21T23:59:00", status: "aperta" },
    { id: "vote-pnrr", title: "Scelta fornitore accumulo condiviso da 80 kWh", description: "Selezione del fornitore per il sistema di accumulo energetico condiviso.", options: JSON.stringify(["Sonnen", "Tesla Powerwall", "Huawei LUNA"]), voteType: "secret", quorum: "2/3 dei membri votanti", scheduledAt: "2025-06-03T18:30:00", closesAt: "2025-06-05T23:59:00", status: "programmata" },
    { id: "vote-expansion", title: "Ingresso nuovi prosumer area Santa Maria Nuova", description: "Approvazione dell'ingresso di 6 nuovi prosumer.", options: JSON.stringify(["Favorevole", "Contrario", "Astenuto"]), voteType: "open", quorum: "Maggioranza semplice", scheduledAt: "2025-06-12T21:00:00", closesAt: "2025-06-14T23:59:00", status: "programmata" },
    { id: "vote-statuto", title: "Approvazione modifiche statuto CER", description: "Ratifica delle modifiche all'articolo 12 dello statuto.", options: JSON.stringify(["Approvo", "Non approvo", "Astenuto"]), voteType: "open", quorum: "2/3 dei soci", scheduledAt: "2025-04-15T20:00:00", closesAt: "2025-04-17T23:59:00", status: "chiusa" },
  ];
  for (const vote of votes) {
    await prisma.vote.create({ data: { ...vote, cerId: cer.id } });
  }

  // Add ballots for closed vote — create voter users first
  for (let i = 0; i < 20; i++) {
    const voterId = `user-${i}`;
    // Reuse existing users if they match, create new ones if needed
    const exists = await prisma.user.findUnique({ where: { id: voterId } });
    if (!exists) {
      await prisma.user.create({
        data: { id: voterId, email: `voter${i}@energianostra.it`, name: `Membro ${i + 1}`, passwordHash: hash, role: "member", cerId: cer.id },
      });
    }
    await prisma.ballotCast.create({
      data: { voteId: "vote-statuto", userId: voterId, choice: i < 15 ? "Approvo" : i < 18 ? "Non approvo" : "Astenuto" },
    });
  }
  // Add ballots for open vote
  for (let i = 0; i < 12; i++) {
    await prisma.ballotCast.create({
      data: { voteId: "vote-q2", userId: `user-${i}`, choice: i < 9 ? "Approvo" : i < 11 ? "Non approvo" : "Astenuto" },
    });
  }
  console.log(`  ✓ ${votes.length} votes + 32 ballots created`);

  // 7. Create Announcements
  const anns = [
    { id: "ann-1", title: "Apertura nuove adesioni per Santa Maria Nuova", message: "Disponibili 6 quote per famiglie e piccole attività con tetto condiviso e accesso al contributo PNRR.", publishedAt: "09 mag 2025" },
    { id: "ann-2", title: "Webinar su contabilizzazione e bolletta CER", message: "Mercoledì alle 18:00 analizziamo il consuntivo di aprile e il profilo orario 10:00-15:00 per massimizzare l'autoconsumo.", publishedAt: "07 mag 2025" },
    { id: "ann-3", title: "Monitoraggio POD completato al 100%", message: "Allineati tutti i 25 POD su portale GSE, nessuna anomalia aperta sulle misure di rete.", publishedAt: "06 mag 2025" },
  ];
  for (const ann of anns) {
    await prisma.announcement.create({ data: { ...ann, cerId: cer.id } });
  }

  // 8. Create Incentive Shares
  const weightForMember = (type: MemberType, balance: number) => {
    const typeWeight = type === "produttore" ? 1.3 : type === "prosumer" ? 1.1 : 0.85;
    const balanceWeight = balance >= 0 ? 1 + balance / 2200 : 0.92 + Math.abs(balance) / 5000;
    return typeWeight * balanceWeight;
  };
  const totalWeight = members.reduce((sum, m) => sum + weightForMember(m.type as MemberType, m.energyBalanceKwh), 0);
  const latestEnergy = energyMonths[energyMonths.length - 1];
  const latestIncentive = round((latestEnergy.sharedEnergyKwh / 1000) * incentiveRateEuroPerMwh);
  const totalIncentive = energyMonths.reduce((s, m) => s + round((m.sharedEnergyKwh / 1000) * incentiveRateEuroPerMwh), 0);

  for (const member of members) {
    const share = weightForMember(member.type as MemberType, member.energyBalanceKwh) / totalWeight;
    await prisma.incentiveShare.create({
      data: {
        memberId: member.id,
        period: "Apr 2025",
        sharePct: round(share * 100),
        monthlyEuro: round(latestIncentive * share),
        yearToDateEuro: round(totalIncentive * share),
      },
    });
  }
  console.log(`  ✓ ${members.length} incentive shares created`);

  // 9. Create Invoices
  const periods = ["Nov 2024", "Dic 2024", "Gen 2025", "Feb 2025", "Mar 2025", "Apr 2025"];
  let invoiceCounter = 1;
  for (const period of periods) {
    for (const member of members.slice(0, 10)) {
      const incentive = round(latestIncentive * (weightForMember(member.type as MemberType, member.energyBalanceKwh) / totalWeight));
      const savings = member.monthlyBenefitEuro;
      const fee = 15;
      const net = round(incentive + savings - fee);
      const periodIdx = periods.indexOf(period);
      const isPaid = periodIdx < 4;

      await prisma.invoice.create({
        data: {
          id: `inv-${invoiceCounter}`,
          invoiceNumber: `EN-2025-${String(invoiceCounter).padStart(4, "0")}`,
          memberId: member.id,
          cerId: cer.id,
          period,
          amountEuro: net,
          status: isPaid ? "pagata" : "emessa",
          dueDate: `2025-${String(periodIdx + 2).padStart(2, "0")}-28`,
          paidAt: isPaid ? new Date(`2025-${String(periodIdx + 2).padStart(2, "0")}-15`) : null,
          description: `Prospetto economico CER - ${period}`,
        },
      });
      invoiceCounter++;
    }
  }
  console.log(`  ✓ ${invoiceCounter - 1} invoices created`);

  // 10. Create PNRR Grant
  await prisma.pnrrGrant.create({
    data: {
      title: "Installazione impianti FV e accumulo CER Bertinoro",
      eligibleBudgetEuro: 186000,
      approvedEuro: 132000,
      disbursedEuro: 79200,
      progressPct: 60,
      nextMilestone: "Collaudo inverter e monitoraggio condiviso · giugno 2025",
      cerId: cer.id,
    },
  });

  // 11. Seed Achievements (Feature 7)
  const achievements = [
    { code: "primo_mese", name: "Primo Mese", description: "Primo mese attivo nella CER", icon: "🌟", category: "community", criteria: JSON.stringify({ type: "membership_months", threshold: 1 }), points: 10 },
    { code: "auto_consumatore", name: "Auto-Consumatore", description: "Autoconsumo superiore all'80%", icon: "⚡", category: "energy", criteria: JSON.stringify({ type: "self_consumption_pct", threshold: 80 }), points: 25 },
    { code: "ambasciatore", name: "Ambasciatore", description: "Ha invitato 3 nuovi membri", icon: "🤝", category: "community", criteria: JSON.stringify({ type: "referrals", threshold: 3 }), points: 30 },
    { code: "campione_solare", name: "Campione Solare", description: "Miglior produttore del mese", icon: "☀️", category: "energy", criteria: JSON.stringify({ type: "top_producer", threshold: 1 }), points: 50 },
    { code: "risparmiatore", name: "Risparmiatore", description: "Riduzione consumi del 10%", icon: "💰", category: "energy", criteria: JSON.stringify({ type: "consumption_reduction_pct", threshold: 10 }), points: 20 },
    { code: "verde_costante", name: "Verde Costante", description: "3 mesi consecutivi sotto la media consumi", icon: "🌿", category: "consistency", criteria: JSON.stringify({ type: "consecutive_below_avg", threshold: 3 }), points: 35 },
    { code: "co2_fighter", name: "CO₂ Fighter", description: "Primo tonnellata di CO₂ evitata", icon: "🌍", category: "environment", criteria: JSON.stringify({ type: "co2_avoided_kg", threshold: 1000 }), points: 40 },
    { code: "partecipante_attivo", name: "Partecipante Attivo", description: "Ha votato in 5 consultazioni", icon: "🗳️", category: "community", criteria: JSON.stringify({ type: "votes_cast", threshold: 5 }), points: 15 },
    { code: "fascia_solare", name: "Fascia Solare", description: "70% dei consumi in fascia solare per un mese", icon: "🔆", category: "energy", criteria: JSON.stringify({ type: "solar_window_pct", threshold: 70 }), points: 30 },
    { code: "pioniere", name: "Pioniere", description: "Tra i primi 10 membri della CER", icon: "🏅", category: "community", criteria: JSON.stringify({ type: "early_member", threshold: 10 }), points: 20 },
    { code: "mentore", name: "Mentore Energetico", description: "Ha condiviso 5 consigli nella community", icon: "📚", category: "community", criteria: JSON.stringify({ type: "tips_shared", threshold: 5 }), points: 15 },
    { code: "maratoneta", name: "Maratoneta Verde", description: "12 mesi consecutivi nella CER", icon: "🏃", category: "consistency", criteria: JSON.stringify({ type: "membership_months", threshold: 12 }), points: 50 },
    { code: "top_trader", name: "Top Trader", description: "10 scambi P2P completati", icon: "🔄", category: "energy", criteria: JSON.stringify({ type: "trades_completed", threshold: 10 }), points: 35 },
    { code: "carbon_hero", name: "Carbon Hero", description: "5 tonnellate di CO₂ evitate", icon: "🦸", category: "environment", criteria: JSON.stringify({ type: "co2_avoided_kg", threshold: 5000 }), points: 75 },
    { code: "community_star", name: "Stella della Comunità", description: "Completate 10 sfide comunitarie", icon: "⭐", category: "community", criteria: JSON.stringify({ type: "challenges_completed", threshold: 10 }), points: 60 },
  ];
  for (const ach of achievements) {
    await prisma.achievement.create({ data: ach });
  }
  console.log(`  ✓ ${achievements.length} achievements created`);

  // Give some achievements to demo members
  const earlyMembers = members.slice(0, 10);
  for (const member of earlyMembers) {
    await prisma.memberAchievement.create({
      data: { memberId: member.id, memberName: member.name, achievementId: (await prisma.achievement.findUnique({ where: { code: "pioniere" } }))!.id },
    });
    await prisma.memberAchievement.create({
      data: { memberId: member.id, memberName: member.name, achievementId: (await prisma.achievement.findUnique({ where: { code: "primo_mese" } }))!.id },
    });
  }
  console.log(`  ✓ ${earlyMembers.length * 2} member achievements assigned`);

  // 12. Seed active challenge
  const challenge = await prisma.challenge.create({
    data: {
      title: "Sfida Risparmio Maggio",
      description: "Riduci i consumi del 5% rispetto ad aprile",
      type: "reduction",
      targetValue: 5,
      unit: "%",
      startDate: "2025-05-01",
      endDate: "2025-05-31",
      status: "active",
      cerId: cer.id,
    },
  });
  for (const member of members.slice(0, 8)) {
    await prisma.challengeParticipant.create({
      data: { challengeId: challenge.id, memberId: member.id, memberName: member.name, currentValue: round(Math.random() * 8, 1) },
    });
  }
  console.log(`  ✓ 1 challenge with 8 participants created`);

  // 13. Seed Document Templates (Feature 6)
  const templates = [
    { name: "Atto Constitutivo CER", category: "atto_constitutivo", content: "ATTO CONSTITUTIVO\n\nCOMUNITÀ ENERGETICA RINNOVABILE\n«{{cerName}}»\n\nL'anno {{year}}, il giorno {{day}} del mese di {{month}},\npresso {{municipality}}, provincia di {{province}},\n\nI sottoscritti fondatori:\n{{memberList}}\n\nhanno deliberato di costituire una Comunità Energetica Rinnovabile ai sensi del D.Lgs. 199/2021 e della Delibera ARERA 727/2022.\n\nArt. 1 - Denominazione: {{cerName}}\nArt. 2 - Sede: {{municipality}}, {{province}}\nArt. 3 - Territorio: {{territory}}\nArt. 4 - Cabina Primaria: {{cabinaPrimaria}}\nArt. 5 - Oggetto sociale: condivisione dell'energia da fonti rinnovabili\nArt. 6 - Durata: 20 anni dalla data di costituzione\n\nFirmato dai soci fondatori." },
    { name: "Statuto CER", category: "statuto", content: "STATUTO\n\nCOMUNITÀ ENERGETICA RINNOVABILE «{{cerName}}»\n\nTITOLO I - DISPOSIZIONI GENERALI\n\nArt. 1 - È costituita la CER «{{cerName}}» con sede in {{municipality}}.\nArt. 2 - La CER ha per oggetto la produzione, lo scambio e il consumo di energia da fonti rinnovabili.\n\nTITOLO II - SOCI\n\nArt. 3 - Possono aderire alla CER persone fisiche, PMI, enti locali e associazioni.\nArt. 4 - L'adesione comporta l'accettazione del presente statuto e del regolamento interno.\n\nTITOLO III - GOVERNANCE\n\nArt. 5 - L'Assemblea dei soci è l'organo sovrano della CER.\nArt. 6 - Il Consiglio Direttivo è composto da {{boardSize}} membri eletti dall'Assemblea.\nArt. 7 - Le votazioni avvengono con le modalità previste dal regolamento.\n\nTITOLO IV - ENERGIA E INCENTIVI\n\nArt. 8 - La ripartizione degli incentivi GSE avviene secondo il regolamento di riparto approvato dall'Assemblea.\nArt. 9 - I soci produttori immettono l'energia in eccesso nella rete condivisa.\n\nApprovato dall'Assemblea Costituente il {{approvalDate}}." },
    { name: "Regolamento Interno", category: "regolamento", content: "REGOLAMENTO INTERNO\n\nCER «{{cerName}}»\n\nCapo I - Modalità di adesione e recesso\nCapo II - Ripartizione incentivi: formula basata su peso energetico e tipologia membro\nCapo III - Obblighi dei soci produttori e consumatori\nCapo IV - Gestione delle assemblee e votazioni digitali\nCapo V - Trattamento dei dati personali e energetici\n\nApprovato il {{approvalDate}}." },
    { name: "Verbale di Assemblea", category: "verbale", content: "VERBALE DI ASSEMBLEA {{assemblyType}}\n\nCER «{{cerName}}»\n\nData: {{date}}\nOra: {{time}}\nLuogo: {{location}}\n\nPresenti: {{attendeeCount}} su {{totalMembers}} aventi diritto\nQuorum raggiunto: {{quorumReached}}\n\nOrdine del giorno:\n{{agenda}}\n\nDeliberazioni:\n{{deliberations}}\n\nIl Presidente: {{president}}\nIl Segretario: {{secretary}}" },
    { name: "Contratto di Adesione", category: "contratto_adesione", content: "CONTRATTO DI ADESIONE\n\nCER «{{cerName}}»\n\nIl/La sottoscritto/a {{memberName}},\nCodice Fiscale: {{fiscalCode}},\nresidente in {{municipality}},\nPOD: {{podCode}},\nTipologia: {{memberType}},\n\nCHIEDE di aderire alla CER «{{cerName}}» accettando integralmente lo Statuto e il Regolamento Interno.\n\nData: {{date}}\nFirma: ___________________" },
  ];
  for (const tmpl of templates) {
    await prisma.documentTemplate.create({ data: tmpl });
  }
  console.log(`  ✓ ${templates.length} document templates created`);

  // 14. Seed Country Configs (Feature 10)
  const countries = [
    { countryCode: "IT", countryName: "Italia", incentiveFormula: JSON.stringify({ type: "GSE", rateEuroPerMwh: 110, selfConsumptionBonus: 10 }), reportingFormat: "GSE", gridEmissionFactor: 256, regulatoryReference: "D.Lgs. 199/2021, ARERA 727/2022" },
    { countryCode: "ES", countryName: "España", incentiveFormula: JSON.stringify({ type: "CNMC", rateEuroPerMwh: 45, selfConsumptionBonus: 5 }), reportingFormat: "CNMC", gridEmissionFactor: 210, regulatoryReference: "RD 244/2019, Ley 7/2021" },
    { countryCode: "FR", countryName: "France", incentiveFormula: JSON.stringify({ type: "ENEDIS", rateEuroPerMwh: 60, selfConsumptionBonus: 8 }), reportingFormat: "ENEDIS", gridEmissionFactor: 55, regulatoryReference: "Ordonnance 2021-236, Code de l'énergie" },
  ];
  for (const country of countries) {
    await prisma.countryConfig.create({ data: country });
  }
  console.log(`  ✓ ${countries.length} country configs created`);

  // 15. Seed Carbon Credits (Feature 9)
  const energyTotal = energyMonths.reduce((s, m) => s + m.sharedEnergyKwh, 0);
  const co2Tonnes = round((energyTotal * 0.256) / 1000, 2); // Italian grid factor
  await prisma.carbonCredit.create({
    data: {
      cerId: cer.id, cerName: cer.name, vintage: "2025",
      co2Tonnes, methodology: "ISO-14064",
      verificationStatus: "verified", pricePerTonne: 45,
      status: "available",
    },
  });
  console.log(`  ✓ Carbon credit created: ${co2Tonnes} tonnes CO₂`);

  console.log("\n✅ Seed completed successfully!");
}

main()
  .catch((e) => { console.error("Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
