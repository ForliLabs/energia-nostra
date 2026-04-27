"use client";

import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck, Mail, Smartphone, Settings, RefreshCw } from "lucide-react";

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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<PreferenceCategory[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [view, setView] = useState<"notifications" | "preferences">("notifications");
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/notifications").then(r => r.json()),
      fetch("/api/notifications?view=unread-count").then(r => r.json()),
      fetch("/api/notifications?view=preferences").then(r => r.json()),
    ]).then(([notifData, countData, prefsData]) => {
      setNotifications(notifData.notifications || []);
      setUnreadCount(countData.count || 0);
      setPreferences(prefsData.preferences?.categories || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const markRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark-read", notificationId: id }),
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark-all-read" }),
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-lime-950">Centro Notifiche</h1>
          <p className="text-zinc-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} notifiche non lette` : "Nessuna notifica non letta"}
          </p>
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
                <p>Nessuna notifica. Le notifiche appariranno qui quando ci saranno eventi nella tua CER.</p>
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
            <p className="text-sm text-zinc-500 mt-1">Scegli come ricevere le notifiche per ogni categoria.</p>
          </div>
          <div className="divide-y divide-zinc-50">
            {preferences.map((pref) => (
              <div key={pref.category} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-lime-950">{categoryLabels[pref.category] || pref.category}</p>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Bell className="h-3.5 w-3.5" />
                    <input
                      type="checkbox"
                      checked={pref.inAppEnabled}
                      onChange={() => {}}
                      className="rounded border-zinc-300"
                    />
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Smartphone className="h-3.5 w-3.5" />
                    <input
                      type="checkbox"
                      checked={pref.pushEnabled}
                      onChange={() => {}}
                      className="rounded border-zinc-300"
                    />
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Mail className="h-3.5 w-3.5" />
                    <input
                      type="checkbox"
                      checked={pref.emailEnabled}
                      onChange={() => {}}
                      className="rounded border-zinc-300"
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
