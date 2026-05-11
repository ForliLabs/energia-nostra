"use client";

import { Wifi, WifiOff, HardDrive, RefreshCw, Download } from "lucide-react";
import { useEffect, useState } from "react";

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
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [swRegistered, setSwRegistered] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check SW registration
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => setSwRegistered(!!reg));
    }

    fetch("/api/offline-pwa")
      .then((r) => r.json())
      .then((d) => { setStatus(d); setLoading(false); })
      .catch(() => setLoading(false));

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">📱 PWA & Modalità Offline</h1>
        <p className="text-zinc-600 mt-1">Service Worker, cache offline, sincronizzazione dati e installazione app</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi className="h-5 w-5 text-green-600" /> : <WifiOff className="h-5 w-5 text-red-600" />}
            <span className="text-sm text-zinc-500">Connessione</span>
          </div>
          <p className={`text-xl font-bold mt-1 ${isOnline ? "text-green-600" : "text-red-600"}`}>{isOnline ? "Online" : "Offline"}</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-2"><HardDrive className="h-5 w-5 text-blue-600" /><span className="text-sm text-zinc-500">Service Worker</span></div>
          <p className={`text-xl font-bold mt-1 ${swRegistered ? "text-green-600" : "text-amber-600"}`}>{swRegistered ? "Attivo" : "Non registrato"}</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-2"><RefreshCw className="h-5 w-5 text-purple-600" /><span className="text-sm text-zinc-500">Strategie cache</span></div>
          <p className="text-xl font-bold mt-1">{status?.cacheStrategies ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-2"><Download className="h-5 w-5 text-amber-600" /><span className="text-sm text-zinc-500">Versione</span></div>
          <p className="text-xl font-bold mt-1">{status?.version ?? "—"}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold mb-4">🗄️ Database Locale (IndexedDB)</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {(status?.indexedDbStores ?? []).map((store) => (
            <div key={store} className="flex items-center gap-2 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
              <HardDrive className="h-4 w-4 text-zinc-400" />
              <span className="text-sm font-medium">{store}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold mb-4">📋 Strategie di Cache</h2>
        <div className="space-y-2">
          {[
            { route: "Risorse statiche", strategy: "Cache First", desc: "Caricamento istantaneo da cache locale" },
            { route: "Dati energia", strategy: "Network First", desc: "Dati aggiornati quando online, cache quando offline" },
            { route: "Pagine dashboard", strategy: "Stale While Revalidate", desc: "Mostra cache immediatamente, aggiorna in background" },
            { route: "Upload contatori", strategy: "Network Only + Queue", desc: "Accoda offline, invia automaticamente al ripristino connessione" },
            { route: "Notifiche", strategy: "Stale While Revalidate", desc: "Lettura rapida con aggiornamento silenzioso" },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-zinc-50 rounded-lg">
              <div className="w-48"><span className="font-medium text-sm">{s.route}</span></div>
              <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 whitespace-nowrap">{s.strategy}</span>
              <span className="text-sm text-zinc-500">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold mb-4">📲 Installazione PWA</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { platform: "Android", icon: "🤖", instructions: "Tocca il menu del browser → 'Aggiungi alla schermata Home'" },
            { platform: "iOS", icon: "🍎", instructions: "Tocca l'icona di condivisione → 'Aggiungi alla schermata Home'" },
            { platform: "Desktop", icon: "💻", instructions: "Clicca l'icona di installazione nella barra degli indirizzi" },
          ].map((p) => (
            <div key={p.platform} className="p-4 bg-zinc-50 rounded-lg border border-zinc-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{p.icon}</span>
                <span className="font-semibold">{p.platform}</span>
              </div>
              <p className="text-sm text-zinc-600">{p.instructions}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold mb-4">🔄 Sincronizzazione Offline</h2>
        <div className="space-y-3">
          {[
            { feature: "Letture contatore", desc: "I dati inseriti offline vengono accodati e inviati al ripristino della connessione", status: "Attivo" },
            { feature: "Voti assembleari", desc: "I voti offline vengono registrati localmente e sincronizzati", status: "Attivo" },
            { feature: "Dashboard cache", desc: "I grafici mostrano gli ultimi dati disponibili anche senza rete", status: "Attivo" },
            { feature: "Risoluzione conflitti", desc: "In caso di modifica simultanea, il server ha priorità con notifica utente", status: "Server-wins" },
          ].map((f, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
              <div>
                <span className="font-medium text-sm">{f.feature}</span>
                <p className="text-xs text-zinc-500 mt-0.5">{f.desc}</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">{f.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
