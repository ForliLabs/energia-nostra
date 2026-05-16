"use client";

import { FileSignature, FileText, PenTool, Search, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DocumentTemplateInfo, GeneratedDocumentInfo, SignatureInfo } from "@/lib/documents";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast-provider";

interface DocumentsResponse {
  templates: DocumentTemplateInfo[];
  documents: GeneratedDocumentInfo[];
}

interface SessionUser {
  name: string;
  email: string;
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
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${signatureStatusClasses[signature.status] ?? "bg-amber-100 text-amber-800"}`}>
              {signatureStatusLabels[signature.status] ?? signature.status}
            </span>
            {signature.signedAt ? <span className="text-xs text-zinc-500">{formatDate(signature.signedAt)}</span> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DocumentsPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<DocumentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [busyTemplateId, setBusyTemplateId] = useState<string | null>(null);
  const [busyDocumentId, setBusyDocumentId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [documentsResponse, sessionResponse] = await Promise.all([fetch("/api/documents"), fetch("/api/auth/session")]);
      const payload = (await documentsResponse.json()) as DocumentsResponse & { error?: string };
      if (!documentsResponse.ok) {
        throw new Error(payload.error || "Impossibile recuperare i documenti.");
      }
      setData({ templates: payload.templates || [], documents: payload.documents || [] });

      if (sessionResponse.ok) {
        const sessionPayload = (await sessionResponse.json()) as { user?: SessionUser };
        setCurrentUser(sessionPayload.user || null);
      } else {
        setCurrentUser(null);
      }
    } catch (caughtError) {
      setError((caughtError as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  const filteredTemplates = useMemo(
    () => data?.templates.filter((template) => `${template.name} ${template.category}`.toLowerCase().includes(query.toLowerCase())) || [],
    [data, query],
  );
  const filteredDocuments = useMemo(
    () =>
      (data?.documents || []).filter((document) => {
        const matchesQuery = `${document.title} ${document.templateName}`.toLowerCase().includes(query.toLowerCase());
        const matchesStatus = statusFilter === "all" || document.status === statusFilter;
        return matchesQuery && matchesStatus;
      }),
    [data, query, statusFilter],
  );

  const handleGenerate = async (templateId: string) => {
    setBusyTemplateId(templateId);
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", templateId }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Impossibile generare il documento.");
      }
      showToast({ title: "Documento generato", description: "La bozza è disponibile nella lista documenti generati.", variant: "success" });
      await loadData();
    } catch (caughtError) {
      showToast({ title: "Generazione non riuscita", description: (caughtError as Error).message, variant: "error" });
    } finally {
      setBusyTemplateId(null);
    }
  };

  const handleRequestSignatures = async (documentId: string) => {
    setBusyDocumentId(documentId);
    try {
      const signers = [
        { name: currentUser?.name || "Amministratore CER", email: currentUser?.email || "admin@energianostra.it" },
        { name: "Segreteria CER", email: "segreteria@energianostra.it" },
      ];
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request-signatures", documentId, signers }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Impossibile avviare la firma.");
      }
      showToast({ title: "Firma avviata", description: "La richiesta è stata inviata ai firmatari configurati.", variant: "success" });
      await loadData();
    } catch (caughtError) {
      showToast({ title: "Invio firme non riuscito", description: (caughtError as Error).message, variant: "error" });
    } finally {
      setBusyDocumentId(null);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Document workflow CER"
        title="Documenti & Firma Digitale"
        description="Dai template attivi alle firme elettroniche: i pulsanti principali ora accompagnano il team lungo tutto il flusso documentale senza passaggi manuali nascosti."
        actions={
          <label className="relative block w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cerca template o documento"
              className="w-full rounded-2xl border border-lime-200 bg-white pl-10 pr-4 py-3 text-sm outline-none transition focus:border-lime-500"
            />
          </label>
        }
      />

      {loading ? (
        <div className="space-y-6">
          {/* Template cards skeleton */}
          <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 rounded-full bg-zinc-200/80 animate-pulse" aria-hidden="true" />
              <div className="h-5 w-40 rounded-2xl bg-zinc-200/80 animate-pulse" aria-hidden="true" />
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-amber-100 bg-amber-50 p-5 space-y-3">
                  <div className="h-3 w-20 rounded-full bg-zinc-200/80 animate-pulse" aria-hidden="true" />
                  <div className="h-5 w-40 rounded-2xl bg-zinc-200/80 animate-pulse" aria-hidden="true" />
                  <div className="h-3 w-full rounded-full bg-zinc-200/80 animate-pulse" aria-hidden="true" />
                  <div className="h-8 w-36 rounded-2xl bg-zinc-200/80 animate-pulse" aria-hidden="true" />
                </div>
              ))}
            </div>
          </div>
          {/* Documents table skeleton */}
          <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-5 w-5 rounded-full bg-zinc-200/80 animate-pulse" aria-hidden="true" />
              <div className="h-5 w-44 rounded-2xl bg-zinc-200/80 animate-pulse" aria-hidden="true" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="grid grid-cols-6 gap-3">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <div key={j} className="h-10 rounded-2xl bg-zinc-200/80 animate-pulse" aria-hidden="true" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {error ? <EmptyState title="Impossibile caricare documenti e template" description={error} /> : null}

      {data ? (
        <>
          <section className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-amber-700" />
              <h2 className="text-lg font-semibold text-amber-900">Template disponibili</h2>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {filteredTemplates.length === 0 ? (
                <div className="lg:col-span-2 xl:col-span-3">
                  <EmptyState title="Nessun template trovato" description="Prova a cambiare ricerca per vedere i modelli disponibili nella tua CER." />
                </div>
              ) : (
                filteredTemplates.map((template) => (
                  <article key={template.id} className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-zinc-700">{template.category}</p>
                        <h3 className="mt-2 text-lg font-semibold text-zinc-950">{template.name}</h3>
                      </div>
                      <span className="rounded-full bg-lime-100 px-2 py-0.5 text-xs font-medium text-lime-800">v{template.version}</span>
                    </div>
                    <p className="mt-4 text-sm text-zinc-600">Il documento verrà generato con variabili CER precompilate e placeholder residui risolti automaticamente.</p>
                    <button
                      type="button"
                      onClick={() => void handleGenerate(template.id)}
                      disabled={busyTemplateId !== null}
                      className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-60"
                    >
                      <PenTool className="h-4 w-4" />
                      {busyTemplateId === template.id ? "Generazione..." : "Genera da template"}
                    </button>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <FileSignature className="h-5 w-5 text-amber-700" />
                <h2 className="text-lg font-semibold text-amber-900">Documenti generati</h2>
              </div>
              {/* Status filter tabs */}
              <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filtra per stato documento">
                {(
                  [
                    { value: "all", label: "Tutti" },
                    { value: "draft", label: "Bozza" },
                    { value: "review", label: "Review" },
                    { value: "signing", label: "Firma in corso" },
                    { value: "signed", label: "Firmato" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    role="tab"
                    aria-selected={statusFilter === tab.value}
                    onClick={() => setStatusFilter(tab.value)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      statusFilter === tab.value
                        ? "bg-amber-700 text-white"
                        : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            {filteredDocuments.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  title={statusFilter !== "all" ? `Nessun documento con stato "${documentStatusLabels[statusFilter] ?? statusFilter}"` : "Nessun documento generato"}
                  description={
                    statusFilter !== "all"
                      ? "Prova a cambiare filtro o cerca con altri termini per trovare i documenti."
                      : "Genera il primo documento da template per avviare il workflow di review e firma digitale."
                  }
                />
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full divide-y divide-amber-100 text-sm">
                  <thead>
                    <tr className="text-left text-zinc-500">
                      <th className="pb-3 pr-4 font-semibold">Documento</th>
                      <th className="pb-3 pr-4 font-semibold">Template</th>
                      <th className="pb-3 pr-4 font-semibold">Stato</th>
                      <th className="pb-3 pr-4 font-semibold">Firma digitale</th>
                      <th className="pb-3 pr-4 font-semibold">Generato il</th>
                      <th className="pb-3 font-semibold">Azione</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    {filteredDocuments.map((document) => (
                      <tr key={document.id} className="align-top">
                        <td className="py-4 pr-4 font-semibold text-zinc-950">{document.title}</td>
                        <td className="py-4 pr-4 text-zinc-700">{document.templateName}</td>
                        <td className="py-4 pr-4">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${documentStatusClasses[document.status] ?? "bg-amber-100 text-amber-800"}`}>
                            {documentStatusLabels[document.status] ?? document.status}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-zinc-700">{renderSignatureStatus(document.signatures)}</td>
                        <td className="py-4 pr-4 text-zinc-600">{formatDate(document.generatedAt)}</td>
                        <td className="py-4">
                          {document.signatures.length === 0 ? (
                            <button
                              type="button"
                              onClick={() => void handleRequestSignatures(document.id)}
                              disabled={busyDocumentId !== null}
                              className="rounded-2xl border border-lime-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-lime-50 disabled:opacity-60"
                            >
                              {busyDocumentId === document.id ? "Invio..." : "Avvia firma"}
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-lime-700">Firma già avviata</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-amber-700" />
              <h2 className="text-lg font-semibold text-amber-900">Monitor firma</h2>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {filteredDocuments.map((document) => (
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
      ) : null}
    </div>
  );
}
