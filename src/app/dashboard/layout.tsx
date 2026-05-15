"use client";

import type { ReactNode } from "react";
import {
  ArrowLeftRight,
  Banknote,
  BarChart3,
  Bell,
  Brain,
  Building2,
  Calculator,
  Code,
  Coins,
  CreditCard,
  FileCheck,
  FilePen,
  FileSpreadsheet,
  FileText,
  HardDrive,
  Heart,
  Home,
  Key,
  LayoutDashboard,
  Leaf,
  Plug,
  Receipt,
  Scale,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Trophy,
  Upload,
  Users,
  Vote,
} from "lucide-react";
import { DashboardShell, type SidebarSection } from "@/components/dashboard";

const sections: SidebarSection[] = [
  {
    label: "Panoramica",
    description: "Accesso rapido ai flussi quotidiani della CER.",
    items: [
      { label: "Panoramica", href: "/dashboard", icon: <Home className="h-5 w-5" />, keywords: ["home", "overview"] },
      { label: "Membri", href: "/dashboard/members", icon: <Users className="h-5 w-5" />, keywords: ["anagrafiche", "soci"] },
      { label: "Energia", href: "/dashboard/energy", icon: <BarChart3 className="h-5 w-5" />, keywords: ["consumi", "produzione"] },
      { label: "Previsioni", href: "/dashboard/forecasting", icon: <TrendingUp className="h-5 w-5" />, keywords: ["forecast", "stima"] },
      { label: "Importa dati", href: "/dashboard/import", icon: <FileSpreadsheet className="h-5 w-5" />, keywords: ["upload", "csv"] },
      { label: "Dati contatore", href: "/dashboard/meter-data", icon: <Upload className="h-5 w-5" />, keywords: ["meter", "letture"] },
    ],
  },
  {
    label: "Finanza & conformità",
    description: "Incentivi, documenti fiscali e rendicontazione.",
    items: [
      { label: "Incentivi", href: "/dashboard/incentives", icon: <Coins className="h-5 w-5" />, keywords: ["gse", "pnrr"] },
      { label: "Fatturazione", href: "/dashboard/billing", icon: <Receipt className="h-5 w-5" />, keywords: ["invoice", "fatture"] },
      { label: "Pagamenti", href: "/dashboard/payments", icon: <CreditCard className="h-5 w-5" />, keywords: ["stripe", "pagopa"] },
      { label: "Report GSE", href: "/dashboard/gse-reports", icon: <FileText className="h-5 w-5" />, keywords: ["xml", "csv"] },
      { label: "Portale GSE", href: "/dashboard/gse-portal", icon: <FileCheck className="h-5 w-5" />, keywords: ["portale", "invio"] },
      { label: "Compliance ARERA", href: "/dashboard/arera-compliance", icon: <Scale className="h-5 w-5" />, keywords: ["compliance", "regole"] },
      { label: "Riconciliazione", href: "/dashboard/financial-reconciliation", icon: <Banknote className="h-5 w-5" />, keywords: ["pagamenti", "quadrature"] },
      { label: "Crediti CO₂", href: "/dashboard/carbon-credits", icon: <Leaf className="h-5 w-5" />, keywords: ["carbon", "co2"] },
    ],
  },
  {
    label: "Governance & community",
    description: "Coinvolgimento dei membri e comunicazione.",
    items: [
      { label: "Governance", href: "/dashboard/governance", icon: <Vote className="h-5 w-5" />, keywords: ["documenti", "annunci"] },
      { label: "Votazioni", href: "/dashboard/voting", icon: <ShieldCheck className="h-5 w-5" />, keywords: ["assemblea", "quorum"] },
      { label: "Documenti", href: "/dashboard/documents", icon: <FilePen className="h-5 w-5" />, keywords: ["template", "firma"] },
      { label: "Archivio", href: "/dashboard/storage", icon: <HardDrive className="h-5 w-5" />, keywords: ["files", "s3"] },
      { label: "Notifiche", href: "/dashboard/notifications", icon: <Bell className="h-5 w-5" />, keywords: ["preferences", "alert"] },
      { label: "Community", href: "/dashboard/community", icon: <Heart className="h-5 w-5" />, keywords: ["feed", "engagement"] },
      { label: "Sfide & badge", href: "/dashboard/gamification", icon: <Trophy className="h-5 w-5" />, keywords: ["gamification", "badge"] },
      { label: "Personalizza", href: "/dashboard/customize", icon: <LayoutDashboard className="h-5 w-5" />, keywords: ["tour", "layout"] },
    ],
  },
  {
    label: "Rete & dispositivi",
    description: "IoT, smart grid, EV, batterie e trading.",
    items: [
      { label: "Trading P2P", href: "/dashboard/trading", icon: <ArrowLeftRight className="h-5 w-5" />, keywords: ["mercato", "scambi"] },
      { label: "Smart grid", href: "/dashboard/smart-grid", icon: <Plug className="h-5 w-5" />, keywords: ["iot", "rete"] },
      { label: "PWA offline", href: "/dashboard/offline-pwa", icon: <Smartphone className="h-5 w-5" />, keywords: ["offline", "app"] },
      { label: "VPP federata", href: "/dashboard/vpp", icon: <Plug className="h-5 w-5" />, keywords: ["virtual power plant"] },
      { label: "Simulatore CER", href: "/dashboard/simulation", icon: <Calculator className="h-5 w-5" />, keywords: ["scenario", "business case"] },
    ],
  },
  {
    label: "AI & sviluppatori",
    description: "Automazione, AI, API e integrazioni.",
    items: [
      { label: "AI ottimizzazione", href: "/dashboard/ai-optimization", icon: <Brain className="h-5 w-5" />, keywords: ["ai", "ottimizzazione"] },
      { label: "Energy agents", href: "/dashboard/energy-agents", icon: <Brain className="h-5 w-5" />, keywords: ["agents", "automation"] },
      { label: "Sviluppatori", href: "/dashboard/developer-platform", icon: <Code className="h-5 w-5" />, keywords: ["oauth", "sdk"] },
      { label: "API & webhook", href: "/dashboard/api-platform", icon: <Key className="h-5 w-5" />, keywords: ["api", "integrazioni"] },
    ],
  },
  {
    label: "Scenari avanzati",
    description: "Multi-CER, digital twin e resilienza.",
    items: [
      { label: "Multi-CER", href: "/dashboard/multi-tenant", icon: <Building2 className="h-5 w-5" />, keywords: ["tenant", "federazione"] },
      { label: "Digital twin", href: "/dashboard/digital-twin", icon: <Calculator className="h-5 w-5" />, keywords: ["digital twin"] },
      { label: "Resilience mesh", href: "/dashboard/resilience", icon: <ShieldCheck className="h-5 w-5" />, keywords: ["resilience", "backup"] },
      { label: "Capitale CER", href: "/dashboard/community-capital", icon: <Coins className="h-5 w-5" />, keywords: ["capital", "funding"] },
      { label: "Federazione", href: "/dashboard/federation", icon: <Building2 className="h-5 w-5" />, keywords: ["network", "multi-cer"] },
    ],
  },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell brand="EnergiaNostra" sections={sections}>{children}</DashboardShell>;
}
