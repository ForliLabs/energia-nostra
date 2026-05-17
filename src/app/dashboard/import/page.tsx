"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, RotateCcw, RefreshCw, Paperclip, Download } from "lucide-react";
import { FetchError } from "@/components/ui/fetch-error";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast-provider";

interface ImportJob {
  id: string;
  type: string;
  fileName: string;
  totalRows: number;
  successRows: number;
  errorRows: number;
  status: string;
  createdAt: string;
}

interface OnboardingStep {
  step: number;
  title: string;
  description: string;
  status: string;
  required: boolean;
}

const importTypeLabels: Record<string, string> = {
  members: "Registro Membri",
  energy_data: "Dati Energetici",
  financial: "Dati Finanziari",
};

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const templateCsvContent: Record<string, string> = {
  members: "Nome;POD;Tipo;Comune;Data Adesione\nEsempio Membro;IT001E12345678;consumatore;Forlì;01/01/2024",
  energy_data: "POD;Mese;Consumo kWh;Produzione kWh\nIT001E12345678;Gennaio 2024;350;0",
  financial: "Nome;Periodo;Importo;Tipo\nEsempio Membro;2024-Q1;125.50;incentivo",
};

const templateFileNames: Record<string, string> = {
  members: "template-membri.csv",
  energy_data: "template-dati-energetici.csv",
  financial: "template-dati-finanziari.csv",
};

function downloadTemplateCsv(type: string) {
  const content = templateCsvContent[type];
  if (!content) return;
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = templateFileNames[type] ?? `template-${type}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

const formatHints: Record<string, string> = {
  members: "Formato atteso: Nome;POD;Tipo;Comune;Data Adesione — separatore punto e virgola, intestazione obbligatoria",
  energy_data: "Formato atteso: POD;Mese;Consumo kWh;Produzione kWh — separatore punto e virgola, intestazione obbligatoria",
  financial: "Formato atteso: Nome;Periodo;Importo;Tipo — separatore punto e virgola, intestazione obbligatoria",
};

export default function ImportPage() {
  const { showToast } = useToast();
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [onboarding, setOnboarding] = useState<{ steps: OnboardingStep[]; completionPct: number } | null>(null);
  const [selectedType, setSelectedType] = useState<string>("members");
  const [csvContent, setCsvContent] = useState("");
  const [pickedFileName, setPickedFileName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilePick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      showToast({
        title: "File troppo grande",
        description: `Il file supera il limite di ${MAX_FILE_SIZE_MB} MB. Riduci le righe o suddividi il file prima di importare.`,
        variant: "error",
      });
      // Reset input so the same file can trigger onChange again if user retries
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setPickedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        setCsvContent(text);
      }
    };
    reader.onerror = () => {
      showToast({
        title: "Errore lettura file",
        description: "Impossibile leggere il file selezionato. Verifica che il file non sia corrotto e riprova.",
        variant: "error",
      });
      setPickedFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file, "UTF-8");
  };

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const [jobsData, onboardingData] = await Promise.all([
        fetch("/api/import").then(r => { if (!r.ok) throw new Error(`Errore ${r.status}`); return r.json(); }),
        fetch("/api/onboarding").then(r => { if (!r.ok) throw new Error(`Errore ${r.status}`); return r.json(); }),
      ]);
      setJobs(jobsData.jobs || []);
      setOnboarding(onboardingData);
    } catch (e) {
      setError((e as Error).message || "Impossibile caricare i dati.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  const handleImport = async (dryRun: boolean) => {
    if (!csvContent.trim()) return;
    setImporting(true);
    setResult(null);

    try {
      // Step 1: Parse
      const parseRes = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "parse", csvContent }),
      });
      const parseData = await parseRes.json() as { headers?: string[]; error?: string };
      if (!parseRes.ok) {
        throw new Error(parseData.error || `Errore nel parsing del CSV (${parseRes.status}).`);
      }

      // Step 2: Auto-detect columns
      const detectRes = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "auto-detect", headers: parseData.headers, type: selectedType }),
      });
      const detectData = await detectRes.json() as { mappings?: unknown; error?: string };
      if (!detectRes.ok) {
        throw new Error(detectData.error || `Errore nel riconoscimento colonne (${detectRes.status}).`);
      }

      // Step 3: Execute
      const execRes = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute",
          csvContent,
          mappings: detectData.mappings,
          type: selectedType,
          fileName: "import.csv",
          dryRun,
        }),
      });
      const execData = await execRes.json() as ImportJob & { error?: string };
      if (!execRes.ok) {
        throw new Error(execData.error || `Errore durante l'esecuzione dell'import (${execRes.status}).`);
      }

      setResult(execData);
      if (!dryRun) {
        setJobs(prev => [execData, ...prev]);
        showToast({
          title: "Import completato",
          description: `${execData.successRows} righe importate con successo.`,
          variant: "success",
        });
      } else {
        showToast({
          title: "Validazione completata",
          description: `${execData.successRows} righe valide, ${execData.errorRows} errori.`,
          variant: "info",
        });
      }
    } catch (err) {
      showToast({
        title: "Importazione non riuscita",
        description: (err as Error).message,
        variant: "error",
      });
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Dati" title="Importazione Dati" description="Importa membri, dati energetici e finanziari da Excel/CSV." />
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm">
          <Skeleton className="h-6 w-36 mb-4" />
          <Skeleton className="h-3 w-full rounded-full mb-4" />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Dati" title="Importazione Dati" description="Importa membri, dati energetici e finanziari da Excel/CSV." />
        <FetchError
          title="Impossibile caricare i dati di importazione"
          description="Verifica la connessione e riprova."
          errorDetail={error}
          onRetry={() => { setLoading(true); void fetchData(); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Dati" title="Importazione Dati" description="Importa membri, dati energetici e finanziari da Excel/CSV." />

      {/* Onboarding Progress */}
      {onboarding && (
        <div className="rounded-2xl border border-lime-100 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-lime-950">Setup CER</h2>
            <span className="text-sm font-medium text-lime-600">{onboarding.completionPct}% completato</span>
          </div>
          <div className="h-2 rounded-full bg-zinc-100 mb-4">
            <div className="h-2 rounded-full bg-lime-500 transition-all" style={{ width: `${onboarding.completionPct}%` }} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {onboarding.steps.map(step => (
              <div key={step.step} className="flex items-start gap-3 rounded-xl border border-zinc-100 p-3">
                {step.status === "completed" ? (
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-zinc-300 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-medium text-lime-950">
                    {step.title} {!step.required && <span className="text-zinc-400">(opzionale)</span>}
                  </p>
                  <p className="text-xs text-zinc-500">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Import Wizard */}
      <div className="rounded-2xl border border-lime-100 bg-white p-6">
        <h2 className="text-lg font-semibold text-lime-950 mb-4">Nuovo Import</h2>

        {/* Type Selection */}
        <div className="mb-4">
          <label className="text-sm font-medium text-zinc-700 mb-2 block">Tipo di dati</label>
          <div className="flex gap-2">
            {["members", "energy_data", "financial"].map(type => (
              <button
                key={type}
                onClick={() => { setSelectedType(type); setCsvContent(""); setPickedFileName(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${selectedType === type ? "bg-lime-100 text-lime-950 ring-1 ring-lime-200" : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"}`}
              >
                <FileSpreadsheet className="h-4 w-4" />
                {importTypeLabels[type]}
              </button>
            ))}
          </div>
        </div>

        {/* CSV Input */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <label htmlFor="csv-textarea" className="text-sm font-medium text-zinc-700">Dati CSV</label>
            <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100">
              <Paperclip className="h-3.5 w-3.5" />
              {pickedFileName ?? "Scegli file CSV"}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                className="sr-only"
                onChange={handleFilePick}
                aria-label="Carica file CSV"
              />
            </label>
          </div>
          <textarea
            id="csv-textarea"
            value={csvContent}
            onChange={(e) => setCsvContent(e.target.value)}
            placeholder={selectedType === "members"
              ? "Nome;POD;Tipo;Comune;Data Adesione\nMario Rossi;IT001E12345678;consumatore;Forlì;01/01/2024"
              : selectedType === "energy_data"
              ? "POD;Mese;Consumo kWh;Produzione kWh\nIT001E12345678;Gennaio 2024;350;0"
              : "Nome;Periodo;Importo;Tipo\nMario Rossi;2024-Q1;125.50;incentivo"
            }
            className="w-full h-40 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-mono focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-100"
          />
          <p className="mt-1.5 text-xs text-zinc-500">
            <span className="font-medium">Suggerimento formato:</span> {formatHints[selectedType]}. Dimensione massima: {MAX_FILE_SIZE_MB} MB.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => handleImport(true)}
            disabled={!csvContent.trim() || importing}
            className="flex items-center gap-2 rounded-xl border border-lime-200 px-4 py-2.5 text-sm font-medium text-lime-700 hover:bg-lime-50 disabled:opacity-50 transition-colors"
          >
            <CheckCircle className="h-4 w-4" /> Valida (Dry Run)
          </button>
          <button
            onClick={() => handleImport(false)}
            disabled={!csvContent.trim() || importing}
            className="flex items-center gap-2 rounded-xl bg-lime-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-lime-700 disabled:opacity-50 transition-colors"
          >
            {importing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Importa
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className={`mt-4 rounded-xl border p-4 ${result.errorRows > 0 ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"}`}>
            <div className="flex items-center gap-2 mb-2">
              {result.errorRows > 0 ? (
                <AlertCircle className="h-5 w-5 text-amber-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              <span className="font-medium">
                {result.status === "completed"
                  ? `Import completato: ${result.successRows} righe importate`
                  : `Validazione: ${result.successRows} righe valide`}
              </span>
            </div>
            {result.errorRows > 0 && (
              <p className="text-sm text-amber-700">{result.errorRows} righe con errori</p>
            )}
          </div>
        )}
      </div>

      {/* Import History */}
      <div className="rounded-2xl border border-lime-100 bg-white">
        <div className="border-b border-lime-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-lime-950">Storico Import</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-zinc-500">
                <th className="px-6 py-3 font-medium">File</th>
                <th className="px-6 py-3 font-medium">Tipo</th>
                <th className="px-6 py-3 font-medium">Righe</th>
                <th className="px-6 py-3 font-medium">Successo</th>
                <th className="px-6 py-3 font-medium">Errori</th>
                <th className="px-6 py-3 font-medium">Stato</th>
                <th className="px-6 py-3 font-medium">Data</th>
                <th className="px-6 py-3 font-medium">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-zinc-400">
                    Nessun import eseguito. Usa il wizard qui sopra per importare i dati della CER.
                  </td>
                </tr>
              ) : (
                jobs.map(job => (
                  <tr key={job.id} className="border-b border-zinc-50 hover:bg-lime-50/50">
                    <td className="px-6 py-3 font-medium text-lime-950">{job.fileName}</td>
                    <td className="px-6 py-3">{importTypeLabels[job.type] || job.type}</td>
                    <td className="px-6 py-3">{job.totalRows}</td>
                    <td className="px-6 py-3 text-green-600">{job.successRows}</td>
                    <td className="px-6 py-3 text-red-600">{job.errorRows}</td>
                    <td className="px-6 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${job.status === "completed" ? "bg-green-100 text-green-700" : job.status === "rolled_back" ? "bg-zinc-100 text-zinc-700" : "bg-amber-100 text-amber-700"}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-zinc-500">{new Date(job.createdAt).toLocaleDateString("it-IT")}</td>
                    <td className="px-6 py-3">
                      {job.status === "completed" && (
                        <button className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800">
                          <RotateCcw className="h-3 w-3" /> Annulla
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Templates */}
      <div className="rounded-2xl border border-lime-100 bg-white p-6">
        <h2 className="text-lg font-semibold text-lime-950 mb-4">Template di Import</h2>
        <p className="text-sm text-zinc-500 mb-4">
          Scarica i template CSV per preparare i dati prima dell&apos;importazione.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { type: "members", desc: "Nome, POD, Tipo, Comune, Data Adesione" },
            { type: "energy_data", desc: "POD, Mese, Consumo kWh, Produzione kWh" },
            { type: "financial", desc: "Nome, Periodo, Importo, Tipo" },
          ].map(t => (
            <button
              key={t.type}
              type="button"
              onClick={() => downloadTemplateCsv(t.type)}
              className="flex items-center gap-3 rounded-xl border border-zinc-100 p-4 text-left transition hover:border-lime-200 hover:bg-lime-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400"
            >
              <FileSpreadsheet className="h-8 w-8 text-lime-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-lime-950">{importTypeLabels[t.type]}</p>
                <p className="text-xs text-zinc-500">{t.desc}</p>
              </div>
              <Download className="h-4 w-4 text-lime-600 shrink-0" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
