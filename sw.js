// Guarda la app en el teléfono para que abra sin internet.
// Con internet trae la última versión (espera hasta 4 s); sin internet usa la copia guardada.
// La página revisa version.json al volver a primer plano y se recarga si hay algo nuevo.
const VERSION = "20261123-060413";
const CACHE = "tailandia-" + VERSION;
const ARCHIVOS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "./fuentes/bricolage-grotesque-normal-600.woff2", "./fuentes/ibm-plex-mono-normal-500.woff2", "./fuentes/lexend-normal-400.woff2", "./docs/d01.bin", "./docs/d02-p1.bin", "./docs/d02.bin", "./docs/d03.bin", "./docs/d04-p1.bin", "./docs/d04-p2.bin", "./docs/d04.bin", "./docs/d05.bin", "./docs/d06-p1.bin", "./docs/d06-p2.bin", "./docs/d06.bin", "./docs/d07-p1.bin", "./docs/d07-p2.bin", "./docs/d07.bin", "./docs/d08-p1.bin", "./docs/d08-p2.bin", "./docs/d08.bin", "./docs/d09-p1.bin", "./docs/d09-p2.bin", "./docs/d09.bin", "./docs/d10.bin", "./docs/d11.bin", "./docs/d12-p1.bin", "./docs/d12-p2.bin", "./docs/d12.bin", "./docs/d13-p1.bin", "./docs/d13.bin", "./docs/index.json", "./docs/s.bin"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ARCHIVOS.map(u => new Request(u, { cache: "reload" }))))
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
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  // version.json siempre va a la red: así la app sabe si hay una versión nueva.
  if (url.pathname.endsWith("/version.json")) return;

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
