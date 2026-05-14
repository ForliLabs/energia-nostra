/**
 * Data Import Toolkit — Excel/CSV import wizards with auto-detection,
 * column mapping, validation, CER onboarding, and rollback.
 */

import { prisma } from "@/lib/prisma";
import { eventBus } from "@/lib/events";

// ── Types ──

export type ImportType = "members" | "energy_data" | "financial";

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  confidence: number; // 0-1
  transform?: string; // e.g., "uppercase", "trim", "date_parse"
}

export interface ImportValidationResult {
  valid: boolean;
  totalRows: number;
  validRows: number;
  errorRows: number;
  errors: ImportRowError[];
  preview: Record<string, unknown>[];
}

export interface ImportRowError {
  row: number;
  column: string;
  value: string;
  error: string;
}

export interface ImportJobRecord {
  id: string;
  type: ImportType;
  fileName: string;
  totalRows: number;
  processedRows: number;
  successRows: number;
  errorRows: number;
  status: string;
  columnMapping: ColumnMapping[] | null;
  errors: ImportRowError[] | null;
  dryRun: boolean;
  createdAt: string;
  completedAt: string | null;
}

export interface OnboardingStep {
  step: number;
  title: string;
  description: string;
  status: "pending" | "completed" | "skipped";
  required: boolean;
}

// ── Column Auto-Detection ──

const MEMBER_FIELD_PATTERNS: Record<string, RegExp[]> = {
  name: [/nome/i, /name/i, /ragione.?sociale/i, /denominazione/i],
  podCode: [/pod/i, /punto.?di.?consegna/i, /codice.?pod/i],
  type: [/tipo/i, /type/i, /tipologia/i, /ruolo/i],
  municipality: [/comune/i, /municipio/i, /city/i, /citt/i],
  fiscalCode: [/codice.?fiscale/i, /cf/i, /fiscal/i, /tax/i],
  email: [/email/i, /mail/i, /posta/i],
  phone: [/telefono/i, /phone/i, /cellulare/i, /mobile/i],
  address: [/indirizzo/i, /address/i, /via/i],
  joinedAt: [/data.?adesione/i, /joined/i, /iscrizione/i, /data.?ingresso/i],
};

const ENERGY_FIELD_PATTERNS: Record<string, RegExp[]> = {
  podCode: [/pod/i, /codice.?pod/i],
  month: [/mese/i, /month/i, /periodo/i, /data/i],
  consumptionKwh: [/consumo/i, /consumption/i, /prelievo/i, /kw.?consumat/i],
  productionKwh: [/produzione/i, /production/i, /immissione/i, /kw.?prodott/i],
};

const FINANCIAL_FIELD_PATTERNS: Record<string, RegExp[]> = {
  memberName: [/nome/i, /membro/i, /beneficiario/i],
  period: [/periodo/i, /mese/i, /trimestre/i],
  amount: [/importo/i, /amount/i, /euro/i, /€/i, /incentivo/i],
  type: [/tipo/i, /causale/i, /descrizione/i],
};

function getFieldPatterns(importType: ImportType): Record<string, RegExp[]> {
  switch (importType) {
    case "members": return MEMBER_FIELD_PATTERNS;
    case "energy_data": return ENERGY_FIELD_PATTERNS;
    case "financial": return FINANCIAL_FIELD_PATTERNS;
  }
}

/**
 * Auto-detect column mappings from CSV headers.
 */
export function autoDetectColumns(
  headers: string[],
  importType: ImportType
): ColumnMapping[] {
  const patterns = getFieldPatterns(importType);
  const mappings: ColumnMapping[] = [];
  const usedTargets = new Set<string>();

  for (const header of headers) {
    let bestMatch: { field: string; confidence: number } | null = null;

    for (const [field, regexes] of Object.entries(patterns)) {
      if (usedTargets.has(field)) continue;
      for (const regex of regexes) {
        if (regex.test(header)) {
          const confidence = header.toLowerCase() === field.toLowerCase() ? 1.0 : 0.8;
          if (!bestMatch || confidence > bestMatch.confidence) {
            bestMatch = { field, confidence };
          }
          break;
        }
      }
    }

    if (bestMatch) {
      usedTargets.add(bestMatch.field);
      mappings.push({
        sourceColumn: header,
        targetField: bestMatch.field,
        confidence: bestMatch.confidence,
      });
    } else {
      mappings.push({
        sourceColumn: header,
        targetField: "",
        confidence: 0,
      });
    }
  }

  return mappings;
}

// ── CSV Parsing ──

export function parseCSV(content: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  // Detect separator
  const firstLine = lines[0];
  const separator = firstLine.includes(";") ? ";" : ",";

  const headers = firstLine.split(separator).map(h => h.trim().replace(/^["']|["']$/g, ""));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim().replace(/^["']|["']$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    rows.push(row);
  }

  return { headers, rows };
}

// ── Validation ──

// Italian POD code format: IT + 3 digits + E + 8 digits
const POD_REGEX = /^IT\d{3}E\d{8}$/;
// Italian fiscal code
const FISCAL_CODE_REGEX = /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/i;

export function validateImportData(
  rows: Record<string, string>[],
  mappings: ColumnMapping[],
  importType: ImportType
): ImportValidationResult {
  const errors: ImportRowError[] = [];
  const preview: Record<string, unknown>[] = [];

  const fieldMap = new Map(mappings.filter(m => m.targetField).map(m => [m.targetField, m.sourceColumn]));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const mappedRow: Record<string, unknown> = {};
    let rowValid = true;

    for (const [targetField, sourceColumn] of fieldMap.entries()) {
      const value = row[sourceColumn]?.trim() || "";
      mappedRow[targetField] = value;

      // Type-specific validations
      if (importType === "members") {
        if (targetField === "podCode" && value) {
          if (!POD_REGEX.test(value.toUpperCase())) {
            errors.push({
              row: i + 2, // +2 for 1-indexed + header
              column: sourceColumn,
              value,
              error: `Formato POD non valido. Atteso: IT###E########`,
            });
            rowValid = false;
          }
        }
        if (targetField === "fiscalCode" && value) {
          if (!FISCAL_CODE_REGEX.test(value)) {
            errors.push({
              row: i + 2,
              column: sourceColumn,
              value,
              error: `Formato codice fiscale non valido`,
            });
            rowValid = false;
          }
        }
        if (targetField === "name" && !value) {
          errors.push({
            row: i + 2,
            column: sourceColumn,
            value: "(vuoto)",
            error: "Il nome è obbligatorio",
          });
          rowValid = false;
        }
      }

      if (importType === "energy_data") {
        if (targetField === "consumptionKwh" || targetField === "productionKwh") {
          const num = parseFloat(value.replace(",", "."));
          if (value && (isNaN(num) || num < 0)) {
            errors.push({
              row: i + 2,
              column: sourceColumn,
              value,
              error: `Valore numerico non valido per ${targetField}`,
            });
            rowValid = false;
          }
          mappedRow[targetField] = num || 0;
        }
      }
    }

    if (rowValid || i < 10) {
      preview.push(mappedRow);
    }
  }

  return {
    valid: errors.length === 0,
    totalRows: rows.length,
    validRows: rows.length - new Set(errors.map(e => e.row)).size,
    errorRows: new Set(errors.map(e => e.row)).size,
    errors: errors.slice(0, 100), // Cap at 100 errors
    preview: preview.slice(0, 10),
  };
}

// ── Import Execution ──

export async function executeImport(
  jobId: string,
  rows: Record<string, string>[],
  mappings: ColumnMapping[],
  importType: ImportType,
  cerId: string,
  dryRun = false
): Promise<ImportJobRecord> {
  const fieldMap = new Map(mappings.filter(m => m.targetField).map(m => [m.targetField, m.sourceColumn]));
  let successCount = 0;
  let errorCount = 0;
  const importErrors: ImportRowError[] = [];
  const rollbackIds: string[] = [];

  await prisma.importJob.update({
    where: { id: jobId },
    data: { status: dryRun ? "validating" : "importing", totalRows: rows.length },
  });

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    try {
      if (importType === "members" && !dryRun) {
        const name = row[fieldMap.get("name") || ""] || "";
        const podCode = (row[fieldMap.get("podCode") || ""] || "").toUpperCase();
        const type = row[fieldMap.get("type") || ""] || "consumatore";
        const municipality = row[fieldMap.get("municipality") || ""] || "";
        const joinedAt = row[fieldMap.get("joinedAt") || ""] || new Date().toISOString().slice(0, 10);

        if (!name || !podCode) {
          errorCount++;
          importErrors.push({ row: i + 2, column: "name/podCode", value: "", error: "Dati obbligatori mancanti" });
          continue;
        }

        // Check for existing POD
        const existing = await prisma.member.findUnique({ where: { podCode } });
        if (existing) {
          errorCount++;
          importErrors.push({ row: i + 2, column: "podCode", value: podCode, error: "POD già esistente" });
          continue;
        }

        const member = await prisma.member.create({
          data: {
            name,
            podCode,
            type: normalizeType(type),
            municipality,
            joinedAt,
            cerId,
            energyBalanceKwh: 0,
            monthlyBenefitEuro: 0,
          },
        });

        rollbackIds.push(member.id);
        successCount++;
      } else if (importType === "energy_data" && !dryRun) {
        const podCode = (row[fieldMap.get("podCode") || ""] || "").toUpperCase();
        const month = row[fieldMap.get("month") || ""] || "";
        const consumption = parseFloat((row[fieldMap.get("consumptionKwh") || ""] || "0").replace(",", "."));
        const production = parseFloat((row[fieldMap.get("productionKwh") || ""] || "0").replace(",", "."));

        const member = await prisma.member.findUnique({ where: { podCode } });
        if (!member) {
          errorCount++;
          importErrors.push({ row: i + 2, column: "podCode", value: podCode, error: "Membro non trovato per POD" });
          continue;
        }

        const reading = await prisma.meterReading.create({
          data: {
            memberId: member.id,
            timestamp: parseItalianDate(month),
            consumptionKwh: consumption,
            productionKwh: production,
            source: "import",
            validated: true,
          },
        });

        rollbackIds.push(reading.id);
        successCount++;
      } else {
        // Dry run or financial — just count
        successCount++;
      }
    } catch (err) {
      errorCount++;
      importErrors.push({
        row: i + 2,
        column: "general",
        value: "",
        error: (err as Error).message,
      });
    }

    // Update progress every 50 rows
    if (i % 50 === 0) {
      await prisma.importJob.update({
        where: { id: jobId },
        data: { processedRows: i + 1 },
      });
    }
  }

  // Update final status
  const job = await prisma.importJob.update({
    where: { id: jobId },
    data: {
      status: "completed",
      processedRows: rows.length,
      successRows: successCount,
      errorRows: errorCount,
      errors: importErrors.length > 0 ? JSON.stringify(importErrors.slice(0, 100)) : null,
      rollbackData: !dryRun ? JSON.stringify({ type: importType, ids: rollbackIds }) : null,
      completedAt: new Date(),
    },
  });

  if (!dryRun && successCount > 0) {
    await eventBus.emit("member.joined", {
      importJobId: jobId,
      importedCount: successCount,
      importType,
    }, { cerId });
  }

  return mapImportJob(job);
}

// ── Rollback ──

export async function rollbackImport(jobId: string): Promise<void> {
  const job = await prisma.importJob.findUnique({ where: { id: jobId } });
  if (!job || !job.rollbackData) {
    throw new Error("Nessun dato di rollback disponibile per questo import");
  }

  const rollbackData = JSON.parse(job.rollbackData) as { type: ImportType; ids: string[] };

  if (rollbackData.type === "members") {
    await prisma.member.deleteMany({
      where: { id: { in: rollbackData.ids } },
    });
  } else if (rollbackData.type === "energy_data") {
    await prisma.meterReading.deleteMany({
      where: { id: { in: rollbackData.ids } },
    });
  }

  await prisma.importJob.update({
    where: { id: jobId },
    data: { status: "rolled_back" },
  });
}

// ── CER Onboarding Wizard ──

export function getOnboardingSteps(cerId: string): OnboardingStep[] {
  void cerId;
  return [
    { step: 1, title: "Configurazione CER", description: "Nome, comune, cabina primaria, forma giuridica", status: "pending", required: true },
    { step: 2, title: "Importa Membri", description: "Carica registro membri da Excel o inserisci manualmente", status: "pending", required: true },
    { step: 3, title: "Dati Storici", description: "Importa letture energetiche degli ultimi 12-24 mesi (abilita previsioni)", status: "pending", required: false },
    { step: 4, title: "Configurazione Fatturazione", description: "Struttura tariffaria, metodi di pagamento, ciclo di fatturazione", status: "pending", required: true },
    { step: 5, title: "Governance", description: "Ruoli, regole di voto, quorum", status: "pending", required: true },
    { step: 6, title: "Anteprima Primo Ciclo", description: "Verifica la configurazione con un ciclo di fatturazione di prova", status: "pending", required: false },
  ];
}

export async function checkOnboardingProgress(cerId: string): Promise<{
  steps: OnboardingStep[];
  completionPct: number;
  nextStep: number;
}> {
  const steps = getOnboardingSteps(cerId);

  // Check actual data to determine completion
  const cer = await prisma.cer.findUnique({ where: { id: cerId } });
  if (cer) steps[0].status = "completed";

  const memberCount = await prisma.member.count({ where: { cerId } });
  if (memberCount > 0) steps[1].status = "completed";

  const readingCount = await prisma.meterReading.count({
    where: { member: { cerId } },
  });
  if (readingCount > 0) steps[2].status = "completed";

  const invoiceCount = await prisma.invoice.count({ where: { cerId } });
  if (invoiceCount > 0) steps[3].status = "completed";

  const voteCount = await prisma.vote.count({ where: { cerId } });
  if (voteCount > 0) steps[4].status = "completed";

  const completedCount = steps.filter(s => s.status === "completed").length;
  const completionPct = Math.round((completedCount / steps.length) * 100);
  const nextStep = steps.find(s => s.status === "pending")?.step || steps.length + 1;

  return { steps, completionPct, nextStep };
}

// ── Import Job Queries ──

export async function getImportJobs(cerId: string): Promise<ImportJobRecord[]> {
  const jobs = await prisma.importJob.findMany({
    where: { cerId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return jobs.map(mapImportJob);
}

export async function createImportJob(
  userId: string,
  cerId: string,
  type: ImportType,
  fileName: string,
  dryRun = false
): Promise<ImportJobRecord> {
  const job = await prisma.importJob.create({
    data: {
      userId,
      cerId,
      type,
      fileName,
      dryRun,
      status: "pending",
    },
  });
  return mapImportJob(job);
}

// ── Helpers ──

function normalizeType(input: string): string {
  const lower = input.toLowerCase().trim();
  if (lower.includes("produt")) return "produttore";
  if (lower.includes("prosum")) return "prosumer";
  return "consumatore";
}

function parseItalianDate(input: string): Date {
  // Try common Italian date formats
  const patterns = [
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD (ISO)
    /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      if (pattern === patterns[1]) {
        return new Date(`${match[1]}-${match[2]}-${match[3]}`);
      }
      return new Date(`${match[3]}-${match[2]}-${match[1]}`);
    }
  }

  // Try month name (e.g., "Gennaio 2024", "Gen 2024")
  const monthNames: Record<string, number> = {
    gen: 0, feb: 1, mar: 2, apr: 3, mag: 4, giu: 5,
    lug: 6, ago: 7, set: 8, ott: 9, nov: 10, dic: 11,
    gennaio: 0, febbraio: 1, marzo: 2, aprile: 3, maggio: 4, giugno: 5,
    luglio: 6, agosto: 7, settembre: 8, ottobre: 9, novembre: 10, dicembre: 11,
  };

  const monthMatch = input.match(/(\w+)\s+(\d{4})/);
  if (monthMatch) {
    const monthNum = monthNames[monthMatch[1].toLowerCase()];
    if (monthNum !== undefined) {
      return new Date(parseInt(monthMatch[2]), monthNum, 1);
    }
  }

  return new Date(input);
}

function mapImportJob(job: {
  id: string;
  type: string;
  fileName: string;
  totalRows: number;
  processedRows: number;
  successRows: number;
  errorRows: number;
  status: string;
  columnMapping: string | null;
  errors: string | null;
  dryRun: boolean;
  createdAt: Date;
  completedAt: Date | null;
}): ImportJobRecord {
  return {
    id: job.id,
    type: job.type as ImportType,
    fileName: job.fileName,
    totalRows: job.totalRows,
    processedRows: job.processedRows,
    successRows: job.successRows,
    errorRows: job.errorRows,
    status: job.status,
    columnMapping: job.columnMapping ? JSON.parse(job.columnMapping) : null,
    errors: job.errors ? JSON.parse(job.errors) : null,
    dryRun: job.dryRun,
    createdAt: job.createdAt.toISOString(),
    completedAt: job.completedAt?.toISOString() || null,
  };
}
