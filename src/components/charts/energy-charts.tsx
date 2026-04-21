"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface EnergyChartData {
  label: string;
  productionKwh: number;
  consumptionKwh: number;
  sharedEnergyKwh: number;
}

interface MemberBreakdown {
  name: string;
  value: number;
  type: string;
}

const COLORS = {
  production: "#84cc16",
  consumption: "#f59e0b",
  shared: "#22c55e",
};

const PIE_COLORS = ["#84cc16", "#22c55e", "#f59e0b", "#06b6d4", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

const formatKwh = (value: number) => `${(value / 1000).toFixed(1)}k`;
const formatCurrencyValue = (value: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

const kwhFormatter = (value: unknown, name: unknown) => [
  `${Number(value).toLocaleString("it-IT")} kWh`,
  String(name) === "productionKwh" ? "Produzione" : String(name) === "consumptionKwh" ? "Consumo" : "Condivisa",
];

const sharedFormatter = (value: unknown) => [`${Number(value).toLocaleString("it-IT")} kWh`, "Energia condivisa"];

const savingsFormatter = (value: unknown, name: unknown) => [
  formatCurrencyValue(Number(value)),
  String(name) === "savingsEuro" ? "Risparmio" : "Incentivo GSE",
];

const selfConsumptionFormatter = (value: unknown) => [`${Number(value).toFixed(1)}%`, "Autoconsumo"];

export function ProductionConsumptionChart({ data }: { data: EnergyChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.production} stopOpacity={0.3} />
            <stop offset="95%" stopColor={COLORS.production} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.consumption} stopOpacity={0.3} />
            <stop offset="95%" stopColor={COLORS.consumption} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#9ca3af" />
        <YAxis tickFormatter={formatKwh} tick={{ fontSize: 12 }} stroke="#9ca3af" />
        <Tooltip
          formatter={kwhFormatter}
          contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
        />
        <Legend
          formatter={(value: string) =>
            value === "productionKwh" ? "Produzione" : value === "consumptionKwh" ? "Consumo" : "Condivisa"
          }
        />
        <Area
          type="monotone"
          dataKey="productionKwh"
          stroke={COLORS.production}
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorProd)"
        />
        <Area
          type="monotone"
          dataKey="consumptionKwh"
          stroke={COLORS.consumption}
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorCons)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SharedEnergyBarChart({ data }: { data: EnergyChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#9ca3af" />
        <YAxis tickFormatter={formatKwh} tick={{ fontSize: 12 }} stroke="#9ca3af" />
        <Tooltip
          formatter={sharedFormatter}
          contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
        />
        <Bar dataKey="sharedEnergyKwh" fill={COLORS.shared} radius={[6, 6, 0, 0]} name="Energia condivisa" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SavingsChart({ data }: { data: Array<{ label: string; savingsEuro: number; gseIncentiveEuro: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#9ca3af" />
        <YAxis tickFormatter={(v: number) => formatCurrencyValue(v)} tick={{ fontSize: 12 }} stroke="#9ca3af" />
        <Tooltip
          formatter={savingsFormatter}
          contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
        />
        <Legend formatter={(v: string) => (v === "savingsEuro" ? "Risparmio bolletta" : "Incentivo GSE")} />
        <Bar dataKey="savingsEuro" fill={COLORS.production} radius={[4, 4, 0, 0]} stackId="a" />
        <Bar dataKey="gseIncentiveEuro" fill={COLORS.shared} radius={[4, 4, 0, 0]} stackId="a" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MemberTypePieChart({ data }: { data: MemberBreakdown[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
          nameKey="name"
          label={(props: { name?: string; percent?: number }) => `${props.name ?? ""} ${((props.percent ?? 0) * 100).toFixed(0)}%`}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: unknown, name: unknown) => [`${Number(value).toLocaleString("it-IT")} kWh`, String(name)]}
          contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function SelfConsumptionChart({ data }: { data: Array<{ label: string; selfConsumptionPct: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorSelf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#9ca3af" />
        <YAxis domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 12 }} stroke="#9ca3af" />
        <Tooltip
          formatter={selfConsumptionFormatter}
          contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
        />
        <Area type="monotone" dataKey="selfConsumptionPct" stroke="#22c55e" strokeWidth={2} fill="url(#colorSelf)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
