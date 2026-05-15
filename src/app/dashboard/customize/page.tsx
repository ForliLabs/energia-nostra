"use client";

import { useCallback, useEffect, useState } from "react";
import { LayoutDashboard, Eye, EyeOff, RotateCcw, ChevronUp, ChevronDown, RefreshCw, Info } from "lucide-react";
import { FetchError } from "@/components/ui/fetch-error";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast-provider";

interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  position: number;
  size: string;
  visible: boolean;
}

interface WidgetDefinition {
  type: string;
  title: string;
  description: string;
  defaultSize: string;
  icon: string;
}

interface TourStep {
  id: string;
  title: string;
  content: string;
}

export default function CustomizePage() {
  const { showToast } = useToast();
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [availableWidgets, setAvailableWidgets] = useState<WidgetDefinition[]>([]);
  const [tour, setTour] = useState<TourStep[]>([]);
  const [tourCompleted, setTourCompleted] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const [layoutData, widgetsData, tourData] = await Promise.all([
        fetch("/api/dashboard-config").then(r => { if (!r.ok) throw new Error(`Errore ${r.status}`); return r.json(); }),
        fetch("/api/dashboard-config?view=widgets").then(r => { if (!r.ok) throw new Error(`Errore ${r.status}`); return r.json(); }),
        fetch("/api/dashboard-config?view=tour").then(r => { if (!r.ok) throw new Error(`Errore ${r.status}`); return r.json(); }),
      ]);
      setWidgets(layoutData.widgets || []);
      setTourCompleted(layoutData.tourCompleted || false);
      setAvailableWidgets(widgetsData.widgets || []);
      setTour(tourData.tour || []);
      if (!layoutData.tourCompleted && tourData.tour?.length > 0) {
        setShowTour(true);
      }
    } catch (e) {
      setError((e as Error).message || "Impossibile caricare la configurazione.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  const toggleVisibility = async (widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;

    const updated = widgets.map(w =>
      w.id === widgetId ? { ...w, visible: !w.visible } : w
    );
    setWidgets(updated);

    try {
      const r = await fetch("/api/dashboard-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle-widget", widgetId, visible: !widget.visible }),
      });
      if (!r.ok) throw new Error(`Errore ${r.status}`);
    } catch (e) {
      // Revert only the targeted widget's visibility; functional updater preserves concurrent reorder changes.
      setWidgets(prev => prev.map(w => w.id === widgetId ? { ...w, visible: widget.visible } : w));
      showToast({ title: "Impossibile aggiornare la visibilità", description: (e as Error).message, variant: "error" });
    }
  };

  /** Swap a widget up or down in the position order. */
  const moveWidget = (widgetId: string, direction: "up" | "down") => {
    setWidgets(prev => {
      const sorted = [...prev].sort((a, b) => a.position - b.position);
      const idx = sorted.findIndex(w => w.id === widgetId);
      if (direction === "up" && idx <= 0) return prev;
      if (direction === "down" && idx >= sorted.length - 1) return prev;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      const newSorted = sorted.map((w, i) => {
        if (i === idx) return { ...w, position: sorted[swapIdx].position };
        if (i === swapIdx) return { ...w, position: sorted[idx].position };
        return w;
      });
      return newSorted;
    });
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/dashboard-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      if (!r.ok) throw new Error(`Errore ${r.status}`);
      const data = await fetch("/api/dashboard-config").then(res => res.json()) as { widgets?: WidgetConfig[] };
      setWidgets(data.widgets || []);
      showToast({ title: "Layout ripristinato", description: "Le impostazioni predefinite sono state ricaricate.", variant: "success" });
    } catch (e) {
      showToast({ title: "Ripristino non riuscito", description: (e as Error).message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/dashboard-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", widgets }),
      });
      if (!r.ok) throw new Error(`Errore ${r.status}`);
      showToast({ title: "Layout salvato", description: "Le modifiche al layout sono state salvate.", variant: "success" });
    } catch (e) {
      showToast({ title: "Salvataggio non riuscito", description: (e as Error).message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const completeTourStep = async () => {
    if (currentTourStep < tour.length - 1) {
      setCurrentTourStep(prev => prev + 1);
    } else {
      setShowTour(false);
      setTourCompleted(true);
      await fetch("/api/dashboard-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete-tour" }),
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Dashboard" title="Personalizza Dashboard" description="Scegli quali widget visualizzare e il loro ordine." />
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm">
          <Skeleton className="h-6 w-48 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Dashboard" title="Personalizza Dashboard" description="Scegli quali widget visualizzare e il loro ordine." />
        <FetchError
          title="Impossibile caricare la configurazione"
          description="Verifica la connessione e riprova."
          errorDetail={error}
          onRetry={() => { setLoading(true); void fetchData(); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Tour Modal */}
      {showTour && tour.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-xl bg-lime-50 p-2.5">
                <Info className="h-5 w-5 text-lime-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">Passo {currentTourStep + 1} di {tour.length}</p>
                <h3 className="text-lg font-semibold text-lime-950">{tour[currentTourStep].title}</h3>
              </div>
            </div>
            <p className="text-sm text-zinc-600 mb-6">{tour[currentTourStep].content}</p>
            <div className="flex items-center justify-between">
              <button onClick={() => { setShowTour(false); setTourCompleted(true); }} className="text-sm text-zinc-500 hover:text-zinc-700">
                Salta tour
              </button>
              <button onClick={completeTourStep} className="rounded-xl bg-lime-600 px-4 py-2 text-sm font-medium text-white hover:bg-lime-700">
                {currentTourStep < tour.length - 1 ? "Avanti" : "Fine"}
              </button>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        eyebrow="Dashboard"
        title="Personalizza Dashboard"
        description="Scegli quali widget visualizzare e il loro ordine."
        actions={
          <>
            {!tourCompleted && (
              <button
                onClick={() => { setShowTour(true); setCurrentTourStep(0); }}
                className="flex items-center gap-2 rounded-xl border border-lime-200 px-4 py-2.5 text-sm font-medium text-lime-700 hover:bg-lime-50"
              >
                <Info className="h-4 w-4" /> Tour Guidato
              </button>
            )}
            <button
              onClick={() => void handleReset()}
              className="flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              <RotateCcw className="h-4 w-4" /> Ripristina
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-lime-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-lime-700 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <LayoutDashboard className="h-4 w-4" />}
              Salva Layout
            </button>
          </>
        }
      />

      {/* Widget List */}
      <div className="rounded-2xl border border-lime-100 bg-white">
        <div className="border-b border-lime-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-lime-950">Widget Disponibili</h2>
          <p className="text-sm text-zinc-500 mt-1">Usa le frecce su/giù per riordinare, clicca l&apos;occhio per mostrare/nascondere.</p>
        </div>
        <div className="divide-y divide-zinc-50">
          {[...widgets].sort((a, b) => a.position - b.position).map((widget, idx, sorted) => {
            const def = availableWidgets.find(w => w.type === widget.type);
            return (
              <div
                key={widget.id}
                className={`flex items-center gap-4 px-6 py-4 transition-colors ${widget.visible ? "" : "opacity-50"}`}
              >
                {/* Up/down reorder controls */}
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveWidget(widget.id, "up")}
                    disabled={idx === 0}
                    className="rounded p-0.5 text-zinc-300 hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-30 disabled:cursor-default"
                    aria-label={`Sposta ${widget.title} su`}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveWidget(widget.id, "down")}
                    disabled={idx === sorted.length - 1}
                    className="rounded p-0.5 text-zinc-300 hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-30 disabled:cursor-default"
                    aria-label={`Sposta ${widget.title} giù`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-2xl">{def?.icon || "📊"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-lime-950">{widget.title}</p>
                  <p className="text-xs text-zinc-500">{def?.description || ""}</p>
                </div>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
                  {widget.size}
                </span>
                <button
                  onClick={() => void toggleVisibility(widget.id)}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                  aria-label={widget.visible ? `Nascondi ${widget.title}` : `Mostra ${widget.title}`}
                >
                  {widget.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Role Info */}
      <div className="rounded-2xl border border-lime-100 bg-white p-6">
        <h2 className="text-lg font-semibold text-lime-950 mb-4">Layout Predefiniti per Ruolo</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { role: "admin", label: "Amministratore CER", widgets: "14 widget", desc: "KPI, fatturazione, conformità, membri" },
            { role: "member", label: "Membro", widgets: "8 widget", desc: "Risparmi, energia, votazioni, badge" },
            { role: "auditor", label: "Revisore", widgets: "7 widget", desc: "Audit trail, conformità, finanze" },
            { role: "superadmin", label: "Super Admin", widgets: "14 widget", desc: "Portfolio CER, API, tutto" },
          ].map(r => (
            <div key={r.role} className="rounded-xl border border-zinc-100 p-4">
              <p className="text-sm font-semibold text-lime-950">{r.label}</p>
              <p className="text-xs text-lime-600 mt-1">{r.widgets}</p>
              <p className="text-xs text-zinc-500 mt-1">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
