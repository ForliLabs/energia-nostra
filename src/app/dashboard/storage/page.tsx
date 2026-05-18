"use client";

import { Download, FileText, Folder, HardDrive, Search, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast-provider";

interface FolderSummary {
  category: string;
  label: string;
  icon: string;
  fileCount: number;
  totalSizeBytes: number;
}

interface StorageFile {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  category: string;
  version: number;
  createdAt: string;
}

interface StorageStats {
  configured: boolean;
  totalFiles: number;
  totalSizeMb: number;
  quotaUsedPct: number;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function StoragePage() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [folders, setFolders] = useState<FolderSummary[]>([]);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (searchQuery) params.set("search", searchQuery);

    try {
      const [foldersResponse, filesResponse, statsResponse] = await Promise.all([
        fetch("/api/storage?view=folders"),
        fetch(`/api/storage?${params.toString()}`),
        fetch("/api/storage?view=stats"),
      ]);
      const foldersData = (await foldersResponse.json()) as { folders?: FolderSummary[]; error?: string };
      const filesData = (await filesResponse.json()) as { files?: StorageFile[]; error?: string };
      const statsData = (await statsResponse.json()) as { stats?: StorageStats; error?: string };

      if (!foldersResponse.ok || !filesResponse.ok || !statsResponse.ok) {
        throw new Error(foldersData.error || filesData.error || statsData.error || "Impossibile caricare l'archivio.");
      }

      setFolders(foldersData.folders || []);
      setFiles(filesData.files || []);
      setConfirmDeleteId(null);
      setStats(statsData.stats || null);
    } catch (caughtError) {
      setError((caughtError as Error).message);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchData]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const uploadCategory = (selectedCategory || "atti") as string;
    setUploading(true);
    try {
      const presignResponse = await fetch("/api/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "presign-upload", category: uploadCategory, fileName: file.name, mimeType: file.type || "application/octet-stream" }),
      });
      const presignData = (await presignResponse.json()) as { error?: string; url?: string; method?: string };
      if (!presignResponse.ok || !presignData.url) {
        throw new Error(presignData.error || "Impossibile preparare l'upload.");
      }

      const uploadResponse = await fetch(presignData.url, {
        method: presignData.method || "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!uploadResponse.ok) {
        throw new Error("Il caricamento verso lo storage non è andato a buon fine.");
      }

      const registerResponse = await fetch("/api/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", category: uploadCategory, fileName: file.name, mimeType: file.type || "application/octet-stream", sizeBytes: file.size }),
      });
      const registerData = (await registerResponse.json()) as { error?: string };
      if (!registerResponse.ok) {
        throw new Error(registerData.error || "Impossibile registrare il file caricato.");
      }

      showToast({ title: "File caricato", description: `${file.name} è ora disponibile nell'archivio.`, variant: "success" });
      await fetchData();
    } catch (caughtError) {
      showToast({ title: "Upload non riuscito", description: (caughtError as Error).message, variant: "error" });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleDownload = async (objectId: string) => {
    try {
      const response = await fetch(`/api/storage?view=download&objectId=${objectId}`);
      const payload = (await response.json()) as { error?: string; url?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Impossibile generare il link di download.");
      }
      window.open(payload.url, "_blank", "noopener,noreferrer");
    } catch (caughtError) {
      showToast({ title: "Download non riuscito", description: (caughtError as Error).message, variant: "error" });
    }
  };

  const handleDelete = async (objectId: string) => {
    try {
      const response = await fetch("/api/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", objectId }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Impossibile eliminare il file.");
      }
      showToast({ title: "File rimosso", description: "L'archivio è stato aggiornato.", variant: "success" });
      setConfirmDeleteId(null);
      await fetchData();
    } catch (caughtError) {
      showToast({ title: "Eliminazione non riuscita", description: (caughtError as Error).message, variant: "error" });
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Archivio CER"
        title="Archivio documenti e storage"
        description="Ricerca rapida, cartelle tematiche e azioni operative finalmente collegate ai pulsanti di upload, download ed eliminazione."
        actions={
          <>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 rounded-xl bg-lime-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-lime-700 disabled:opacity-60"
            >
              <Upload className="h-4 w-4" /> {uploading ? "Caricamento..." : "Carica file"}
            </button>
          </>
        }
      />

      {stats && !stats.configured ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-zinc-700">
          Lo storage S3 non è configurato: puoi navigare l&apos;archivio esistente, ma per nuovi upload serve impostare S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET e S3_REGION.
        </div>
      ) : null}

      {loading ? <p className="text-sm text-zinc-500">Caricamento archivio...</p> : null}
      {error ? <EmptyState title="Impossibile caricare l'archivio" description={error} /> : null}

      {stats ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-lime-100 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-lime-50 p-2.5"><FileText className="h-5 w-5 text-lime-600" /></div>
              <div>
                <p className="text-sm text-zinc-500">File totali</p>
                <p className="text-xl font-bold text-lime-950">{stats.totalFiles}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-lime-100 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-lime-50 p-2.5"><HardDrive className="h-5 w-5 text-lime-600" /></div>
              <div>
                <p className="text-sm text-zinc-500">Spazio utilizzato</p>
                <p className="text-xl font-bold text-lime-950">{stats.totalSizeMb} MB</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-lime-100 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-lime-50 p-2.5"><HardDrive className="h-5 w-5 text-lime-600" /></div>
              <div>
                <p className="text-sm text-zinc-500">Quota utilizzata</p>
                <p className="text-xl font-bold text-lime-950">{stats.quotaUsedPct}%</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div>
        <h2 className="mb-4 text-lg font-semibold text-lime-950">Cartelle</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button onClick={() => setSelectedCategory(null)} className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${!selectedCategory ? "border-lime-300 bg-lime-50" : "border-lime-100 bg-white hover:bg-lime-50/50"}`}>
            <Folder className="h-8 w-8 text-lime-500" />
            <div>
              <p className="text-sm font-medium text-lime-950">Tutti i file</p>
              <p className="text-xs text-zinc-500">{folders.reduce((sum, folder) => sum + folder.fileCount, 0)} file</p>
            </div>
          </button>
          {folders.map((folder) => (
            <button key={folder.category} onClick={() => setSelectedCategory(folder.category)} className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${selectedCategory === folder.category ? "border-lime-300 bg-lime-50" : "border-lime-100 bg-white hover:bg-lime-50/50"}`}>
              <span className="text-2xl">{folder.icon}</span>
              <div>
                <p className="text-sm font-medium text-lime-950">{folder.label}</p>
                <p className="text-xs text-zinc-500">{folder.fileCount} file · {formatFileSize(folder.totalSizeBytes)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <label className="relative block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Cerca file per nome..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-100"
        />
      </label>

      <div className="rounded-2xl border border-lime-100 bg-white">
        <div className="overflow-x-auto">
          {files.length === 0 ? (
            <div className="px-6 py-10">
              <EmptyState
                title="Nessun file disponibile"
                description="Carica documenti per iniziare a costruire l'archivio CER oppure cambia cartella/filtro per vedere i contenuti già registrati."
              />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-zinc-500">
                  <th className="px-6 py-3 font-medium">Nome file</th>
                  <th className="px-6 py-3 font-medium">Categoria</th>
                  <th className="px-6 py-3 font-medium">Dimensione</th>
                  <th className="px-6 py-3 font-medium">Versione</th>
                  <th className="px-6 py-3 font-medium">Data</th>
                  <th className="px-6 py-3 font-medium">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.id} className="border-b border-zinc-50 hover:bg-lime-50/50">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-zinc-400" />
                        <span className="font-medium text-lime-950">{file.fileName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-zinc-500">{file.category}</td>
                    <td className="px-6 py-3 text-zinc-500">{formatFileSize(file.sizeBytes)}</td>
                    <td className="px-6 py-3"><span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs">v{file.version}</span></td>
                    <td className="px-6 py-3 text-zinc-500">{new Date(file.createdAt).toLocaleDateString("it-IT")}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => void handleDownload(file.id)} className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-lime-600" aria-label={`Scarica ${file.fileName}`}>
                          <Download className="h-4 w-4" />
                        </button>
                        {confirmDeleteId === file.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { setConfirmDeleteId(null); void handleDelete(file.id); }}
                              className="rounded-lg px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                            >
                              Elimina
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded-lg px-2 py-1 text-xs text-zinc-500 transition hover:bg-zinc-100"
                              aria-label="Annulla eliminazione"
                            >
                              Annulla
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(file.id)}
                            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-red-600"
                            aria-label={`Elimina ${file.fileName}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
