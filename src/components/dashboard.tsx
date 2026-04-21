"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface SidebarItem {
  label: string;
  href: string;
  icon: ReactNode;
}

interface DashboardLayoutProps {
  brand: string;
  items: SidebarItem[];
  children: ReactNode;
}

export function DashboardShell({ brand, items, children }: DashboardLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffbea_0%,#f7fee7_42%,#ffffff_100%)]">
      <div className="lg:flex">
        <aside className="hidden w-72 flex-shrink-0 border-r border-lime-100 bg-white/80 backdrop-blur lg:block">
          <div className="flex h-full flex-col">
            <div className="border-b border-lime-100 px-6 py-5">
              <Link href="/dashboard" className="text-xl font-black tracking-tight text-lime-950">
                {brand}
              </Link>
              <p className="mt-2 text-sm text-zinc-500">Gestione completa della tua CER in Romagna.</p>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
              {items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-lime-100 text-lime-950 ring-1 ring-lime-200"
                        : "text-zinc-600 hover:bg-amber-50 hover:text-lime-900"
                    )}
                  >
                    <span className="h-5 w-5">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="flex-1">
          <header className="border-b border-lime-100 bg-white/85 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between px-4 py-4 sm:px-6">
              <Link href="/dashboard" className="text-lg font-black text-lime-950">
                {brand}
              </Link>
              <Link href="/assessment" className="text-sm font-semibold text-lime-700">
                Nuova analisi
              </Link>
            </div>
            <nav className="flex gap-2 overflow-x-auto px-4 pb-4 sm:px-6">
              {items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex min-w-fit items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium",
                      isActive
                        ? "border-lime-200 bg-lime-100 text-lime-950"
                        : "border-amber-200 bg-white text-zinc-600"
                    )}
                  >
                    <span className="h-4 w-4">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>

          <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
}

export function StatCard({ label, value, change, trend }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm shadow-lime-100/40">
      <p className="text-sm font-medium text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-zinc-950">{value}</p>
      {change && (
        <p
          className={cn(
            "mt-2 text-sm font-medium",
            trend === "up" && "text-lime-700",
            trend === "down" && "text-red-600",
            trend === "neutral" && "text-zinc-500"
          )}
        >
          {change}
        </p>
      )}
    </div>
  );
}
