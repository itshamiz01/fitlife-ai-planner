/* Fit Life Bro caches public assets only. Health records, sessions, API responses,
   and online HTML pages must always come from the server. */
const CACHE_NAME = "fitlife-public-v3";
const OFFLINE_PAGE = "/offline.html";
const PUBLIC_SHELL = [OFFLINE_PAGE, "/icons/icon-192-dual-leaf.png", "/icons/icon-512-dual-leaf.png", "/icons/apple-touch-icon-dual-leaf.png"];

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

// Web Push is only available when a subscription and server scheduler are configured.
self.addEventListener("push", event => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch { /* Use a safe generic message. */ }
  const title = typeof payload.title === "string" ? payload.title.slice(0, 100) : "Time for a water break 💧";
  const reminderId = typeof payload.reminderId === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(payload.reminderId) ? payload.reminderId : null;
  const body = typeof payload.body === "string" ? payload.body.slice(0, 200) : "Take a water break if you need one.";
  event.waitUntil(self.registration.showNotification(title, { body, icon: "/icons/icon-192-dual-leaf.png", badge: "/icons/icon-192-dual-leaf.png", tag: "fitlife-water-push", actions: [{ action: "confirm-water", title: "I drank water" }], data: { reminderId } }));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async clients => {
    const destination = new URL("/?view=water&reminder=confirm", self.location.origin);
    const reminderId = event.notification.data?.reminderId;
    if (typeof reminderId === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(reminderId)) destination.searchParams.set("reminderId", reminderId);
    const url = destination.href;
    const existing = clients.find(client => new URL(client.url).origin === self.location.origin);
    if (existing) { await existing.navigate(url); return existing.focus(); }
    return self.clients.openWindow(url);
  }));
});
