/* Fit Life Bro caches public assets only. Health records, sessions, API responses,
   and online HTML pages must always come from the server. */
const CACHE_NAME = "fitlife-public-v2";
const OFFLINE_PAGE = "/offline.html";
const PUBLIC_SHELL = [OFFLINE_PAGE, "/icons/icon-192.png", "/icons/icon-512.png", "/icons/apple-touch-icon.png"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PUBLIC_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => (key.startsWith("wellnest-public-") || key.startsWith("fitlife-public-")) && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname === "/api" || url.pathname.startsWith("/api/")) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () => {
      const fallback = await caches.match(OFFLINE_PAGE);
      return fallback || new Response("You're offline. Reconnect to open Fit Life Bro.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }));
    return;
  }
  const publicAsset = url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/fonts/");
  if (!publicAsset) return;
  event.respondWith(caches.open(CACHE_NAME).then(async cache => {
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      try {
        await cache.put(request, response.clone());
        const entries = await cache.keys();
        if (entries.length > 80) {
          const removable = entries.filter(entry => !PUBLIC_SHELL.includes(new URL(entry.url).pathname));
          await Promise.all(removable.slice(0, entries.length - 80).map(entry => cache.delete(entry)));
        }
      } catch { /* A full cache must not prevent online use. */ }
    }
    return response;
  }));
});
