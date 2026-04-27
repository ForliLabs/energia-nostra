"use client";

import { useEffect, useState } from "react";
import { Folder, FileText, Upload, Download, Trash2, Search, HardDrive, RefreshCw } from "lucide-react";

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
  const [folders, setFolders] = useState<FolderSummary[]>([]);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (searchQuery) params.set("search", searchQuery);

    Promise.all([
      fetch("/api/storage?view=folders").then(r => r.json()),
      fetch(`/api/storage?${params}`).then(r => r.json()),
      fetch("/api/storage?view=stats").then(r => r.json()),
    ]).then(([foldersData, filesData, statsData]) => {
      setFolders(foldersData.folders || []);
      setFiles(filesData.files || []);
      setStats(statsData.stats || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [selectedCategory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-8 w-8 animate-spin text-lime-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-lime-950">Archivio Documenti</h1>
          <p className="text-zinc-500 mt-1">Gestione file e documenti della CER con archiviazione S3.</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-lime-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-lime-700 transition-colors">
          <Upload className="h-4 w-4" /> Carica File
        </button>
      </div>

      {/* Storage Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-lime-100 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-lime-50 p-2.5"><FileText className="h-5 w-5 text-lime-600" /></div>
              <div>
                <p className="text-sm text-zinc-500">File Totali</p>
                <p className="text-xl font-bold text-lime-950">{stats.totalFiles}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-lime-100 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-lime-50 p-2.5"><HardDrive className="h-5 w-5 text-lime-600" /></div>
              <div>
                <p className="text-sm text-zinc-500">Spazio Utilizzato</p>
                <p className="text-xl font-bold text-lime-950">{stats.totalSizeMb} MB</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-lime-100 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-lime-50 p-2.5"><HardDrive className="h-5 w-5 text-lime-600" /></div>
              <div>
                <p className="text-sm text-zinc-500">Quota Utilizzata</p>
                <p className="text-xl font-bold text-lime-950">{stats.quotaUsedPct}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Folders Grid */}
      <div>
        <h2 className="text-lg font-semibold text-lime-950 mb-4">Cartelle</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${!selectedCategory ? "border-lime-300 bg-lime-50" : "border-lime-100 bg-white hover:bg-lime-50/50"}`}
          >
            <Folder className="h-8 w-8 text-lime-500" />
            <div>
              <p className="text-sm font-medium text-lime-950">Tutti i File</p>
              <p className="text-xs text-zinc-500">{folders.reduce((s, f) => s + f.fileCount, 0)} file</p>
            </div>
          </button>
          {folders.map((folder) => (
            <button
              key={folder.category}
              onClick={() => setSelectedCategory(folder.category)}
              className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${selectedCategory === folder.category ? "border-lime-300 bg-lime-50" : "border-lime-100 bg-white hover:bg-lime-50/50"}`}
            >
              <span className="text-2xl">{folder.icon}</span>
              <div>
                <p className="text-sm font-medium text-lime-950">{folder.label}</p>
                <p className="text-xs text-zinc-500">{folder.fileCount} file · {formatFileSize(folder.totalSizeBytes)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Cerca file per nome..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 py-2.5 text-sm focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-100"
        />
      </div>

      {/* Files Table */}
      <div className="rounded-2xl border border-lime-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-zinc-500">
                <th className="px-6 py-3 font-medium">Nome File</th>
                <th className="px-6 py-3 font-medium">Categoria</th>
                <th className="px-6 py-3 font-medium">Dimensione</th>
                <th className="px-6 py-3 font-medium">Versione</th>
                <th className="px-6 py-3 font-medium">Data</th>
                <th className="px-6 py-3 font-medium">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {files.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-zinc-300" />
                    <p>Nessun file. Carica documenti per iniziare a costruire l&apos;archivio CER.</p>
                  </td>
                </tr>
              ) : (
                files.map((file) => (
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
                        <button className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-lime-600">
                          <Download className="h-4 w-4" />
                        </button>
                        <button className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
