"use client";

import { useState, useCallback } from "react";
import type { ValidationResult } from "@/lib/meter-pipeline";

type UploadState = "idle" | "uploading" | "success" | "error";

export default function MeterDataPage() {
  const [state, setState] = useState<UploadState>("idle");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const uploadCsv = useCallback(async (file: File) => {
    setState("uploading");
    setErrorMsg(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/meter-upload", { method: "POST", body: formData });
      const data: unknown = await res.json();

      if (!res.ok) {
        setState("error");
        setErrorMsg((data as { error?: string })?.error || "Errore durante il caricamento.");
        return;
      }

      setState("success");
      setResult(data as ValidationResult);
    } catch {
      setState("error");
      setErrorMsg("Impossibile raggiungere il server. Controlla la connessione di rete e riprova. Se il problema persiste, contatta l'amministratore CER.");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) {
        uploadCsv(file);
      } else {
        setErrorMsg("Formato file non supportato. Carica un file con estensione .csv contenente le letture dei contatori.");
      }
    },
    [uploadCsv]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadCsv(file);
    },
    [uploadCsv]
  );

  const handleDemoUpload = useCallback(async () => {
    const demoCsv = `POD;Data;Consumo_kWh;Produzione_kWh
IT001E990000001;2025-04-01;320;640
IT001E990000002;2025-04-01;0;1240
IT001E990000003;2025-04-01;180;0
IT001E990000004;2025-04-01;320;0
IT001E990000005;2025-04-01;280;0
IT001E990000006;2025-04-01;0;980
IT001E990000007;2025-04-01;150;360
IT001E990000008;2025-04-01;180;320
IT001E990000009;2025-04-01;90;0
IT001E990000010;2025-04-01;260;0
INVALID_POD;2025-04-01;100;0
IT001E990000012;2025-04-01;200;310
IT001E990000013;2025-04-01;0;1520`;

    setState("uploading");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/meter-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: demoCsv }),
      });
      const data = (await res.json()) as ValidationResult;
      setState("success");
      setResult(data);
    } catch {
      setState("error");
      setErrorMsg("Impossibile raggiungere il server per l'upload demo. Controlla la connessione e riprova.");
    }
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-amber-200 bg-white/90 p-8 shadow-lg shadow-amber-100/40">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">Pipeline dati contatore</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
          Caricamento misure smart meter
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600">
          Carica file CSV con le letture dei contatori intelligenti. Il sistema valida i POD, rileva anomalie e prepara i dati per la contabilizzazione GSE.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-2xl font-bold text-zinc-950">Carica file CSV</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Formati supportati: e-distribuzione, ARERA standard. Colonne: POD, Data, Consumo, Produzione.
          </p>

          <div
            className={`mt-6 flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition ${
              dragOver
                ? "border-lime-500 bg-lime-50"
                : "border-lime-200 bg-amber-50/60 hover:border-lime-400"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("csv-input")?.click()}
          >
            <svg className="h-12 w-12 text-lime-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-4 text-sm font-semibold text-zinc-700">
              {state === "uploading" ? "Caricamento in corso..." : "Trascina qui il file CSV o clicca per selezionare"}
            </p>
            <p className="mt-1 text-xs text-zinc-500">Formato: CSV con separatore ; o ,</p>
            <input
              id="csv-input"
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>

          <button
            onClick={handleDemoUpload}
            disabled={state === "uploading"}
            className="mt-4 inline-flex items-center justify-center rounded-2xl border border-lime-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-amber-100 disabled:opacity-60"
          >
            Carica dati demo (13 letture)
          </button>

          {errorMsg && (
            <div role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p className="font-semibold">Caricamento non riuscito</p>
              <p className="mt-1">{errorMsg}</p>
              {state === "error" && (
                <button
                  type="button"
                  onClick={() => { setState("idle"); setErrorMsg(null); }}
                  className="mt-2 text-sm font-semibold text-red-800 underline hover:text-red-950"
                >
                  Riprova con un nuovo file
                </button>
              )}
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
            <h2 className="text-2xl font-bold text-zinc-950">Formato atteso</h2>
            <div className="mt-4 overflow-x-auto rounded-xl bg-zinc-50 p-4">
              <pre className="text-xs text-zinc-600">
{`POD;Data;Consumo_kWh;Produzione_kWh
IT001E990000001;2025-04-01;320;640
IT001E990000002;2025-04-01;0;1240`}
              </pre>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-zinc-600">
              <li>• <strong>POD</strong>: Codice punto di prelievo (validato vs registro)</li>
              <li>• <strong>Data</strong>: Formato YYYY-MM-DD o DD/MM/YYYY</li>
              <li>• <strong>Consumo</strong>: kWh prelevati dalla rete</li>
              <li>• <strong>Produzione</strong>: kWh immessi in rete (opzionale)</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-100 to-lime-100 p-8 shadow-lg shadow-amber-100/40">
            <h2 className="text-2xl font-bold text-zinc-950">Validazione automatica</h2>
            <ul className="mt-4 space-y-2 text-sm text-zinc-700">
              <li>✓ Verifica POD contro anagrafica membri</li>
              <li>✓ Rileva valori negativi o impossibili</li>
              <li>✓ Segnala consumi anomali (&gt;5.000 kWh)</li>
              <li>✓ Identifica produzione fuori range</li>
            </ul>
          </div>
        </section>
      </div>

      {result && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
              <p className="text-sm font-medium text-zinc-500">Record totali</p>
              <p className="mt-2 text-3xl font-bold text-zinc-950">{result.summary.totalRecords}</p>
            </div>
            <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
              <p className="text-sm font-medium text-zinc-500">Validi</p>
              <p className="mt-2 text-3xl font-bold text-lime-700">{result.summary.validCount}</p>
            </div>
            <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
              <p className="text-sm font-medium text-zinc-500">Anomalie</p>
              <p className="mt-2 text-3xl font-bold text-amber-700">{result.summary.anomalyCount}</p>
            </div>
            <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
              <p className="text-sm font-medium text-zinc-500">Errori parse</p>
              <p className="mt-2 text-3xl font-bold text-red-600">{result.summary.errorCount}</p>
            </div>
          </div>

          {result.anomalies.length > 0 && (
            <section className="rounded-3xl border border-amber-200 bg-white/90 p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-zinc-950">Anomalie rilevate</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-amber-100 text-sm">
                  <thead>
                    <tr className="text-left text-zinc-500">
                      <th className="pb-3 pr-4 font-semibold">POD</th>
                      <th className="pb-3 pr-4 font-semibold">Data</th>
                      <th className="pb-3 pr-4 font-semibold">Consumo</th>
                      <th className="pb-3 pr-4 font-semibold">Produzione</th>
                      <th className="pb-3 font-semibold">Anomalia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-50">
                    {result.anomalies.map((a, i) => (
                      <tr key={i}>
                        <td className="py-3 pr-4 font-mono text-xs">{a.podCode}</td>
                        <td className="py-3 pr-4 text-zinc-600">{a.timestamp}</td>
                        <td className="py-3 pr-4 text-zinc-600">{a.consumptionKwh} kWh</td>
                        <td className="py-3 pr-4 text-zinc-600">{a.productionKwh} kWh</td>
                        <td className="py-3 text-amber-700">{a.anomaly}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {result.valid.length > 0 && (
            <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-zinc-950">Record validati</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-lime-100 text-sm">
                  <thead>
                    <tr className="text-left text-zinc-500">
                      <th className="pb-3 pr-4 font-semibold">POD</th>
                      <th className="pb-3 pr-4 font-semibold">Data</th>
                      <th className="pb-3 pr-4 font-semibold">Consumo (kWh)</th>
                      <th className="pb-3 font-semibold">Produzione (kWh)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-lime-50">
                    {result.valid.map((r, i) => (
                      <tr key={i}>
                        <td className="py-3 pr-4 font-mono text-xs">{r.podCode}</td>
                        <td className="py-3 pr-4 text-zinc-600">{r.timestamp}</td>
                        <td className="py-3 pr-4 text-zinc-600">{r.consumptionKwh}</td>
                        <td className="py-3 text-zinc-600">{r.productionKwh}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
