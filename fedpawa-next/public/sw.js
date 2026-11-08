/* ==========================================================
 * FEDPAWA — Service Worker (PWA)
 * Doc Next 16 : node_modules/next/dist/docs/01-app/02-guides/
 * progressive-web-apps.md (SW dans /public, enregistré via
 * navigator.serviceWorker.register('/sw.js')).
 *
 * Stratégies :
 *  - /_next/static/** + /assets/** : cache-first (immutables,
 *    hashés) — miss réseau puis mise en cache.
 *  - Pages (navigations HTML) : network-first + fallback cache,
 *    puis /offline.html en dernier recours.
 *  - Autres same-origin GET : stale-while-revalidate.
 *
 * Push :
 *  - 'push' → showNotification(title, { body, icon 192, badge,
 *    data.url, vibrate, dir:auto }) — payload Laravel PushService :
 *    { title, body, url, type }.
 *  - 'notificationclick' → focus client existant sur data.url sinon
 *    openWindow(data.url).
 *  - 'pushsubscriptionchange' → réabonnement auto : nouvelle
 *    souscription avec VAPID relue sur GET /api/v1/push/vapid
 *    (public, sans auth — PushController Laravel).
 * ========================================================== */

const VERSION = 'fedpawa-v1';
const STATIC_CACHE = `${VERSION}-static`;
const PAGES_CACHE = `${VERSION}-pages`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const OFFLINE_URL = '/offline.html';
const MAX_PAGES = 30;
const MAX_RUNTIME = 30;

const ICON_192 = '/icons/icon-192x192.png';
const BADGE_192 = '/icons/maskable-icon-192x192.png';

/* ---------- Install : précache du fallback offline ---------- */

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PAGES_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, ICON_192, BADGE_192]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(VERSION))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/* ---------- Helpers cache ---------- */

function trimCache(name, maxEntries) {
  caches.open(name).then((cache) =>
    cache.keys().then((keys) => {
      if (keys.length <= maxEntries) return;
      cache.delete(keys[0]).then(() => trimCache(name, maxEntries));
    }),
  );
}

function cacheFirst(request, cacheName) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.ok) {
          const clone = response.clone();
          cache.put(request, clone).then(() => trimCache(cacheName, 200));
        }
        return response;
      });
    }),
  );
}

function staleWhileRevalidate(request, cacheName) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            cache.put(request, clone).then(() => trimCache(cacheName, MAX_RUNTIME));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
}

function networkFirstPage(event, request) {
  return fetch(request)
    .then((response) => {
      const copy = response.clone();
      caches.open(PAGES_CACHE).then((cache) => {
        cache.put(request, copy).then(() => trimCache(PAGES_CACHE, MAX_PAGES));
      });
      return response;
    })
    .catch(() =>
      caches.open(PAGES_CACHE).then((cache) =>
        cache.match(request).then((cached) => cached || cache.match(OFFLINE_URL)),
      ),
    );
}

/* ---------- Fetch : routage par stratégie ---------- */

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // API : JAMAIS de cache. Les réponses /api/* sont authentifiées (Bearer) et
  // propres à un compte ; les mettre en cache (SWR ci-dessous) les servirait à
  // un autre utilisateur du même navigateur. Pas de respondWith = réseau natif.
  if (url.pathname.startsWith('/api/') || request.headers.get('authorization')) {
    return;
  }

  // Assets immutables (hashés) : cache-first.
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Navigations (pages HTML) : network-first + fallback offline.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(event, request));
    return;
  }

  // Le reste (fonts, icons, manifest…) : stale-while-revalidate.
  event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});

/* ---------- Push ---------- */

self.addEventListener('push', (event) => {
  let data = { title: 'FEDPAWA', body: '', url: '/' };
  try {
    if (event.data) {
      const parsed = event.data.json();
      data = {
        title: parsed.title || data.title,
        body: parsed.body || data.body,
        url: parsed.url || data.url,
      };
    }
  } catch (e) {
    // Payload non-JSON : corps texte brut.
    if (event.data) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: ICON_192,
      badge: BADGE_192,
      data: { url: data.url },
      vibrate: [100, 50, 100],
      dir: 'auto',
      lang: 'fr',
      tag: `fedpawa-${Date.now()}`,
      renotify: true,
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl =
    (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        if (clientUrl.pathname === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});

/* ---------- Réabonnement auto (VAPID relue côté API) ---------- */

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      try {
        // 1. Clé publique VAPID fraîche (endpoint PUBLIC Laravel).
        const vapidResponse = await fetch('/api/v1/push/vapid', {
          headers: { Accept: 'application/json' },
        });
        if (!vapidResponse.ok) throw new Error(`vapid ${vapidResponse.status}`);
        const { publicKey } = await vapidResponse.json();
        if (!publicKey) throw new Error('vapid absente');

        // 2. Nouvelle souscription avec cette clé.
        const registration = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        // 3. Les clients ouverts re-postent /push/subscribe (Bearer
        //    côté fenêtre — le SW n'a pas accès au localStorage).
        const clientList = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true,
        });
        const raw = registration.toJSON();
        clientList.forEach((client) => {
          client.postMessage({
            type: 'PUSH_RESUBSCRIBE',
            endpoint: raw.endpoint,
            keys: raw.keys,
          });
        });
        return registration;
      } catch (e) {
        // Best-effort : sans VAPID ou sans client ouvert, on
        // abandonne silencieusement (l'utilisateur pourra
        // re-souscrire via le bouton du header).
        return null;
      }
    })(),
  );
});

/* ---------- Utilitaires ---------- */

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = self.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
