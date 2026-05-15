"use client";

import { Code, Package, Shield, Key, Download, ExternalLink } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FetchError } from "@/components/ui/fetch-error";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton, StatsSkeleton } from "@/components/ui/skeleton";

interface DeveloperDashboard {
  apps: Array<{ id: string; name: string; description: string | null; developerName: string; clientId: string; scopes: string[]; status: string; installCount: number; createdAt: string }>;
  plugins: Array<{ id: string; name: string; slug: string; description: string; category: string; version: string; developerName: string; pricing: string; priceEuro: number | null; installCount: number; rating: number | null; isVerified: boolean; isInstalled: boolean }>;
  installedPlugins: Array<{ id: string; pluginName: string; status: string; createdAt: string }>;
  stats: { totalApps: number; totalPlugins: number; totalInstalls: number; totalApiCalls: number; activeAuthorizations: number };
  apiSpec: { version: string; endpoints: number; categories: string[] };
}

function DeveloperPlatformSkeleton() {
  return (
    <div className="space-y-6">
      <StatsSkeleton count={5} />
      <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm">
        <Skeleton className="h-6 w-56 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </div>
    </div>
  );
}

export default function DeveloperPlatformPage() {
  const [data, setData] = useState<DeveloperDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const r = await fetch("/api/developer-platform");
      if (!r.ok) throw new Error(`Errore ${r.status}`);
      setData(await r.json());
    } catch (e) {
      setError((e as Error).message || "Impossibile caricare i dati della piattaforma sviluppatori.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  if (loading) return <DeveloperPlatformSkeleton />;

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Sviluppatori" title="Developer Platform" description="OAuth 2.0, OpenAPI, marketplace plugin e SDK" />
        <FetchError
          title="Impossibile caricare i dati della piattaforma"
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
        eyebrow="Sviluppatori"
        title="Developer Platform"
        description="OAuth 2.0, OpenAPI, marketplace plugin e SDK"
      />

      {data?.stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "App OAuth", value: data.stats.totalApps, icon: Key },
            { label: "Plugin", value: data.stats.totalPlugins, icon: Package },
            { label: "Installazioni", value: data.stats.totalInstalls, icon: Download },
            { label: "Chiamate API", value: data.stats.totalApiCalls, icon: Code },
            { label: "Autorizzazioni", value: data.stats.activeAuthorizations, icon: Shield },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
              <div className="flex items-center gap-2"><stat.icon className="h-4 w-4 text-zinc-400" /><span className="text-xs text-zinc-500">{stat.label}</span></div>
              <p className="text-xl font-bold text-zinc-950 mt-2">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {data?.apiSpec && (
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-xl font-bold text-zinc-950 mb-4">OpenAPI Spec v{data.apiSpec.version}</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {data.apiSpec.categories.map((cat) => (
              <span key={cat} className="px-3 py-1 rounded-full text-xs bg-amber-100 text-amber-800">{cat}</span>
            ))}
          </div>
          <p className="text-sm text-zinc-600">{data.apiSpec.endpoints} endpoint disponibili · Autenticazione via API Key o OAuth 2.0</p>
          <div className="mt-5 flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800">
              <Code className="h-4 w-4" /> Esplora API
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 border border-zinc-200 rounded-xl text-sm font-medium hover:bg-zinc-50">
              <ExternalLink className="h-4 w-4" /> Documentazione
            </button>
          </div>
        </div>
      )}

      {data?.apps && data.apps.length > 0 && (
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-xl font-bold text-zinc-950 mb-5">App OAuth Registrate</h2>
          <div className="space-y-3">
            {data.apps.map((app) => (
              <div key={app.id} className="flex items-center gap-4 p-4 border border-lime-50 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold shrink-0">{app.name.charAt(0)}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-zinc-900">{app.name}</h3>
                  <p className="text-xs text-zinc-500">{app.developerName} · {app.scopes.length} scopes · Client: {app.clientId.slice(0, 12)}...</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs shrink-0 ${app.status === "approved" ? "bg-lime-100 text-lime-700" : app.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{app.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
        <h2 className="text-xl font-bold text-zinc-950 mb-5">Marketplace Plugin</h2>
        {data?.plugins && data.plugins.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.plugins.map((plugin) => (
              <div key={plugin.id} className="p-4 border border-lime-50 rounded-2xl hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-lime-500 flex items-center justify-center text-white shrink-0"><Package className="h-5 w-5" /></div>
                  <div>
                    <h3 className="font-semibold text-zinc-900 flex items-center gap-1">{plugin.name} {plugin.isVerified && <Shield className="h-3 w-3 text-lime-600" />}</h3>
                    <span className="text-xs text-zinc-500">{plugin.developerName}</span>
                  </div>
                </div>
                <p className="text-sm text-zinc-600 mb-3">{plugin.description}</p>
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>{plugin.installCount} installazioni</span>
                  <span className="capitalize">{plugin.pricing}{plugin.priceEuro ? ` · €${plugin.priceEuro}/mese` : ""}</span>
                </div>
                <div className="mt-3">
                  {plugin.isInstalled ? (
                    <span className="w-full block text-center py-1.5 bg-lime-100 text-lime-700 rounded-xl text-xs font-medium">Installato</span>
                  ) : (
                    <button className="w-full py-1.5 bg-amber-600 text-white rounded-xl text-xs font-medium hover:bg-amber-700">Installa</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500">Nessun plugin disponibile. Pubblica il primo plugin!</p>
          </div>
        )}
      </div>

      {data?.installedPlugins && data.installedPlugins.length > 0 && (
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-xl font-bold text-zinc-950 mb-5">Plugin Installati</h2>
          <div className="space-y-2">
            {data.installedPlugins.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-zinc-50/80 rounded-2xl">
                <span className="font-semibold text-sm text-zinc-900">{p.pluginName}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500">{new Date(p.createdAt).toLocaleDateString("it-IT")}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-lime-100 text-lime-700">{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
