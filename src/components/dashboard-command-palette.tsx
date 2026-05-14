"use client";

import { Search, X } from "lucide-react";
import { type CommandPaletteItem } from "@/components/dashboard-navigation";
import { cn } from "@/lib/utils";

interface DashboardCommandPaletteProps {
  commandLabel: string;
  highlightedIndex: number;
  listId: string;
  onClose: () => void;
  onHighlightChange: (index: number) => void;
  onNavigate: (href: string) => void;
  onQueryChange: (value: string) => void;
  paletteInputRef: React.RefObject<HTMLInputElement | null>;
  query: string;
  results: CommandPaletteItem[];
}

export function DashboardCommandPalette({
  commandLabel,
  highlightedIndex,
  listId,
  onClose,
  onHighlightChange,
  onNavigate,
  onQueryChange,
  paletteInputRef,
  query,
  results,
}: DashboardCommandPaletteProps) {
  return (
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
            onClick={onClose}
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
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Es. trading, fatture, smart grid, import"
              aria-controls={listId}
              aria-activedescendant={results[highlightedIndex] ? `palette-option-${results[highlightedIndex]?.href.replace(/[^a-z0-9-]/gi, "-")}` : undefined}
              className="w-full rounded-2xl border border-lime-200 bg-lime-50/60 py-3 pl-12 pr-4 text-sm outline-none transition focus:border-lime-500 focus:ring-2 focus:ring-lime-100"
            />
          </div>
          <p className="mt-3 text-xs text-zinc-500" aria-live="polite">
            {results.length > 0
              ? `${results.length} risultati disponibili. Shortcut: ${commandLabel}.`
              : `Nessun risultato disponibile per “${query}”.`}
          </p>
        </div>
        <ul id={listId} role="listbox" className="max-h-[28rem] overflow-y-auto px-3 py-3">
          {results.length > 0 ? (
            results.map((item, index) => {
              const optionId = `palette-option-${item.href.replace(/[^a-z0-9-]/gi, "-")}`;
              const isActive = index === highlightedIndex;
              return (
                <li key={item.href} id={optionId} role="option" aria-selected={isActive}>
                  <button
                    type="button"
                    onMouseEnter={() => onHighlightChange(index)}
                    onClick={() => onNavigate(item.href)}
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
  );
}
