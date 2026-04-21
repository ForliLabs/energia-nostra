import type { CerMember } from "@/lib/data";

export interface MeterRecord {
  podCode: string;
  timestamp: string;
  consumptionKwh: number;
  productionKwh: number;
}

export interface ValidationResult {
  valid: MeterRecord[];
  anomalies: Array<MeterRecord & { anomaly: string }>;
  errors: string[];
  summary: {
    totalRecords: number;
    validCount: number;
    anomalyCount: number;
    errorCount: number;
  };
}

// Parse CSV with flexible column matching for Italian meter data formats
export function parseMeterCsv(csvText: string): { records: MeterRecord[]; errors: string[] } {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) {
    return { records: [], errors: ["Il file CSV deve contenere almeno un'intestazione e una riga di dati."] };
  }

  const header = lines[0].toLowerCase().replace(/"/g, "").split(/[;,\t]/);
  const errors: string[] = [];
  const records: MeterRecord[] = [];

  // Map common Italian and English column names
  const podIdx = header.findIndex((h) => /pod|codice.*pod|punto.*prelievo/.test(h));
  const dateIdx = header.findIndex((h) => /data|timestamp|date|ora/.test(h));
  const consIdx = header.findIndex((h) => /consumo|consumption|prelievo|kwh.*c/.test(h));
  const prodIdx = header.findIndex((h) => /produzione|production|immissione|kwh.*p/.test(h));

  if (podIdx === -1 || dateIdx === -1 || consIdx === -1) {
    return {
      records: [],
      errors: ["Colonne obbligatorie non trovate. Serve almeno: POD, data/timestamp, consumo."],
    };
  }

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].replace(/"/g, "").split(/[;,\t]/);
    if (cols.length < Math.max(podIdx, dateIdx, consIdx) + 1) {
      errors.push(`Riga ${i + 1}: numero colonne insufficiente.`);
      continue;
    }

    const consumption = parseFloat(cols[consIdx]?.replace(",", ".") || "0");
    const production = prodIdx >= 0 ? parseFloat(cols[prodIdx]?.replace(",", ".") || "0") : 0;

    if (isNaN(consumption)) {
      errors.push(`Riga ${i + 1}: valore consumo non numerico.`);
      continue;
    }

    records.push({
      podCode: cols[podIdx].trim().toUpperCase(),
      timestamp: cols[dateIdx].trim(),
      consumptionKwh: consumption,
      productionKwh: isNaN(production) ? 0 : production,
    });
  }

  return { records, errors };
}

// Validate records against known members and detect anomalies
export function validateMeterData(records: MeterRecord[], members: CerMember[]): ValidationResult {
  const knownPods = new Set(members.map((m) => m.podCode));
  const valid: MeterRecord[] = [];
  const anomalies: Array<MeterRecord & { anomaly: string }> = [];
  const errors: string[] = [];

  for (const record of records) {
    const issues: string[] = [];

    if (!knownPods.has(record.podCode)) {
      issues.push("POD non riconosciuto nel registro membri");
    }

    if (record.consumptionKwh < 0) {
      issues.push("Consumo negativo");
    }

    if (record.consumptionKwh > 5000) {
      issues.push("Consumo anomalo (>5.000 kWh in una lettura)");
    }

    if (record.productionKwh > 10000) {
      issues.push("Produzione anomala (>10.000 kWh in una lettura)");
    }

    if (record.productionKwh < 0) {
      issues.push("Produzione negativa");
    }

    if (!record.timestamp) {
      issues.push("Timestamp mancante");
    }

    if (issues.length > 0) {
      anomalies.push({ ...record, anomaly: issues.join("; ") });
    } else {
      valid.push(record);
    }
  }

  return {
    valid,
    anomalies,
    errors,
    summary: {
      totalRecords: records.length,
      validCount: valid.length,
      anomalyCount: anomalies.length,
      errorCount: errors.length,
    },
  };
}
