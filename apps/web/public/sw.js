/* Service worker mínimo de la PWA (plan §7c):
   - Instalable en el teléfono (requiere fetch handler).
   - Caché del caparazón de estáticos de Next (offline del shell).
   - La DATA de capturas vive en IndexedDB (lib/pwa/offline.ts), NO aquí.
   - Network-first: siempre prefiere señal; usa caché solo si la red falla. */
const CACHE = "svr-shell-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // los POST van directo (la cola es IndexedDB)

  // estáticos de Next: cache-first (inmutables, con hash)
  if (req.url.includes("/_next/static/")) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            const copia = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copia));
            return res;
          }),
      ),
    );
    return;
  }

  // navegaciones y API: network-first con fallback a caché
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (req.url.includes("/_next/")) {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copia));
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || Promise.reject("offline"))),
  );
});
