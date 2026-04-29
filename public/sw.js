// Service Worker for EnergiaNostra PWA — v4 with Offline-First
// Implements: cache strategies, offline queue, background sync, IndexedDB

const CACHE_NAME = "energianostra-v4";
const API_CACHE = "energianostra-api-v4";
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/portale",
  "/manifest.json",
  "/offline.html",
];

// Cache strategy configuration
const CACHE_STRATEGIES = {
  // Cache-first (static assets)
  CACHE_FIRST: [
    /\/_next\/static\//,
    /\/icons\//,
    /\/manifest\.json$/,
    /\.(png|jpg|jpeg|svg|gif|woff2?)$/,
  ],
  // Network-first (API data)
  NETWORK_FIRST: [
    /\/api\/energy/,
    /\/api\/members/,
    /\/api\/dashboard-config/,
    /\/api\/forecasting/,
    /\/api\/ai-optimization/,
    /\/api\/arera-compliance/,
    /\/api\/smart-grid/,
    /\/api\/community/,
    /\/api\/gse-portal/,
    /\/api\/financial-reconciliation/,
    /\/api\/developer-platform/,
    /\/api\/simulation/,
  ],
  // Stale-while-revalidate (pages)
  STALE_WHILE_REVALIDATE: [
    /\/dashboard/,
    /\/portale/,
    /\/api\/notifications/,
    /\/api\/offline-pwa/,
  ],
  // Network-only (mutations — queued when offline)
  NETWORK_ONLY: [
    /\/api\/meter-upload/,
    /\/api\/votes/,
  ],
};

// ── IndexedDB for Offline Queue ──

const DB_NAME = "energianostra-offline";
const DB_VERSION = 1;
const QUEUE_STORE = "offlineQueue";

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function queueRequest(request) {
  const db = await openDB();
  const tx = db.transaction(QUEUE_STORE, "readwrite");
  const body = request.method !== "GET" ? await request.clone().text() : null;
  tx.objectStore(QUEUE_STORE).add({
    id: `oq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body,
    timestamp: Date.now(),
    retryCount: 0,
    status: "queued",
  });
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function replayQueue() {
  const db = await openDB();
  const tx = db.transaction(QUEUE_STORE, "readonly");
  const store = tx.objectStore(QUEUE_STORE);
  const items = await new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
  });

  for (const item of items) {
    try {
      await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      });
      // Remove from queue on success
      const deleteTx = db.transaction(QUEUE_STORE, "readwrite");
      deleteTx.objectStore(QUEUE_STORE).delete(item.id);
    } catch {
      // Will retry on next sync
    }
  }
}

// ── Strategy Matchers ──

function matchesStrategy(url, patterns) {
  return patterns.some((pattern) => pattern.test(url));
}

// ── Install ──

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate ──

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch Handler ──

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Skip non-GET POST to mutation endpoints — queue if offline
  if (event.request.method !== "GET") {
    if (matchesStrategy(url, CACHE_STRATEGIES.NETWORK_ONLY)) {
      event.respondWith(
        fetch(event.request).catch(async () => {
          await queueRequest(event.request);
          return new Response(
            JSON.stringify({ queued: true, message: "Richiesta accodata per invio offline" }),
            { status: 202, headers: { "Content-Type": "application/json" } }
          );
        })
      );
    }
    return;
  }

  // Cache-first strategy
  if (matchesStrategy(url, CACHE_STRATEGIES.CACHE_FIRST)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Stale-while-revalidate strategy
  if (matchesStrategy(url, CACHE_STRATEGIES.STALE_WHILE_REVALIDATE)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(API_CACHE).then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Network-first strategy (API data)
  if (matchesStrategy(url, CACHE_STRATEGIES.NETWORK_FIRST)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Default: network with cache fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("/offline.html");
          }
          return new Response("Offline", { status: 503 });
        });
    })
  );
});

// ── Background Sync ──

self.addEventListener("sync", (event) => {
  if (event.tag === "energia-nostra-sync") {
    event.waitUntil(replayQueue());
  }
});

// ── Push Notifications ──

self.addEventListener("push", (event) => {
  const data = event.data?.json() || {
    title: "EnergiaNostra",
    body: "Nuova notifica dalla tua CER",
    icon: "/icons/icon-192x192.png",
  };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      tag: data.tag || "energianostra-notification",
      data: { url: data.url || "/dashboard" },
    })
  );
});

// ── Notification Click ──

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});

// ── Periodic Sync (for background data refresh) ──

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "energia-nostra-refresh") {
    event.waitUntil(
      caches.open(API_CACHE).then((cache) =>
        Promise.all([
          cache.add("/api/energy"),
          cache.add("/api/notifications"),
          cache.add("/api/ai-optimization"),
        ]).catch(() => {})
      )
    );
  }
});
