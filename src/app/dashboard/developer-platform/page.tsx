"use client";

import { Code, Package, Shield, Key, Download, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

interface DeveloperDashboard {
  apps: Array<{ id: string; name: string; description: string | null; developerName: string; clientId: string; scopes: string[]; status: string; installCount: number; createdAt: string }>;
  plugins: Array<{ id: string; name: string; slug: string; description: string; category: string; version: string; developerName: string; pricing: string; priceEuro: number | null; installCount: number; rating: number | null; isVerified: boolean; isInstalled: boolean }>;
  installedPlugins: Array<{ id: string; pluginName: string; status: string; createdAt: string }>;
  stats: { totalApps: number; totalPlugins: number; totalInstalls: number; totalApiCalls: number; activeAuthorizations: number };
  apiSpec: { version: string; endpoints: number; categories: string[] };
}

export default function DeveloperPlatformPage() {
  const [data, setData] = useState<DeveloperDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/developer-platform")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">🛠️ Developer Platform</h1>
        <p className="text-zinc-600 mt-1">OAuth 2.0, OpenAPI, marketplace plugin e SDK</p>
      </div>

      {data?.stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "App OAuth", value: data.stats.totalApps, icon: Key },
            { label: "Plugin", value: data.stats.totalPlugins, icon: Package },
            { label: "Installazioni", value: data.stats.totalInstalls, icon: Download },
            { label: "Chiamate API", value: data.stats.totalApiCalls, icon: Code },
            { label: "Autorizzazioni", value: data.stats.activeAuthorizations, icon: Shield },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-zinc-200 p-4">
              <div className="flex items-center gap-2"><stat.icon className="h-4 w-4 text-zinc-400" /><span className="text-xs text-zinc-500">{stat.label}</span></div>
              <p className="text-xl font-bold mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {data?.apiSpec && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold mb-4">📖 OpenAPI Spec v{data.apiSpec.version}</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {data.apiSpec.categories.map((cat) => (
              <span key={cat} className="px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-700">{cat}</span>
            ))}
          </div>
          <p className="text-sm text-zinc-600">{data.apiSpec.endpoints} endpoint disponibili · Autenticazione via API Key o OAuth 2.0</p>
          <div className="mt-4 flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm hover:bg-zinc-800">
              <Code className="h-4 w-4" /> Esplora API
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-zinc-300 rounded-lg text-sm hover:bg-zinc-50">
              <ExternalLink className="h-4 w-4" /> Documentazione
            </button>
          </div>
        </div>
      )}

      {data?.apps && data.apps.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold mb-4">🔑 App OAuth Registrate</h2>
          <div className="space-y-3">
            {data.apps.map((app) => (
              <div key={app.id} className="flex items-center gap-4 p-3 border border-zinc-100 rounded-lg">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold">{app.name.charAt(0)}</div>
                <div className="flex-1">
                  <h3 className="font-medium">{app.name}</h3>
                  <p className="text-xs text-zinc-500">{app.developerName} · {app.scopes.length} scopes · Client: {app.clientId.slice(0, 12)}...</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs ${app.status === "approved" ? "bg-green-100 text-green-700" : app.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{app.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold mb-4">🏪 Marketplace Plugin</h2>
        {data?.plugins && data.plugins.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.plugins.map((plugin) => (
              <div key={plugin.id} className="p-4 border border-zinc-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white"><Package className="h-5 w-5" /></div>
                  <div>
                    <h3 className="font-medium flex items-center gap-1">{plugin.name} {plugin.isVerified && <Shield className="h-3 w-3 text-blue-500" />}</h3>
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
                    <span className="w-full block text-center py-1.5 bg-green-100 text-green-700 rounded text-xs font-medium">Installato</span>
                  ) : (
                    <button className="w-full py-1.5 bg-amber-600 text-white rounded text-xs font-medium hover:bg-amber-700">Installa</button>
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
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold mb-4">📦 Plugin Installati</h2>
          <div className="space-y-2">
            {data.installedPlugins.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                <span className="font-medium text-sm">{p.pluginName}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500">{new Date(p.createdAt).toLocaleDateString("it-IT")}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
