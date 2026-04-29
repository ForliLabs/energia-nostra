"use client";

import { Battery, BatteryCharging, Car, Radio, Wifi, Zap } from "lucide-react";
import { useEffect, useState } from "react";

interface SmartGridDashboard {
  devices: Array<{ id: string; name: string; type: string; protocol: string; status: string; manufacturer: string | null; lastHeartbeat: string | null }>;
  activeChargingSessions: Array<{ id: string; deviceName: string; startTime: string; energyKwh: number; status: string }>;
  demandResponseEvents: Array<{ id: string; eventId: string; source: string; type: string; signalLevel: number; startTime: string; endTime: string; status: string; revenueEuro: number | null }>;
  summary: { totalDevices: number; onlineDevices: number; totalEnergyTodayKwh: number; solarChargingPct: number; activeDrEvents: number; totalDrRevenueEuro: number; batteryCapacityKwh: number; currentSocPct: number };
}

const DEVICE_ICONS: Record<string, typeof Zap> = { ev_charger: Car, battery: Battery, solar_inverter: Zap, smart_meter: Radio, smart_thermostat: Wifi };
const STATUS_COLORS: Record<string, string> = { online: "bg-green-100 text-green-700", offline: "bg-zinc-100 text-zinc-600", charging: "bg-blue-100 text-blue-700", error: "bg-red-100 text-red-700" };

export default function SmartGridPage() {
  const [data, setData] = useState<SmartGridDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/smart-grid")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">🔌 Smart Grid & Dispositivi</h1>
        <p className="text-zinc-600 mt-1">Gestione OCPP/OpenADR, ricarica EV, batterie e demand response</p>
      </div>

      {data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Dispositivi online", value: `${data.summary.onlineDevices}/${data.summary.totalDevices}`, icon: Wifi, color: "text-green-600" },
            { label: "Energia oggi", value: `${data.summary.totalEnergyTodayKwh} kWh`, icon: Zap, color: "text-amber-600" },
            { label: "Ricarica solare", value: `${data.summary.solarChargingPct}%`, icon: BatteryCharging, color: "text-blue-600" },
            { label: "Revenue DR", value: `€${data.summary.totalDrRevenueEuro}`, icon: Radio, color: "text-purple-600" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-zinc-200 p-4">
              <div className="flex items-center gap-2"><stat.icon className={`h-5 w-5 ${stat.color}`} /><span className="text-sm text-zinc-500">{stat.label}</span></div>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {data?.summary && data.summary.batteryCapacityKwh > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold mb-3">🔋 Stato Batterie</h2>
          <div className="flex items-center gap-4">
            <div className="w-full bg-zinc-200 rounded-full h-6">
              <div className={`h-6 rounded-full flex items-center justify-center text-xs font-medium text-white ${data.summary.currentSocPct > 60 ? "bg-green-500" : data.summary.currentSocPct > 30 ? "bg-amber-500" : "bg-red-500"}`}
                   style={{ width: `${data.summary.currentSocPct}%` }}>{data.summary.currentSocPct}%</div>
            </div>
            <span className="text-sm text-zinc-500 whitespace-nowrap">{data.summary.batteryCapacityKwh} kWh</span>
          </div>
        </div>
      )}

      {data?.devices && data.devices.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold mb-4">📡 Dispositivi Connessi</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.devices.map((d) => {
              const Icon = DEVICE_ICONS[d.type] || Zap;
              return (
                <div key={d.id} className="flex items-center gap-3 p-3 border border-zinc-100 rounded-lg">
                  <Icon className="h-8 w-8 text-zinc-400" />
                  <div className="flex-1">
                    <h3 className="font-medium">{d.name}</h3>
                    <p className="text-xs text-zinc-500">{d.protocol.toUpperCase()} · {d.manufacturer || "N/D"}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[d.status] || "bg-zinc-100 text-zinc-600"}`}>{d.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data?.activeChargingSessions && data.activeChargingSessions.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold mb-4">🚗 Sessioni di Ricarica Attive</h2>
          <div className="space-y-3">
            {data.activeChargingSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div><span className="font-medium">{s.deviceName}</span><span className="text-sm text-zinc-500 ml-2">da {new Date(s.startTime).toLocaleTimeString("it-IT")}</span></div>
                <div className="text-right"><span className="font-bold text-blue-600">{s.energyKwh} kWh</span><span className="text-xs text-zinc-500 ml-2">{s.status}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data?.demandResponseEvents && data.demandResponseEvents.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold mb-4">📻 Eventi Demand Response</h2>
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
                  <td className="py-2">{"⚡".repeat(e.signalLevel)}</td>
                  <td className="py-2"><span className={`px-2 py-0.5 rounded-full text-xs ${e.status === "completed" ? "bg-green-100 text-green-700" : e.status === "active" ? "bg-blue-100 text-blue-700" : "bg-zinc-100 text-zinc-600"}`}>{e.status}</span></td>
                  <td className="py-2 text-right font-medium">{e.revenueEuro != null ? `€${e.revenueEuro}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
