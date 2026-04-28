"use client";

import { useEffect, useState } from "react";
import { LayoutDashboard, Eye, EyeOff, RotateCcw, GripVertical, RefreshCw, Info } from "lucide-react";

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
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [availableWidgets, setAvailableWidgets] = useState<WidgetDefinition[]>([]);
  const [tour, setTour] = useState<TourStep[]>([]);
  const [tourCompleted, setTourCompleted] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard-config").then(r => r.json()),
      fetch("/api/dashboard-config?view=widgets").then(r => r.json()),
      fetch("/api/dashboard-config?view=tour").then(r => r.json()),
    ]).then(([layoutData, widgetsData, tourData]) => {
      setWidgets(layoutData.widgets || []);
      setTourCompleted(layoutData.tourCompleted || false);
      setAvailableWidgets(widgetsData.widgets || []);
      setTour(tourData.tour || []);
      if (!layoutData.tourCompleted && tourData.tour?.length > 0) {
        setShowTour(true);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const toggleVisibility = async (widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;

    const updated = widgets.map(w =>
      w.id === widgetId ? { ...w, visible: !w.visible } : w
    );
    setWidgets(updated);

    await fetch("/api/dashboard-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle-widget", widgetId, visible: !widget.visible }),
    });
  };

  const handleReset = async () => {
    setSaving(true);
    await fetch("/api/dashboard-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset" }),
    });
    // Refetch
    const data = await fetch("/api/dashboard-config").then(r => r.json());
    setWidgets(data.widgets || []);
    setSaving(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/dashboard-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save", widgets }),
    });
    setSaving(false);
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
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-8 w-8 animate-spin text-lime-600" />
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
                {currentTourStep < tour.length - 1 ? "Avanti →" : "Fine ✓"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-lime-950">Personalizza Dashboard</h1>
          <p className="text-zinc-500 mt-1">Scegli quali widget visualizzare e il loro ordine.</p>
        </div>
        <div className="flex gap-2">
          {!tourCompleted && (
            <button
              onClick={() => { setShowTour(true); setCurrentTourStep(0); }}
              className="flex items-center gap-2 rounded-xl border border-lime-200 px-4 py-2.5 text-sm font-medium text-lime-700 hover:bg-lime-50"
            >
              <Info className="h-4 w-4" /> Tour Guidato
            </button>
          )}
          <button
            onClick={handleReset}
            className="flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            <RotateCcw className="h-4 w-4" /> Ripristina
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-lime-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-lime-700 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <LayoutDashboard className="h-4 w-4" />}
            Salva Layout
          </button>
        </div>
      </div>

      {/* Widget List */}
      <div className="rounded-2xl border border-lime-100 bg-white">
        <div className="border-b border-lime-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-lime-950">Widget Disponibili</h2>
          <p className="text-sm text-zinc-500 mt-1">Trascina per riordinare, clicca l&apos;occhio per mostrare/nascondere.</p>
        </div>
        <div className="divide-y divide-zinc-50">
          {widgets.sort((a, b) => a.position - b.position).map((widget) => {
            const def = availableWidgets.find(w => w.type === widget.type);
            return (
              <div
                key={widget.id}
                className={`flex items-center gap-4 px-6 py-4 transition-colors ${widget.visible ? "" : "opacity-50"}`}
              >
                <GripVertical className="h-5 w-5 text-zinc-300 cursor-grab" />
                <span className="text-2xl">{def?.icon || "📊"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-lime-950">{widget.title}</p>
                  <p className="text-xs text-zinc-500">{def?.description || ""}</p>
                </div>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
                  {widget.size}
                </span>
                <button
                  onClick={() => toggleVisibility(widget.id)}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
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
