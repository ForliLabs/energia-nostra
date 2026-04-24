"use client";

import { FileSignature, FileText, PenTool, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import type { DocumentTemplateInfo, GeneratedDocumentInfo, SignatureInfo } from "@/lib/documents";

interface DocumentsResponse {
  templates: DocumentTemplateInfo[];
  documents: GeneratedDocumentInfo[];
}

const documentStatusClasses: Record<string, string> = {
  draft: "bg-amber-100 text-amber-800",
  review: "bg-sky-100 text-sky-700",
  signing: "bg-violet-100 text-violet-700",
  signed: "bg-lime-100 text-lime-800",
};

const documentStatusLabels: Record<string, string> = {
  draft: "Bozza",
  review: "Review",
  signing: "Firma in corso",
  signed: "Firmato",
};

const signatureStatusClasses: Record<string, string> = {
  draft: "bg-amber-100 text-amber-800",
  sent: "bg-sky-100 text-sky-700",
  signing: "bg-violet-100 text-violet-700",
  signed: "bg-lime-100 text-lime-800",
};

const signatureStatusLabels: Record<string, string> = {
  draft: "Bozza",
  sent: "Inviata",
  signing: "In firma",
  signed: "Firmata",
};

const formatDate = (value: string) => new Date(value).toLocaleDateString("it-IT");

function renderSignatureStatus(signatures: SignatureInfo[]) {
  if (signatures.length === 0) {
    return <span className="text-zinc-500">Nessuna firma richiesta</span>;
  }

  return (
    <div className="space-y-2">
      {signatures.map((signature) => (
        <div key={signature.id} className="rounded-xl bg-amber-50 px-3 py-2">
          <p className="font-medium text-zinc-700">{signature.signerName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${signatureStatusClasses[signature.status] ?? "bg-amber-100 text-amber-800"}`}>
              {signatureStatusLabels[signature.status] ?? signature.status}
            </span>
            {signature.signedAt && <span className="text-xs text-zinc-500">{formatDate(signature.signedAt)}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DocumentsPage() {
  const [data, setData] = useState<DocumentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    Promise.resolve().then(async () => {
      try {
        const response = await fetch("/api/documents");
        if (!response.ok) {
          throw new Error("Impossibile recuperare i documenti.");
        }
        const payload = (await response.json()) as DocumentsResponse;
        if (active) {
          setData(payload);
          setError(null);
        }
      } catch {
        if (active) {
          setError("Impossibile caricare documenti e template.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-amber-200 bg-white/90 p-8 shadow-lg shadow-amber-100/40">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">Document workflow CER</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">Documenti &amp; Firma Digitale</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600">
          Gestione template, generazione documenti e monitoraggio del processo di firma elettronica per la comunità.
        </p>
      </section>

      {loading && !data && <p className="text-sm text-zinc-500">Caricamento...</p>}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {data && (
        <>
          <section className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-amber-700" />
              <h2 className="text-lg font-semibold text-amber-900">Template disponibili</h2>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {data.templates.map((template) => (
                <article key={template.id} className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-zinc-700">{template.category}</p>
                      <h3 className="mt-2 text-lg font-semibold text-zinc-950">{template.name}</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-lime-100 text-lime-800">v{template.version}</span>
                  </div>
                  <p className="mt-4 text-sm text-zinc-600">Template attivo pronto per la generazione documentale.</p>
                  <button
                    type="button"
                    className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
                  >
                    <PenTool className="h-4 w-4" />
                    Genera da template
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <FileSignature className="h-5 w-5 text-amber-700" />
              <h2 className="text-lg font-semibold text-amber-900">Documenti generati</h2>
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full divide-y divide-amber-100 text-sm">
                <thead>
                  <tr className="text-left text-zinc-500">
                    <th className="pb-3 pr-4 font-semibold">Documento</th>
                    <th className="pb-3 pr-4 font-semibold">Template</th>
                    <th className="pb-3 pr-4 font-semibold">Stato</th>
                    <th className="pb-3 pr-4 font-semibold">Firma digitale</th>
                    <th className="pb-3 font-semibold">Generato il</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {data.documents.map((document: GeneratedDocumentInfo) => (
                    <tr key={document.id} className="align-top">
                      <td className="py-4 pr-4 font-semibold text-zinc-950">{document.title}</td>
                      <td className="py-4 pr-4 text-zinc-700">{document.templateName}</td>
                      <td className="py-4 pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${documentStatusClasses[document.status] ?? "bg-amber-100 text-amber-800"}`}>
                          {documentStatusLabels[document.status] ?? document.status}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-zinc-700">{renderSignatureStatus(document.signatures)}</td>
                      <td className="py-4 text-zinc-600">{formatDate(document.generatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-amber-700" />
              <h2 className="text-lg font-semibold text-amber-900">Monitor firma</h2>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {data.documents.map((document) => (
                <article key={`${document.id}-signatures`} className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                  <h3 className="font-semibold text-zinc-950">{document.title}</h3>
                  <p className="mt-2 text-sm text-zinc-600">
                    {document.signatures.length > 0
                      ? `${document.signatures.filter((signature) => signature.status === "signed").length}/${document.signatures.length} firme completate`
                      : "Nessun firmatario configurato"}
                  </p>
                  <div className="mt-4 space-y-2">{renderSignatureStatus(document.signatures)}</div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
