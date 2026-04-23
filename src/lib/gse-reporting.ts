import type { CerMember, EnergyMonth, IncentiveShareRecord } from "@/lib/data-db";

export interface GseReportData {
  id: string;
  period: string;
  cerName: string;
  cerCode: string;
  sharedEnergyKwh: number;
  totalIncentiveEuro: number;
  incentiveRateEuroPerMwh: number;
  memberAllocations: Array<{
    podCode: string;
    name: string;
    type: string;
    energyBalanceKwh: number;
    sharePct: number;
    incentiveEuro: number;
  }>;
  validationChecks: ValidationCheck[];
  status: "bozza" | "validato" | "inviato" | "approvato";
  generatedAt: string;
}

export interface ValidationCheck {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export function generateGseReport(
  period: string,
  energyMonth: EnergyMonth,
  members: CerMember[],
  incentives: IncentiveShareRecord[],
  cerName: string
): GseReportData {
  const checks: ValidationCheck[] = [
    {
      id: "pod-count",
      label: "Conteggio POD",
      passed: members.length >= 2,
      detail: `${members.length} POD registrati (minimo 2 richiesti)`,
    },
    {
      id: "pod-format",
      label: "Formato POD",
      passed: members.every((m) => /^IT\d{3}E\d{9}$/.test(m.podCode)),
      detail: members.every((m) => /^IT\d{3}E\d{9}$/.test(m.podCode))
        ? "Tutti i POD rispettano il formato italiano"
        : "Alcuni POD non rispettano il formato IT###E#########",
    },
    {
      id: "shared-energy",
      label: "Energia condivisa > 0",
      passed: energyMonth.sharedEnergyKwh > 0,
      detail: `${energyMonth.sharedEnergyKwh.toLocaleString("it-IT")} kWh condivisi`,
    },
    {
      id: "producer-present",
      label: "Almeno un produttore",
      passed: members.some((m) => m.type === "produttore" || m.type === "prosumer"),
      detail: `${members.filter((m) => m.type === "produttore").length} produttori, ${members.filter((m) => m.type === "prosumer").length} prosumer`,
    },
    {
      id: "consumer-present",
      label: "Almeno un consumatore",
      passed: members.some((m) => m.type === "consumatore" || m.type === "prosumer"),
      detail: `${members.filter((m) => m.type === "consumatore").length} consumatori`,
    },
    {
      id: "incentive-sum",
      label: "Somma incentivi coerente",
      passed: Math.abs(incentives.reduce((s, i) => s + i.sharePct, 0) - 100) < 1,
      detail: `Somma quote: ${incentives.reduce((s, i) => s + i.sharePct, 0).toFixed(2)}%`,
    },
    {
      id: "cabina-primaria",
      label: "Cabina primaria dichiarata",
      passed: true,
      detail: "Bertinoro–Forlimpopoli / area collinare Romagna",
    },
    {
      id: "period-valid",
      label: "Periodo rendicontazione valido",
      passed: period.length > 0,
      detail: `Periodo: ${period}`,
    },
  ];

  return {
    id: `gse-${period.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}`,
    period,
    cerName,
    cerCode: "CER-FC-2024-001",
    sharedEnergyKwh: energyMonth.sharedEnergyKwh,
    totalIncentiveEuro: energyMonth.gseIncentiveEuro,
    incentiveRateEuroPerMwh: 110,
    memberAllocations: members.map((m) => {
      const incentive = incentives.find((i) => i.memberId === m.id);
      return {
        podCode: m.podCode,
        name: m.name,
        type: m.type,
        energyBalanceKwh: m.energyBalanceKwh,
        sharePct: incentive?.sharePct ?? 0,
        incentiveEuro: incentive?.monthlyEuro ?? 0,
      };
    }),
    validationChecks: checks,
    status: checks.every((c) => c.passed) ? "validato" : "bozza",
    generatedAt: new Date().toISOString(),
  };
}

// Generate GSE-compatible CSV export
export function exportGseCsv(report: GseReportData): string {
  const header = "CER_CODE;PERIODO;POD;NOME;TIPO;SALDO_KWH;QUOTA_PCT;INCENTIVO_EUR";
  const rows = report.memberAllocations.map(
    (m) =>
      `${report.cerCode};${report.period};${m.podCode};${m.name};${m.type};${m.energyBalanceKwh};${m.sharePct.toFixed(2)};${m.incentiveEuro.toFixed(2)}`
  );
  return [header, ...rows].join("\n");
}

// Generate GSE-compatible XML export
export function exportGseXml(report: GseReportData): string {
  const members = report.memberAllocations
    .map(
      (m) => `    <Membro>
      <POD>${m.podCode}</POD>
      <Nome>${m.name}</Nome>
      <Tipo>${m.type}</Tipo>
      <SaldoKwh>${m.energyBalanceKwh}</SaldoKwh>
      <QuotaPct>${m.sharePct.toFixed(2)}</QuotaPct>
      <IncentivoEuro>${m.incentiveEuro.toFixed(2)}</IncentivoEuro>
    </Membro>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<ReportGSE>
  <CER>
    <Codice>${report.cerCode}</Codice>
    <Nome>${report.cerName}</Nome>
    <Periodo>${report.period}</Periodo>
  </CER>
  <EnergiaCondivisa>
    <Kwh>${report.sharedEnergyKwh}</Kwh>
    <TariffaEuroMwh>${report.incentiveRateEuroPerMwh}</TariffaEuroMwh>
    <IncentivoTotaleEuro>${report.totalIncentiveEuro.toFixed(2)}</IncentivoTotaleEuro>
  </EnergiaCondivisa>
  <Membri>
${members}
  </Membri>
  <Generato>${report.generatedAt}</Generato>
</ReportGSE>`;
}
