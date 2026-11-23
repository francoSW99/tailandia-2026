// Guarda la app en el teléfono para que abra sin internet.
// Con internet trae la última versión (espera hasta 4 s); sin internet usa la copia guardada.
const VERSION = "20261123-034605";
const CACHE = "tailandia-" + VERSION;
const ARCHIVOS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "./fuentes/atkinson-hyperlegible-italic-400.woff2", "./fuentes/atkinson-hyperlegible-normal-400.woff2", "./fuentes/atkinson-hyperlegible-normal-700.woff2", "./fuentes/bricolage-grotesque-normal-600.woff2", "./fuentes/ibm-plex-mono-normal-500.woff2"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ARCHIVOS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("tailandia-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 4000);
        const res = await fetch(req.url, { cache: "no-cache", signal: ctrl.signal });
        clearTimeout(timer);
        if (res.ok) await cache.put("./index.html", res.clone());
        return res;
      } catch (err) {
        return (await cache.match("./index.html")) || (await cache.match("./")) || Response.error();
      }
    })());
    return;
  }

  event.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) {
        const copia = res.clone();
        caches.open(CACHE).then(cache => cache.put(req, copia));
      }
      return res;
    }))
  );
});
