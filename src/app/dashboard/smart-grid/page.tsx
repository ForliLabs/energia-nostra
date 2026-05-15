"use client";

import { Battery, BatteryCharging, Car, Radio, Wifi, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FetchError } from "@/components/ui/fetch-error";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton, StatsSkeleton } from "@/components/ui/skeleton";
import { formatHeartbeat } from "@/lib/smart-grid-utils";

interface SmartGridDashboard {
  devices: Array<{ id: string; name: string; type: string; protocol: string; status: string; manufacturer: string | null; lastHeartbeat: string | null }>;
  activeChargingSessions: Array<{ id: string; deviceName: string; startTime: string; energyKwh: number; status: string }>;
  demandResponseEvents: Array<{ id: string; eventId: string; source: string; type: string; signalLevel: number; startTime: string; endTime: string; status: string; revenueEuro: number | null }>;
  summary: { totalDevices: number; onlineDevices: number; totalEnergyTodayKwh: number; solarChargingPct: number; activeDrEvents: number; totalDrRevenueEuro: number; batteryCapacityKwh: number; currentSocPct: number };
}

const DEVICE_ICONS: Record<string, typeof Zap> = { ev_charger: Car, battery: Battery, solar_inverter: Zap, smart_meter: Radio, smart_thermostat: Wifi };
const STATUS_COLORS: Record<string, string> = { online: "bg-lime-100 text-lime-700", offline: "bg-zinc-100 text-zinc-600", charging: "bg-amber-100 text-amber-700", error: "bg-red-100 text-red-700" };

export default function SmartGridPage() {
  const [data, setData] = useState<SmartGridDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const r = await fetch("/api/smart-grid");
      if (!r.ok) throw new Error(`Errore ${r.status}`);
      setData(await r.json());
    } catch (e) {
      setError((e as Error).message || "Impossibile caricare i dati della smart grid.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Rete" title="Smart Grid e Dispositivi" description="Gestione OCPP/OpenADR, ricarica EV, batterie e demand response" />
        <StatsSkeleton count={4} />
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm">
          <Skeleton className="h-6 w-48 mb-5" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Rete" title="Smart Grid e Dispositivi" description="Gestione OCPP/OpenADR, ricarica EV, batterie e demand response" />
        <FetchError
          title="Impossibile caricare i dati della smart grid"
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
        eyebrow="Rete"
        title="Smart Grid e Dispositivi"
        description="Gestione OCPP/OpenADR, ricarica EV, batterie e demand response"
      />

      {data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Dispositivi online", value: `${data.summary.onlineDevices}/${data.summary.totalDevices}`, icon: Wifi, color: "text-lime-700" },
            { label: "Energia oggi", value: `${data.summary.totalEnergyTodayKwh} kWh`, icon: Zap, color: "text-amber-600" },
            { label: "Ricarica solare", value: `${data.summary.solarChargingPct}%`, icon: BatteryCharging, color: "text-lime-600" },
            { label: "Revenue DR", value: `€${data.summary.totalDrRevenueEuro}`, icon: Radio, color: "text-amber-700" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
              <div className="flex items-center gap-2"><stat.icon className={`h-5 w-5 ${stat.color}`} /><span className="text-sm text-zinc-500">{stat.label}</span></div>
              <p className="text-2xl font-bold text-zinc-950 mt-2">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {data?.summary && data.summary.batteryCapacityKwh > 0 && (
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-xl font-bold text-zinc-950 mb-4">Stato Batterie</h2>
          <div className="flex items-center gap-4">
            <div className="w-full bg-zinc-200 rounded-full h-6">
              <div className={`h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white ${data.summary.currentSocPct > 60 ? "bg-lime-500" : data.summary.currentSocPct > 30 ? "bg-amber-500" : "bg-red-500"}`}
                   style={{ width: `${data.summary.currentSocPct}%` }}>{data.summary.currentSocPct}%</div>
            </div>
            <span className="text-sm text-zinc-500 whitespace-nowrap">{data.summary.batteryCapacityKwh} kWh</span>
          </div>
        </div>
      )}

      {data?.devices && data.devices.length > 0 && (
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-xl font-bold text-zinc-950 mb-5">Dispositivi Connessi</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.devices.map((d) => {
              const Icon = DEVICE_ICONS[d.type] || Zap;
              return (
                <div key={d.id} className="flex items-center gap-3 p-4 border border-lime-50 rounded-2xl">
                  <Icon className="h-8 w-8 text-zinc-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-zinc-900">{d.name}</h3>
                    <p className="text-xs text-zinc-500">{d.protocol.toUpperCase()} · {d.manufacturer || "N/D"}</p>
                    <p className="text-xs text-zinc-400">Heartbeat: {formatHeartbeat(d.lastHeartbeat)}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs shrink-0 ${STATUS_COLORS[d.status] || "bg-zinc-100 text-zinc-600"}`}>{d.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data?.activeChargingSessions && data.activeChargingSessions.length > 0 && (
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-xl font-bold text-zinc-950 mb-5">Sessioni di Ricarica Attive</h2>
          <div className="space-y-3">
            {data.activeChargingSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4 bg-amber-50/60 rounded-2xl border border-amber-100">
                <div><span className="font-semibold text-zinc-900">{s.deviceName}</span><span className="text-sm text-zinc-500 ml-2">da {new Date(s.startTime).toLocaleTimeString("it-IT")}</span></div>
                <div className="text-right"><span className="font-bold text-amber-700">{s.energyKwh} kWh</span><span className="text-xs text-zinc-500 ml-2">{s.status}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data?.demandResponseEvents && data.demandResponseEvents.length > 0 && (
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-xl font-bold text-zinc-950 mb-5">Eventi Demand Response</h2>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-zinc-200">
              <th className="text-left py-2 text-zinc-500">Evento</th>
              <th className="text-left py-2 text-zinc-500">Fonte</th>
              <th className="text-left py-2 text-zinc-500">Tipo</th>
              <th className="text-left py-2 text-zinc-500">Livello</th>
              <th className="text-left py-2 text-zinc-500">Stato</th>
              <th className="text-right py-2 text-zinc-500">Revenue</th>
            </tr></thead>
            <tbody className="divide-y divide-zinc-100">
              {data.demandResponseEvents.slice(0, 10).map((e) => (
                <tr key={e.id}>
                  <td className="py-2 font-mono text-xs">{e.eventId.slice(0, 16)}</td>
                  <td className="py-2">{e.source}</td>
                  <td className="py-2">{e.type}</td>
                  <td className="py-2 font-mono text-amber-600">{e.signalLevel}</td>
                  <td className="py-2"><span className={`px-2 py-0.5 rounded-full text-xs ${e.status === "completed" ? "bg-lime-100 text-lime-700" : e.status === "active" ? "bg-amber-100 text-amber-700" : "bg-zinc-100 text-zinc-600"}`}>{e.status}</span></td>
                  <td className="py-2 text-right font-semibold">{e.revenueEuro != null ? `€${e.revenueEuro}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
