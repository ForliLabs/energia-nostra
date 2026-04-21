"use client";

import type { ReactNode } from "react";
import { BarChart3, Coins, FileText, Home, Receipt, ShieldCheck, Upload, Users, Vote } from "lucide-react";
import { DashboardShell } from "@/components/dashboard";

const items = [
  { label: "Panoramica", href: "/dashboard", icon: <Home className="h-5 w-5" /> },
  { label: "Membri", href: "/dashboard/members", icon: <Users className="h-5 w-5" /> },
  { label: "Energia", href: "/dashboard/energy", icon: <BarChart3 className="h-5 w-5" /> },
  { label: "Incentivi", href: "/dashboard/incentives", icon: <Coins className="h-5 w-5" /> },
  { label: "Governance", href: "/dashboard/governance", icon: <Vote className="h-5 w-5" /> },
  { label: "Votazioni", href: "/dashboard/voting", icon: <ShieldCheck className="h-5 w-5" /> },
  { label: "Dati contatore", href: "/dashboard/meter-data", icon: <Upload className="h-5 w-5" /> },
  { label: "Report GSE", href: "/dashboard/gse-reports", icon: <FileText className="h-5 w-5" /> },
  { label: "Fatturazione", href: "/dashboard/billing", icon: <Receipt className="h-5 w-5" /> },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell brand="EnergiaNostra" items={items}>{children}</DashboardShell>;
}
