"use client";

import type { ReactNode } from "react";
import { BarChart3, Coins, FileText, Home, Receipt, ShieldCheck, Upload, Users, Vote, TrendingUp, ArrowLeftRight, FilePen, Trophy, Key, Leaf, CreditCard, Bell, HardDrive, FileSpreadsheet, LayoutDashboard, Brain, Building2, Scale, Plug, Calculator, FileCheck, Heart, Smartphone, Banknote, Code } from "lucide-react";
import { DashboardShell } from "@/components/dashboard";

const items = [
  { label: "Panoramica", href: "/dashboard", icon: <Home className="h-5 w-5" /> },
  { label: "Membri", href: "/dashboard/members", icon: <Users className="h-5 w-5" /> },
  { label: "Energia", href: "/dashboard/energy", icon: <BarChart3 className="h-5 w-5" /> },
  { label: "Previsioni", href: "/dashboard/forecasting", icon: <TrendingUp className="h-5 w-5" /> },
  { label: "Incentivi", href: "/dashboard/incentives", icon: <Coins className="h-5 w-5" /> },
  { label: "Governance", href: "/dashboard/governance", icon: <Vote className="h-5 w-5" /> },
  { label: "Votazioni", href: "/dashboard/voting", icon: <ShieldCheck className="h-5 w-5" /> },
  { label: "Trading P2P", href: "/dashboard/trading", icon: <ArrowLeftRight className="h-5 w-5" /> },
  { label: "Dati contatore", href: "/dashboard/meter-data", icon: <Upload className="h-5 w-5" /> },
  { label: "Report GSE", href: "/dashboard/gse-reports", icon: <FileText className="h-5 w-5" /> },
  { label: "Fatturazione", href: "/dashboard/billing", icon: <Receipt className="h-5 w-5" /> },
  { label: "Pagamenti", href: "/dashboard/payments", icon: <CreditCard className="h-5 w-5" /> },
  { label: "Documenti", href: "/dashboard/documents", icon: <FilePen className="h-5 w-5" /> },
  { label: "Archivio", href: "/dashboard/storage", icon: <HardDrive className="h-5 w-5" /> },
  { label: "Sfide & Badge", href: "/dashboard/gamification", icon: <Trophy className="h-5 w-5" /> },
  { label: "Crediti CO₂", href: "/dashboard/carbon-credits", icon: <Leaf className="h-5 w-5" /> },
  { label: "Notifiche", href: "/dashboard/notifications", icon: <Bell className="h-5 w-5" /> },
  { label: "Importa Dati", href: "/dashboard/import", icon: <FileSpreadsheet className="h-5 w-5" /> },
  { label: "API & Webhook", href: "/dashboard/api-platform", icon: <Key className="h-5 w-5" /> },
  { label: "Personalizza", href: "/dashboard/customize", icon: <LayoutDashboard className="h-5 w-5" /> },
  // ── Iteration 4 ──
  { label: "Multi-Tenant", href: "/dashboard/multi-tenant", icon: <Building2 className="h-5 w-5" /> },
  { label: "AI Ottimizzazione", href: "/dashboard/ai-optimization", icon: <Brain className="h-5 w-5" /> },
  { label: "Compliance ARERA", href: "/dashboard/arera-compliance", icon: <Scale className="h-5 w-5" /> },
  { label: "Smart Grid", href: "/dashboard/smart-grid", icon: <Plug className="h-5 w-5" /> },
  { label: "Simulatore CER", href: "/dashboard/simulation", icon: <Calculator className="h-5 w-5" /> },
  { label: "Portale GSE", href: "/dashboard/gse-portal", icon: <FileCheck className="h-5 w-5" /> },
  { label: "Community", href: "/dashboard/community", icon: <Heart className="h-5 w-5" /> },
  { label: "PWA Offline", href: "/dashboard/offline-pwa", icon: <Smartphone className="h-5 w-5" /> },
  { label: "Riconciliazione", href: "/dashboard/financial-reconciliation", icon: <Banknote className="h-5 w-5" /> },
  { label: "Developer", href: "/dashboard/developer-platform", icon: <Code className="h-5 w-5" /> },
  // ── Moonshot features ──
  { label: "VPP Federata", href: "/dashboard/vpp", icon: <Plug className="h-5 w-5" /> },
  { label: "Digital Twin", href: "/dashboard/digital-twin", icon: <Calculator className="h-5 w-5" /> },
  { label: "Resilience Mesh", href: "/dashboard/resilience", icon: <ShieldCheck className="h-5 w-5" /> },
  { label: "Energy Agents", href: "/dashboard/energy-agents", icon: <Brain className="h-5 w-5" /> },
  { label: "Capitale CER", href: "/dashboard/community-capital", icon: <Coins className="h-5 w-5" /> },
  { label: "Federazione", href: "/dashboard/federation", icon: <Building2 className="h-5 w-5" /> },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell brand="EnergiaNostra" items={items}>{children}</DashboardShell>;
}
