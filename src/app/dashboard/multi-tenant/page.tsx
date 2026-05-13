"use client";

import { Activity, BarChart3, Building2, Plus, Search, Shield, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast-provider";

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  cerId: string | null;
  status: string;
  plan: string;
  memberCount: number;
  usagePercent: number;
  maxMembers: number;
  storageQuotaMb: number;
  apiCallsLimit: number;
  primaryColor: string;
  createdAt: string;
}

interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  totalMembers: number;
  monthlyRevenue: number;
  totalApiCalls: number;
  totalStorageMb: number;
  tenantsByPlan: { plan: string; count: number }[];
}

interface TenantUsage {
  period: string;
  memberCount: number;
  apiCalls: number;
  storageMb: number;
  eventsCount: number;
}

const formatCurrency = (value: number) => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

export default function MultiTenantPage() {
  const { showToast } = useToast();
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [usage, setUsage] = useState<TenantUsage[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [showProvisionForm, setShowProvisionForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [provisionForm, setProvisionForm] = useState({ name: "", slug: "", adminName: "", adminEmail: "", municipality: "", province: "FC", plan: "starter" });

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tenantsResponse, statsResponse] = await Promise.all([fetch("/api/multi-tenant"), fetch("/api/multi-tenant?view=stats")]);
      const tenantsPayload = (await tenantsResponse.json()) as { tenants?: TenantInfo[]; error?: string };
      const statsPayload = (await statsResponse.json()) as { stats?: PlatformStats; error?: string };
      if (!tenantsResponse.ok || !statsResponse.ok) {
        throw new Error(tenantsPayload.error || statsPayload.error || "Impossibile caricare la vista multi-CER.");
      }
      setTenants(tenantsPayload.tenants || []);
      setStats(statsPayload.stats || null);
      setSelectedTenantId((current) => current || tenantsPayload.tenants?.[0]?.id || null);
    } catch (caughtError) {
      setError((caughtError as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsage = useCallback(async (tenantId: string) => {
    try {
      const response = await fetch(`/api/multi-tenant?view=usage&tenantId=${tenantId}`);
      const payload = (await response.json()) as { usage?: TenantUsage[]; error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Impossibile caricare lo storico tenant.");
      }
      setUsage(payload.usage || []);
    } catch (caughtError) {
      showToast({ title: "Storico non disponibile", description: (caughtError as Error).message, variant: "error" });
    }
  }, [showToast]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDashboard();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadDashboard]);

  useEffect(() => {
    if (!selectedTenantId) {
      return undefined;
    }
    const timeoutId = window.setTimeout(() => {
      void loadUsage(selectedTenantId);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadUsage, selectedTenantId]);

  const filteredTenants = useMemo(
    () => tenants.filter((tenant) => {
      const matchesStatus = statusFilter === "all" ? true : tenant.status === statusFilter;
      const haystack = `${tenant.name} ${tenant.slug} ${tenant.plan}`.toLowerCase();
      return matchesStatus && haystack.includes(query.toLowerCase());
    }),
    [query, statusFilter, tenants],
  );

  const selectedTenant = useMemo(() => tenants.find((tenant) => tenant.id === selectedTenantId) || null, [tenants, selectedTenantId]);

  const runAction = async (body: Record<string, unknown>, successTitle: string, successDescription: string) => {
    setBusyAction(String(body.action || "action"));
    try {
      const response = await fetch("/api/multi-tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { error?: string; token?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Operazione non completata.");
      }
      showToast({ title: successTitle, description: payload.token ? `${successDescription} Token invito: ${payload.token}` : successDescription, variant: "success" });
      await loadDashboard();
      if (body.tenantId) {
        setSelectedTenantId(String(body.tenantId));
      }
    } catch (caughtError) {
      showToast({ title: "Operazione non riuscita", description: (caughtError as Error).message, variant: "error" });
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Vista piattaforma"
        title="Piattaforma Multi-CER"
        description="La vista admin ora consente confronto, drill-down e azioni rapide: filtra i tenant, analizza capacità e uso, crea nuove CER e invia inviti senza lasciare il cockpit operativo."
        actions={
          <button type="button" onClick={() => setShowProvisionForm((current) => !current)} className="inline-flex items-center gap-2 rounded-2xl bg-lime-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-lime-700"><Plus className="h-4 w-4" />Nuova CER</button>
        }
      />

      {showProvisionForm ? (
        <section className="rounded-3xl border border-lime-100 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-zinc-950">Provisioning nuova CER</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              ["name", "Nome CER"],
              ["slug", "Slug"],
              ["adminName", "Nome admin"],
              ["adminEmail", "Email admin"],
              ["municipality", "Comune"],
              ["province", "Provincia"],
            ].map(([field, label]) => (
              <input key={field} value={provisionForm[field as keyof typeof provisionForm]} onChange={(event) => setProvisionForm((current) => ({ ...current, [field]: event.target.value }))} placeholder={label} className="rounded-2xl border border-lime-200 px-4 py-3 text-sm outline-none transition focus:border-lime-500" />
            ))}
            <select value={provisionForm.plan} onChange={(event) => setProvisionForm((current) => ({ ...current, plan: event.target.value }))} className="rounded-2xl border border-lime-200 px-4 py-3 text-sm outline-none transition focus:border-lime-500">
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <button type="button" onClick={() => void runAction({ action: "provision", ...provisionForm }, "Tenant creato", "La nuova CER è stata provisionata correttamente.")} disabled={busyAction !== null} className="mt-6 rounded-2xl bg-lime-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-lime-700 disabled:opacity-60">{busyAction === "provision" ? "Provisioning..." : "Crea CER"}</button>
        </section>
      ) : null}

      {loading && !stats ? <p className="text-sm text-zinc-500">Caricamento piattaforma multi-CER...</p> : null}
      {error && !stats ? <EmptyState title="Impossibile caricare la vista multi-CER" description={error} /> : null}

      {stats ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-lime-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-3 text-lime-700"><Building2 className="h-5 w-5" /><p className="text-sm font-medium text-zinc-500">Tenant attivi</p></div><p className="mt-4 text-3xl font-bold text-zinc-950">{stats.activeTenants}</p><p className="mt-1 text-xs text-zinc-500">{stats.totalTenants} totali</p></div>
            <div className="rounded-2xl border border-lime-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-3 text-lime-700"><Users className="h-5 w-5" /><p className="text-sm font-medium text-zinc-500">Membri aggregati</p></div><p className="mt-4 text-3xl font-bold text-zinc-950">{stats.totalMembers}</p><p className="mt-1 text-xs text-zinc-500">Usage record corrente</p></div>
            <div className="rounded-2xl border border-lime-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-3 text-lime-700"><BarChart3 className="h-5 w-5" /><p className="text-sm font-medium text-zinc-500">Revenue mensile</p></div><p className="mt-4 text-3xl font-bold text-zinc-950">{formatCurrency(stats.monthlyRevenue)}</p><p className="mt-1 text-xs text-zinc-500">Storage {stats.totalStorageMb} MB</p></div>
            <div className="rounded-2xl border border-lime-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-3 text-lime-700"><Activity className="h-5 w-5" /><p className="text-sm font-medium text-zinc-500">API calls</p></div><p className="mt-4 text-3xl font-bold text-zinc-950">{stats.totalApiCalls.toLocaleString("it-IT")}</p><p className="mt-1 text-xs text-zinc-500">Tenant sospesi {stats.suspendedTenants}</p></div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="relative flex-1 min-w-[220px]"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca tenant, slug o piano" className="w-full rounded-2xl border border-lime-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-lime-500" /></label>
            {(["all", "active", "suspended"] as const).map((value) => (
              <button key={value} type="button" onClick={() => setStatusFilter(value)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${statusFilter === value ? "bg-lime-600 text-white" : "border border-lime-200 bg-white text-zinc-700 hover:bg-lime-50"}`}>{value === "all" ? "Tutti" : value === "active" ? "Attivi" : "Sospesi"}</button>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-3xl border border-lime-100 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-zinc-950">Tenant registrati</h2>
              {filteredTenants.length === 0 ? (
                <div className="mt-6"><EmptyState title="Nessun tenant trovato" description="Prova con un filtro diverso o crea una nuova CER dalla piattaforma." /></div>
              ) : (
                <div className="mt-6 space-y-3">
                  {filteredTenants.map((tenant) => (
                    <button key={tenant.id} type="button" onClick={() => setSelectedTenantId(tenant.id)} className={`w-full rounded-2xl border p-4 text-left transition ${selectedTenantId === tenant.id ? "border-lime-300 bg-lime-50" : "border-amber-100 bg-white hover:bg-amber-50"}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-zinc-950">{tenant.name}</p>
                          <p className="mt-1 text-sm text-zinc-600">{tenant.slug} · piano {tenant.plan}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tenant.status === "active" ? "bg-lime-100 text-lime-800" : "bg-amber-100 text-amber-800"}`}>{tenant.status}</span>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm text-zinc-600">
                        <p>Membri {tenant.memberCount}/{tenant.maxMembers}</p>
                        <p>Quota storage {tenant.storageQuotaMb} MB</p>
                        <p>API limit {tenant.apiCallsLimit.toLocaleString("it-IT")}</p>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200"><div className="h-full rounded-full bg-lime-500" style={{ width: `${Math.min(tenant.usagePercent, 100)}%`, backgroundColor: tenant.primaryColor }} /></div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-lime-100 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3"><Shield className="h-5 w-5 text-lime-700" /><h2 className="text-2xl font-bold text-zinc-950">Drill-down tenant</h2></div>
              {selectedTenant ? (
                <div className="mt-6 space-y-5">
                  <div className="rounded-2xl border border-lime-100 bg-lime-50 p-5">
                    <p className="text-sm font-semibold text-zinc-700">Tenant selezionato</p>
                    <h3 className="mt-2 text-xl font-bold text-zinc-950">{selectedTenant.name}</h3>
                    <p className="mt-2 text-sm text-zinc-600">Slug {selectedTenant.slug} · creato il {new Date(selectedTenant.createdAt).toLocaleDateString("it-IT")}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <article className="rounded-2xl border border-amber-100 bg-white p-4"><p className="text-sm text-zinc-500">Capacità membri</p><p className="mt-2 text-2xl font-bold text-zinc-950">{selectedTenant.memberCount}/{selectedTenant.maxMembers}</p></article>
                    <article className="rounded-2xl border border-amber-100 bg-white p-4"><p className="text-sm text-zinc-500">Utilizzo piano</p><p className="mt-2 text-2xl font-bold text-zinc-950">{selectedTenant.usagePercent}%</p></article>
                  </div>
                  <div className="space-y-3">
                    <input value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="Email da invitare" className="w-full rounded-2xl border border-lime-200 px-4 py-3 text-sm outline-none transition focus:border-lime-500" />
                    <div className="flex flex-wrap gap-3">
                      <button type="button" onClick={() => void runAction({ action: "invite", tenantId: selectedTenant.id, email: inviteEmail, role: "member" }, "Invito generato", "Condividi il token con il nuovo membro o admin del tenant.")} disabled={!inviteEmail || busyAction !== null} className="rounded-2xl border border-lime-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-lime-50 disabled:opacity-60">Invita utente</button>
                      {selectedTenant.status === "active" ? (
                        <button type="button" onClick={() => void runAction({ action: "suspend", tenantId: selectedTenant.id, reason: "Review piattaforma" }, "Tenant sospeso", "La CER è stata messa in pausa per review amministrativa.")} disabled={busyAction !== null} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-60">Sospendi</button>
                      ) : (
                        <button type="button" onClick={() => void runAction({ action: "reactivate", tenantId: selectedTenant.id }, "Tenant riattivato", "La CER è tornata operativa nella piattaforma multi-tenant.")} disabled={busyAction !== null} className="rounded-2xl bg-lime-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-lime-700 disabled:opacity-60">Riattiva</button>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-950">Storico utilizzo</h3>
                    {usage.length === 0 ? (
                      <div className="mt-4"><EmptyState title="Nessuno storico disponibile" description="I record mensili di utilizzo appariranno qui quando il tenant inizierà a registrare traffico e membri." /></div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {usage.map((entry) => (
                          <article key={entry.period} className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-zinc-700">
                            <div className="flex items-center justify-between gap-4"><span className="font-semibold text-zinc-950">{entry.period}</span><span>{entry.memberCount} membri</span></div>
                            <div className="mt-2 grid gap-2 sm:grid-cols-3"><span>API {entry.apiCalls.toLocaleString("it-IT")}</span><span>Storage {entry.storageMb} MB</span><span>Eventi {entry.eventsCount}</span></div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-6"><EmptyState title="Seleziona un tenant" description="Apri una CER dalla lista per vedere capacità, inviti e storico di utilizzo." /></div>
              )}
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
