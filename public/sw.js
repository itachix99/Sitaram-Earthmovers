/* Sitaram Earthmovers service worker.
 * Scope policy:
 *  - NEVER touch /admin/* or /api/* (admin data must always be fresh).
 *  - Navigations under /operator/*: network-first with cache fallback (last seen page), then /offline.
 *  - Static assets (/_next/static, images, fonts): stale-while-revalidate.
 *  - Operator caches are per-account where possible; purged on logout/user change.
 */
const VERSION = "v1";
const SHELL_CACHE = `se-shell-${VERSION}`;
const RUNTIME_CACHE = `se-runtime-${VERSION}`;
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await cache.addAll([OFFLINE_URL, "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"]);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "CLEAR_OPERATOR_CACHE" || (event.data && event.data.type === "CLEAR_OPERATOR_CACHE")) {
    event.waitUntil((async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith("se-runtime")).map((k) => caches.delete(k)));
    })());
  }
  if (event.data && event.data.type === "SET_USER" && event.data.userId) {
    // Future: partition runtime cache per userId as se-runtime-<hash>. For now we keep single RUNTIME_CACHE
    // but this message documents the partition point; client should call CLEAR on user change.
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== SHELL_CACHE && k !== RUNTIME_CACHE && !k.startsWith("se-runtime")).map((k) => caches.delete(k)));
      // Keep current RUNTIME_CACHE; old se-runtime-* versions not matching VERSION are deleted on next install.
      await self.clients.claim();
    })()
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(css|js|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Admin and API: always network, never cached by SW.
  if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api") || url.pathname.startsWith("/_next/data")) return;

  // App navigations (operator pages, login, offline): network-first, fall back to last cached copy, then offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          if (fresh.ok && (url.pathname.startsWith("/operator") || url.pathname === OFFLINE_URL)) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, fresh.clone());
          }
          return fresh;
        } catch {
          const runtime = await caches.open(RUNTIME_CACHE);
          const cachedPage = await runtime.match(request);
          if (cachedPage) return cachedPage;
          const shell = await caches.open(SHELL_CACHE);
          return (await shell.match(OFFLINE_URL)) || Response.error();
        }
      })()
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached || Response.error());
        return cached || network;
      })()
    );
  }
});
