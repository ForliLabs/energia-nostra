"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Check, CheckCheck, Mail, Smartphone, Settings } from "lucide-react";
import { DataFreshness } from "@/components/ui/data-freshness";
import { FetchError } from "@/components/ui/fetch-error";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast-provider";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  actionUrl: string | null;
  read: boolean;
  createdAt: string;
}

interface PreferenceCategory {
  category: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  inAppEnabled: boolean;
}

const categoryLabels: Record<string, string> = {
  billing: "Fatturazione",
  voting: "Votazioni",
  energy: "Energia",
  trading: "Trading P2P",
  governance: "Governance",
  gamification: "Sfide & Badge",
};

function NotificationsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="mt-2 h-4 w-36" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>
      <div className="rounded-2xl border border-lime-100 bg-white divide-y divide-zinc-50">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4 px-6 py-4">
            <Skeleton className="mt-1 h-2 w-2 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-3 w-72" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<PreferenceCategory[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [view, setView] = useState<"notifications" | "preferences">("notifications");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  // Track which preference fields are currently being saved
  const [savingPrefs, setSavingPrefs] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const [notifData, countData, prefsData] = await Promise.all([
        fetch("/api/notifications").then(r => {
          if (!r.ok) throw new Error(`Errore ${r.status}`);
          return r.json();
        }),
        fetch("/api/notifications?view=unread-count").then(r => {
          if (!r.ok) throw new Error(`Errore ${r.status}`);
          return r.json();
        }),
        fetch("/api/notifications?view=preferences").then(r => {
          if (!r.ok) throw new Error(`Errore ${r.status}`);
          return r.json();
        }),
      ]);
      setNotifications(notifData.notifications || []);
      setUnreadCount(countData.count || 0);
      setPreferences(prefsData.preferences?.categories || []);
      setLastUpdated(new Date().toISOString());
    } catch (caughtError) {
      setError((caughtError as Error).message || "Impossibile caricare le notifiche.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  const markRead = async (id: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-read", notificationId: id }),
      });
      if (!response.ok) throw new Error(`Errore ${response.status}`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      showToast({
        title: "Impossibile aggiornare la notifica",
        description: (e as Error).message,
        variant: "error",
      });
    }
  };

  const markAllRead = async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-all-read" }),
      });
      if (!response.ok) throw new Error(`Errore ${response.status}`);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      showToast({
        title: "Impossibile segnare tutte come lette",
        description: (e as Error).message,
        variant: "error",
      });
    }
  };

  const updatePreference = async (
    category: string,
    field: "pushEnabled" | "emailEnabled" | "inAppEnabled",
    newValue: boolean,
  ) => {
    const key = `${category}-${field}`;
    // Guard: if the preference record doesn't exist, do nothing — no optimistic mutation, no inconsistent state.
    const pref = preferences.find(p => p.category === category);
    if (!pref) return;

    // Optimistic update
    setPreferences(prev =>
      prev.map(p => p.category === category ? { ...p, [field]: newValue } : p),
    );
    setSavingPrefs(prev => new Set(prev).add(key));

    try {
      const updated = { ...pref, [field]: newValue };
      const r = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-preference",
          category,
          pushEnabled: updated.pushEnabled,
          emailEnabled: updated.emailEnabled,
          inAppEnabled: updated.inAppEnabled,
        }),
      });
      if (!r.ok) throw new Error(`Errore ${r.status}`);
      showToast({ title: "Preferenza aggiornata", variant: "success" });
    } catch (e) {
      // Revert optimistic update
      setPreferences(prev =>
        prev.map(p => p.category === category ? { ...p, [field]: !newValue } : p),
      );
      showToast({
        title: "Impossibile aggiornare la preferenza",
        description: (e as Error).message,
        variant: "error",
      });
    } finally {
      setSavingPrefs(prev => { const next = new Set(prev); next.delete(key); return next; });
    }
  };

  if (loading) {
    return <NotificationsSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-lime-950">Centro Notifiche</h1>
        </div>
        <FetchError
          title="Impossibile caricare le notifiche"
          description="Verifica la connessione e riprova. Se il problema persiste, potrebbe esserci un intervento di manutenzione in corso."
          errorDetail={error}
          onRetry={() => { setLoading(true); void fetchData(); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-lime-950">Centro Notifiche</h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-zinc-500">
              {unreadCount > 0 ? `${unreadCount} notifiche non lette` : "Nessuna notifica non letta"}
            </p>
            <DataFreshness
              lastUpdated={lastUpdated}
              onRefresh={() => { setLoading(true); void fetchData(); }}
              refreshing={loading}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView("notifications")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${view === "notifications" ? "bg-lime-100 text-lime-950" : "text-zinc-600 hover:bg-zinc-100"}`}
          >
            <Bell className="h-4 w-4" /> Notifiche
          </button>
          <button
            onClick={() => setView("preferences")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${view === "preferences" ? "bg-lime-100 text-lime-950" : "text-zinc-600 hover:bg-zinc-100"}`}
          >
            <Settings className="h-4 w-4" /> Preferenze
          </button>
        </div>
      </div>

      {view === "notifications" ? (
        <div className="space-y-4">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 text-sm text-lime-700 hover:text-lime-900"
            >
              <CheckCheck className="h-4 w-4" /> Segna tutte come lette
            </button>
          )}

          <div className="rounded-2xl border border-lime-100 bg-white divide-y divide-zinc-50">
            {notifications.length === 0 ? (
              <div className="px-6 py-12 text-center text-zinc-400">
                <Bell className="h-12 w-12 mx-auto mb-3 text-zinc-300" />
                <p className="font-medium text-zinc-500">Nessuna notifica</p>
                <p className="mt-1 text-sm">Le notifiche appariranno qui quando ci saranno eventi nella tua CER, come nuove votazioni, fatture o aggiornamenti energetici.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 px-6 py-4 ${!n.read ? "bg-lime-50/50" : ""}`}
                >
                  <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${!n.read ? "bg-lime-500" : "bg-transparent"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-lime-950">{n.title}</p>
                    <p className="text-sm text-zinc-500 mt-0.5">{n.body}</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      {new Date(n.createdAt).toLocaleString("it-IT")}
                    </p>
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="flex-shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                      aria-label={`Segna "${n.title}" come letta`}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-lime-100 bg-white">
          <div className="border-b border-lime-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-lime-950">Preferenze di Notifica</h2>
            <p className="text-sm text-zinc-500 mt-1">Scegli come ricevere le notifiche per ogni categoria. Le modifiche vengono salvate automaticamente.</p>
          </div>
          <div className="divide-y divide-zinc-50">
            {/* Visible column headers for the checkbox matrix */}
            <div
              aria-hidden="true"
              className="flex items-center justify-between bg-zinc-50/70 px-6 py-2 text-xs font-semibold text-zinc-400"
            >
              <span>Categoria</span>
              <div className="flex items-center gap-5">
                <span className="flex shrink-0 items-center gap-1.5"><Bell className="h-3.5 w-3.5" />App</span>
                <span className="flex shrink-0 items-center gap-1.5"><Smartphone className="h-3.5 w-3.5" />Push</span>
                <span className="flex shrink-0 items-center gap-1.5"><Mail className="h-3.5 w-3.5" />Email</span>
              </div>
            </div>
            {preferences.map((pref) => (
              <div key={pref.category} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-lime-950">{categoryLabels[pref.category] || pref.category}</p>
                </div>
                <div className="flex items-center gap-5">
                  <label className="flex items-center gap-1.5 text-xs text-zinc-500 cursor-pointer select-none" title="In-app">
                    <Bell className="h-3.5 w-3.5" />
                    <input
                      type="checkbox"
                      checked={pref.inAppEnabled}
                      disabled={savingPrefs.has(`${pref.category}-inAppEnabled`)}
                      onChange={(e) => void updatePreference(pref.category, "inAppEnabled", e.target.checked)}
                      className="rounded border-zinc-300 accent-lime-600 cursor-pointer"
                      aria-label={`Notifica in-app per ${categoryLabels[pref.category] || pref.category}`}
                    />
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-zinc-500 cursor-pointer select-none" title="Push">
                    <Smartphone className="h-3.5 w-3.5" />
                    <input
                      type="checkbox"
                      checked={pref.pushEnabled}
                      disabled={savingPrefs.has(`${pref.category}-pushEnabled`)}
                      onChange={(e) => void updatePreference(pref.category, "pushEnabled", e.target.checked)}
                      className="rounded border-zinc-300 accent-lime-600 cursor-pointer"
                      aria-label={`Notifica push per ${categoryLabels[pref.category] || pref.category}`}
                    />
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-zinc-500 cursor-pointer select-none" title="Email">
                    <Mail className="h-3.5 w-3.5" />
                    <input
                      type="checkbox"
                      checked={pref.emailEnabled}
                      disabled={savingPrefs.has(`${pref.category}-emailEnabled`)}
                      onChange={(e) => void updatePreference(pref.category, "emailEnabled", e.target.checked)}
                      className="rounded border-zinc-300 accent-lime-600 cursor-pointer"
                      aria-label={`Notifica email per ${categoryLabels[pref.category] || pref.category}`}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

