"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { flattenSidebarItems, filterSidebarSections, type SidebarItem, type SidebarSection } from "@/components/dashboard-navigation";
import { cn } from "@/lib/utils";

export type { SidebarItem, SidebarSection } from "@/components/dashboard-navigation";

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
          : "text-zinc-600 hover:bg-amber-50 hover:text-lime-900",
      )}
    >
      <span className="h-5 w-5">{item.icon}</span>
      <span>{item.label}</span>
    </Link>
  );
}

export function DashboardShell({ brand, sections, children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const paletteInputRef = useRef<HTMLInputElement>(null);
  const paletteListId = useId();

  const commandLabel = useMemo(() => {
    if (typeof window === "undefined") {
      return "Ctrl K";
    }
    return /Mac|iPhone|iPad/.test(window.navigator.platform) ? "⌘K" : "Ctrl K";
  }, []);

  const filteredSections = useMemo(() => filterSidebarSections(sections, search), [search, sections]);
  const commandItems = useMemo(() => flattenSidebarItems(sections), [sections]);
  const paletteResults = useMemo(() => {
    const query = paletteQuery.trim().toLowerCase();
    const filtered = query
      ? commandItems.filter((item) => item.searchText.includes(query))
      : commandItems;
    return filtered.slice(0, 12);
  }, [commandItems, paletteQuery]);

  const closePalette = useCallback(() => {
    setPaletteOpen(false);
    setPaletteQuery("");
    setHighlightedIndex(0);
  }, []);

  const openPalette = useCallback(() => {
    setMobileOpen(false);
    setPaletteOpen(true);
    setPaletteQuery("");
    setHighlightedIndex(0);
  }, []);

  const navigateToItem = useCallback((href: string) => {
    closePalette();
    router.push(href);
  }, [closePalette, router]);

  useEffect(() => {
    if (!paletteOpen) {
      return undefined;
    }

    paletteInputRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [paletteOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((current) => !current);
        setMobileOpen(false);
        return;
      }

      if (!paletteOpen) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closePalette();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlightedIndex((current) => (paletteResults.length === 0 ? 0 : (current + 1) % paletteResults.length));
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightedIndex((current) => (paletteResults.length === 0 ? 0 : (current - 1 + paletteResults.length) % paletteResults.length));
        return;
      }

      if (event.key === "Enter") {
        const selected = paletteResults[highlightedIndex];
        if (!selected) {
          return;
        }
        event.preventDefault();
        navigateToItem(selected.href);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [highlightedIndex, paletteOpen, paletteResults]);

  const navigation = (
    <>
      <div className="space-y-3">
        <button
          type="button"
          onClick={openPalette}
          aria-keyshortcuts="Meta+K Control+K"
          className="flex w-full items-center justify-between rounded-2xl border border-lime-200 bg-lime-50/60 px-4 py-3 text-left text-sm font-medium text-zinc-700 transition hover:border-lime-300 hover:bg-lime-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
        >
          <span className="flex items-center gap-3">
            <Search className="h-4 w-4 text-lime-700" />
            Tavolo comandi rapido
          </span>
          <span className="rounded-xl border border-lime-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-500">{commandLabel}</span>
        </button>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filtra la navigazione"
            className="w-full rounded-2xl border border-lime-200 bg-amber-50/60 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-lime-500 focus:ring-2 focus:ring-lime-100"
          />
        </div>
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
          <div className="rounded-2xl border border-dashed border-lime-200 bg-amber-50/60 px-4 py-5 text-sm text-zinc-500" role="status" aria-live="polite">
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
                <button
                  type="button"
                  onClick={openPalette}
                  aria-keyshortcuts="Meta+K Control+K"
                  className="rounded-2xl border border-lime-200 bg-white px-3 py-2 text-sm font-semibold text-lime-700 shadow-sm"
                >
                  Comandi
                </button>
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
            <div className="fixed inset-0 z-50 bg-zinc-950/35 lg:hidden" role="dialog" aria-modal="true" aria-labelledby="dashboard-mobile-drawer-title">
              <div id="dashboard-mobile-drawer" className="ml-auto flex h-full w-full max-w-sm flex-col bg-white shadow-2xl shadow-zinc-900/20">
                <div className="flex items-center justify-between border-b border-lime-100 px-5 py-4">
                  <div>
                    <p id="dashboard-mobile-drawer-title" className="text-lg font-black text-lime-950">Navigazione</p>
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

          {paletteOpen ? (
            <div className="fixed inset-0 z-[60] flex items-start justify-center bg-zinc-950/45 px-4 py-12" role="dialog" aria-modal="true" aria-labelledby="dashboard-command-palette-title">
              <div className="w-full max-w-2xl rounded-[2rem] border border-lime-100 bg-white shadow-2xl shadow-zinc-900/20">
                <div className="flex items-start justify-between gap-4 border-b border-lime-100 px-6 py-5">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">Accesso rapido</p>
                    <h2 id="dashboard-command-palette-title" className="mt-2 text-2xl font-black text-zinc-950">Command palette dashboard</h2>
                    <p className="mt-1 text-sm text-zinc-500">Cerca pagine, flussi avanzati e strumenti operativi. Usa ↑ ↓ per navigare e Invio per aprire.</p>
                  </div>
                  <button
                    type="button"
                    onClick={closePalette}
                    className="rounded-2xl border border-lime-200 bg-white p-2 text-zinc-700"
                    aria-label="Chiudi command palette"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="border-b border-lime-100 px-6 py-4">
                  <label htmlFor="dashboard-command-palette-input" className="sr-only">Cerca pagina dashboard</label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-lime-700" />
                    <input
                      id="dashboard-command-palette-input"
                      ref={paletteInputRef}
                      type="search"
                      value={paletteQuery}
                      onChange={(event) => {
                        setPaletteQuery(event.target.value);
                        setHighlightedIndex(0);
                      }}
                      placeholder="Es. trading, fatture, smart grid, import"
                      aria-controls={paletteListId}
                      aria-activedescendant={paletteResults[highlightedIndex] ? `palette-option-${paletteResults[highlightedIndex]?.href.replace(/[^a-z0-9-]/gi, "-")}` : undefined}
                      className="w-full rounded-2xl border border-lime-200 bg-lime-50/60 py-3 pl-12 pr-4 text-sm outline-none transition focus:border-lime-500 focus:ring-2 focus:ring-lime-100"
                    />
                  </div>
                  <p className="mt-3 text-xs text-zinc-500" aria-live="polite">
                    {paletteResults.length > 0
                      ? `${paletteResults.length} risultati disponibili. Shortcut: ${commandLabel}.`
                      : `Nessun risultato disponibile per “${paletteQuery}”.`}
                  </p>
                </div>
                <ul id={paletteListId} role="listbox" className="max-h-[28rem] overflow-y-auto px-3 py-3">
                  {paletteResults.length > 0 ? (
                    paletteResults.map((item, index) => {
                      const optionId = `palette-option-${item.href.replace(/[^a-z0-9-]/gi, "-")}`;
                      const isActive = index === highlightedIndex;
                      return (
                        <li key={item.href} id={optionId} role="option" aria-selected={isActive}>
                          <button
                            type="button"
                            onMouseEnter={() => setHighlightedIndex(index)}
                            onClick={() => navigateToItem(item.href)}
                            className={cn(
                              "flex w-full items-start justify-between gap-4 rounded-2xl px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500",
                              isActive ? "bg-lime-100 text-lime-950" : "text-zinc-700 hover:bg-amber-50",
                            )}
                          >
                            <div>
                              <p className="text-sm font-semibold">{item.label}</p>
                              <p className="mt-1 text-xs text-zinc-500">{item.section} · {item.href}</p>
                              {item.description ? <p className="mt-2 text-sm text-zinc-600">{item.description}</p> : null}
                            </div>
                            <span className="rounded-xl border border-lime-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-500">Invio</span>
                          </button>
                        </li>
                      );
                    })
                  ) : (
                    <li className="px-4 py-6 text-sm text-zinc-500">
                      Nessuna scorciatoia trovata. Prova con termini come “compliance”, “pagamenti” o “forecasting”.
                    </li>
                  )}
                </ul>
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
            trend === "neutral" && "text-zinc-500",
          )}
        >
          {change}
        </p>
      )}
    </div>
  );
}
