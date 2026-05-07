"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export interface SidebarItem {
  label: string;
  href: string;
  icon: ReactNode;
  keywords?: string[];
}

export interface SidebarSection {
  label: string;
  description?: string;
  items: SidebarItem[];
}

interface DashboardLayoutProps {
  brand: string;
  sections: SidebarSection[];
  children: ReactNode;
}

function DashboardNavLink({ item, pathname, onNavigate }: { item: SidebarItem; pathname: string; onNavigate?: () => void }) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500",
        isActive
          ? "bg-lime-100 text-lime-950 ring-1 ring-lime-200"
          : "text-zinc-600 hover:bg-amber-50 hover:text-lime-900"
      )}
    >
      <span className="h-5 w-5">{item.icon}</span>
      <span>{item.label}</span>
    </Link>
  );
}

export function DashboardShell({ brand, sections, children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredSections = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sections;

    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          const haystack = [item.label, item.href, ...(item.keywords || [])].join(" ").toLowerCase();
          return haystack.includes(query);
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [search, sections]);

  const navigation = (
    <>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cerca pagina o funzione"
          className="w-full rounded-2xl border border-lime-200 bg-amber-50/60 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-lime-500 focus:ring-2 focus:ring-lime-100"
        />
      </div>

      <nav className="mt-5 space-y-5" aria-label="Navigazione dashboard">
        {filteredSections.map((section) => (
          <section key={section.label} className="space-y-2">
            <div className="px-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{section.label}</p>
              {section.description ? <p className="mt-1 text-xs text-zinc-400">{section.description}</p> : null}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => (
                <DashboardNavLink key={item.href} item={item} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
              ))}
            </div>
          </section>
        ))}
        {filteredSections.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-lime-200 bg-amber-50/60 px-4 py-5 text-sm text-zinc-500">
            Nessun risultato per “{search}”. Prova con energia, fatture, votazioni o import.
          </div>
        ) : null}
      </nav>
    </>
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffbea_0%,#f7fee7_42%,#ffffff_100%)]">
      <div className="lg:flex">
        <aside className="hidden w-80 flex-shrink-0 border-r border-lime-100 bg-white/85 backdrop-blur lg:block">
          <div className="sticky top-0 flex h-screen flex-col">
            <div className="border-b border-lime-100 px-6 py-6">
              <Link href="/dashboard" className="text-xl font-black tracking-tight text-lime-950">
                {brand}
              </Link>
              <p className="mt-2 text-sm text-zinc-500">Gestione completa della tua CER, con priorità operative e accesso rapido ai flussi principali.</p>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-5">{navigation}</div>
          </div>
        </aside>

        <div className="flex-1">
          <header className="sticky top-0 z-40 border-b border-lime-100 bg-white/90 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
              <div>
                <Link href="/dashboard" className="text-lg font-black text-lime-950">
                  {brand}
                </Link>
                <p className="text-xs text-zinc-500">Dashboard CER</p>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/assessment" className="hidden text-sm font-semibold text-lime-700 sm:inline-flex">
                  Nuova analisi
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="rounded-2xl border border-lime-200 bg-white p-2 text-lime-950 shadow-sm"
                  aria-expanded={mobileOpen}
                  aria-controls="dashboard-mobile-drawer"
                  aria-label="Apri navigazione dashboard"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </div>
            </div>
          </header>

          {mobileOpen ? (
            <div className="fixed inset-0 z-50 bg-zinc-950/35 lg:hidden" role="dialog" aria-modal="true">
              <div id="dashboard-mobile-drawer" className="ml-auto flex h-full w-full max-w-sm flex-col bg-white shadow-2xl shadow-zinc-900/20">
                <div className="flex items-center justify-between border-b border-lime-100 px-5 py-4">
                  <div>
                    <p className="text-lg font-black text-lime-950">Navigazione</p>
                    <p className="text-sm text-zinc-500">Trova rapidamente la funzione che ti serve.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-2xl border border-lime-200 bg-white p-2 text-zinc-700"
                    aria-label="Chiudi navigazione dashboard"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-5">{navigation}</div>
              </div>
            </div>
          ) : null}

          <main id="main-content" className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
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
