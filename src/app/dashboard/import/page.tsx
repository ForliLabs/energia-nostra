"use client";

import { useState, useEffect } from "react";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, ArrowRight, RotateCcw, RefreshCw } from "lucide-react";

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

export default function ImportPage() {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [onboarding, setOnboarding] = useState<{ steps: OnboardingStep[]; completionPct: number } | null>(null);
  const [selectedType, setSelectedType] = useState<string>("members");
  const [csvContent, setCsvContent] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportJob | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/import").then(r => r.json()),
      fetch("/api/onboarding").then(r => r.json()),
    ]).then(([jobsData, onboardingData]) => {
      setJobs(jobsData.jobs || []);
      setOnboarding(onboardingData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

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
      const parseData = await parseRes.json();

      // Step 2: Auto-detect columns
      const detectRes = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "auto-detect", headers: parseData.headers, type: selectedType }),
      });
      const detectData = await detectRes.json();

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
      const execData = await execRes.json();
      setResult(execData);
      if (!dryRun) {
        setJobs(prev => [execData, ...prev]);
      }
    } catch (err) {
      console.error("Import error:", err);
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-8 w-8 animate-spin text-lime-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-lime-950">Importazione Dati</h1>
        <p className="text-zinc-500 mt-1">Importa membri, dati energetici e finanziari da Excel/CSV.</p>
      </div>

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
                onClick={() => setSelectedType(type)}
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
          <label className="text-sm font-medium text-zinc-700 mb-2 block">Dati CSV</label>
          <textarea
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
            <div key={t.type} className="flex items-center gap-3 rounded-xl border border-zinc-100 p-4">
              <FileSpreadsheet className="h-8 w-8 text-lime-500" />
              <div>
                <p className="text-sm font-medium text-lime-950">{importTypeLabels[t.type]}</p>
                <p className="text-xs text-zinc-500">{t.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-400 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
