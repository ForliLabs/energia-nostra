"use client";

import { Wifi, WifiOff, HardDrive, RefreshCw, Download } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FetchError } from "@/components/ui/fetch-error";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton, StatsSkeleton } from "@/components/ui/skeleton";

interface PwaStatus {
  serviceWorkerSupported: boolean;
  cacheStrategies: number;
  offlineCapable: boolean;
  indexedDbStores: string[];
  syncTag: string;
  version: string;
}

export default function OfflinePwaPage() {
  const [status, setStatus] = useState<PwaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [swRegistered, setSwRegistered] = useState(false);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const r = await fetch("/api/offline-pwa");
      if (!r.ok) throw new Error(`Errore ${r.status}`);
      setStatus(await r.json());
    } catch (e) {
      setError((e as Error).message || "Impossibile caricare lo stato PWA.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => setSwRegistered(!!reg));
    }

    const timer = window.setTimeout(() => { void fetchData(); }, 0);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="App" title="PWA e Modalità Offline" description="Service Worker, cache offline, sincronizzazione dati e installazione app" />
        <StatsSkeleton count={4} />
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm">
          <Skeleton className="h-6 w-56 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="App" title="PWA e Modalità Offline" description="Service Worker, cache offline, sincronizzazione dati e installazione app" />
        <FetchError
          title="Impossibile caricare lo stato PWA"
          description="Verifica la connessione e riprova."
          errorDetail={error}
          onRetry={() => { setLoading(true); void fetchData(); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="App"
        title="PWA e Modalità Offline"
        description="Service Worker, cache offline, sincronizzazione dati e installazione app"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi className="h-5 w-5 text-lime-600" /> : <WifiOff className="h-5 w-5 text-red-600" />}
            <span className="text-sm text-zinc-500">Connessione</span>
          </div>
          <p className={`text-xl font-bold mt-2 ${isOnline ? "text-lime-700" : "text-red-600"}`}>{isOnline ? "Online" : "Offline"}</p>
        </div>
        <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center gap-2"><HardDrive className="h-5 w-5 text-amber-600" /><span className="text-sm text-zinc-500">Service Worker</span></div>
          <p className={`text-xl font-bold mt-2 ${swRegistered ? "text-lime-700" : "text-amber-600"}`}>{swRegistered ? "Attivo" : "Non registrato"}</p>
        </div>
        <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center gap-2"><RefreshCw className="h-5 w-5 text-amber-500" /><span className="text-sm text-zinc-500">Strategie cache</span></div>
          <p className="text-xl font-bold text-zinc-950 mt-2">{status?.cacheStrategies ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center gap-2"><Download className="h-5 w-5 text-lime-600" /><span className="text-sm text-zinc-500">Versione</span></div>
          <p className="text-xl font-bold text-zinc-950 mt-2">{status?.version ?? "—"}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
        <h2 className="text-xl font-bold text-zinc-950 mb-5">Database Locale (IndexedDB)</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {(status?.indexedDbStores ?? []).map((store) => (
            <div key={store} className="flex items-center gap-2 p-3 bg-zinc-50/80 rounded-2xl border border-zinc-100">
              <HardDrive className="h-4 w-4 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-900">{store}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
        <h2 className="text-xl font-bold text-zinc-950 mb-5">Strategie di Cache</h2>
        <div className="space-y-2">
          {[
            { route: "Risorse statiche", strategy: "Cache First", desc: "Caricamento istantaneo da cache locale" },
            { route: "Dati energia", strategy: "Network First", desc: "Dati aggiornati quando online, cache quando offline" },
            { route: "Pagine dashboard", strategy: "Stale While Revalidate", desc: "Mostra cache immediatamente, aggiorna in background" },
            { route: "Upload contatori", strategy: "Network Only + Queue", desc: "Accoda offline, invia automaticamente al ripristino connessione" },
            { route: "Notifiche", strategy: "Stale While Revalidate", desc: "Lettura rapida con aggiornamento silenzioso" },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-zinc-50/80 rounded-2xl">
              <div className="w-48"><span className="font-semibold text-sm text-zinc-900">{s.route}</span></div>
              <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 whitespace-nowrap">{s.strategy}</span>
              <span className="text-sm text-zinc-500">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
        <h2 className="text-xl font-bold text-zinc-950 mb-5">Installazione PWA</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { platform: "Android", instructions: "Tocca il menu del browser → 'Aggiungi alla schermata Home'" },
            { platform: "iOS", instructions: "Tocca l'icona di condivisione → 'Aggiungi alla schermata Home'" },
            { platform: "Desktop", instructions: "Clicca l'icona di installazione nella barra degli indirizzi" },
          ].map((p) => (
            <div key={p.platform} className="p-5 bg-zinc-50/80 rounded-2xl border border-zinc-100">
              <p className="font-semibold text-zinc-900 mb-2">{p.platform}</p>
              <p className="text-sm text-zinc-600">{p.instructions}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
        <h2 className="text-xl font-bold text-zinc-950 mb-5">Sincronizzazione Offline</h2>
        <div className="space-y-3">
          {[
            { feature: "Letture contatore", desc: "I dati inseriti offline vengono accodati e inviati al ripristino della connessione", status: "Attivo" },
            { feature: "Voti assembleari", desc: "I voti offline vengono registrati localmente e sincronizzati", status: "Attivo" },
            { feature: "Dashboard cache", desc: "I grafici mostrano gli ultimi dati disponibili anche senza rete", status: "Attivo" },
            { feature: "Risoluzione conflitti", desc: "In caso di modifica simultanea, il server ha priorità con notifica utente", status: "Server-wins" },
          ].map((f, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-zinc-50/80 rounded-2xl border border-zinc-100">
              <div>
                <span className="font-semibold text-sm text-zinc-900">{f.feature}</span>
                <p className="text-xs text-zinc-500 mt-0.5">{f.desc}</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs bg-lime-100 text-lime-700 shrink-0 ml-3">{f.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
