"use client";

import { Building2, Shield, Users, BarChart3, Palette, Plus } from "lucide-react";
import { useEffect, useState } from "react";

interface TenantInfo {
  id: string; name: string; slug: string; status: string; plan: string;
  memberCount: number; usagePercent: number; primaryColor: string;
  maxMembers: number; createdAt: string;
}
interface PlatformStats {
  totalTenants: number; activeTenants: number; suspendedTenants: number;
  totalMembers: number; monthlyRevenue: number;
  tenantsByPlan: { plan: string; count: number }[];
}

export default function MultiTenantPage() {
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/multi-tenant").then((r) => r.json()),
      fetch("/api/multi-tenant?view=stats").then((r) => r.json()),
    ]).then(([tenantsRes, statsRes]) => {
      setTenants(tenantsRes.tenants || []);
      setStats(statsRes.stats || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">🏢 Piattaforma Multi-Tenant</h1>
          <p className="text-zinc-600 mt-1">Gestione CER, provisioning, white-label e metriche piattaforma</p>
        </div>
        <button className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors">
          <Plus className="h-4 w-4" /> Nuova CER
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Tenant totali", value: stats.totalTenants, icon: Building2, color: "text-blue-600" },
            { label: "Tenant attivi", value: stats.activeTenants, icon: Shield, color: "text-green-600" },
            { label: "Membri totali", value: stats.totalMembers, icon: Users, color: "text-purple-600" },
            { label: "Revenue mensile", value: `€${stats.monthlyRevenue}`, icon: BarChart3, color: "text-amber-600" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-zinc-200 p-4">
              <div className="flex items-center gap-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <span className="text-sm text-zinc-500">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {stats && stats.tenantsByPlan.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold mb-4">📊 Distribuzione per Piano</h2>
          <div className="flex gap-6">
            {stats.tenantsByPlan.map((p) => (
              <div key={p.plan} className="text-center">
                <div className="text-2xl font-bold text-amber-600">{p.count}</div>
                <div className="text-sm text-zinc-500 capitalize">{p.plan}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100">
          <h2 className="text-lg font-semibold">🏘️ Tenant Registrati</h2>
        </div>
        {tenants.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">Nessun tenant registrato. Crea la prima CER.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-50"><tr>
              <th className="text-left px-6 py-3 text-zinc-500 font-medium">Nome</th>
              <th className="text-left px-6 py-3 text-zinc-500 font-medium">Slug</th>
              <th className="text-left px-6 py-3 text-zinc-500 font-medium">Piano</th>
              <th className="text-left px-6 py-3 text-zinc-500 font-medium">Membri</th>
              <th className="text-left px-6 py-3 text-zinc-500 font-medium">Utilizzo</th>
              <th className="text-left px-6 py-3 text-zinc-500 font-medium">Stato</th>
              <th className="text-left px-6 py-3 text-zinc-500 font-medium">Tema</th>
            </tr></thead>
            <tbody className="divide-y divide-zinc-100">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-50">
                  <td className="px-6 py-3 font-medium">{t.name}</td>
                  <td className="px-6 py-3 text-zinc-500">{t.slug}</td>
                  <td className="px-6 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 capitalize">{t.plan}</span></td>
                  <td className="px-6 py-3">{t.memberCount}/{t.maxMembers}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-zinc-200 rounded-full h-2"><div className="bg-amber-500 h-2 rounded-full" style={{ width: `${Math.min(t.usagePercent, 100)}%` }} /></div>
                      <span className="text-xs text-zinc-500">{t.usagePercent}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.status === "active" ? "bg-green-100 text-green-800" : t.status === "suspended" ? "bg-red-100 text-red-800" : "bg-zinc-100 text-zinc-600"}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-3"><Palette className="h-4 w-4" style={{ color: t.primaryColor }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
