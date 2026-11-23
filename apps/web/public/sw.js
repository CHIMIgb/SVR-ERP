/* Service worker mínimo de la PWA (plan §7c):
   - Instalable en el teléfono (requiere fetch handler).
   - Caché del caparazón de estáticos de Next (offline del shell).
   - La DATA de capturas vive en IndexedDB (lib/pwa/offline.ts), NO aquí.
   - Network-first: siempre prefiere señal; usa caché solo si la red falla.
   - MODO DEV (`/sw.js?modo=dev`, registrado por el shell en desarrollo):
     TAMBIÉN cachea pero con RED-PRIMERO en los estáticos (los chunks de
     Turbopack no llevan hash: con señal siempre frescos/HMR intacto; sin
     señal sirve la última versión servida — offline testeable en
     dev:https:ip; tras editar código sin señal verás la versión anterior). */
const MODO_DEV = new URL(self.location.href).searchParams.get("modo") === "dev";
const CACHE = "svr-shell-v1";
/* Navegaciones (HTML de cada ruta): caché separada para poder limpiarla al
   cerrar sesión — nadie del usuario anterior debe abrir la app y ver su
   última pantalla (bloqueante de la fase offline-lectura, 2026-11-20). */
const CACHE_NAV = "svr-nav-v1";
const ORIGEN = self.location.origin;
const HOME_PWA = ORIGEN + "/m";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE && k !== CACHE_NAV)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/* Respuestas cacheables: ok y sin redirect — una página de error (502 del
   proxy, un 404) NO debe pisar la última copia buena (I-4 revisión PR #23).
   La escritura va en event.waitUntil para que sobreviva al respondWith.
   IMPORTANTE: el clone() de la respuesta SIEMPRE síncrono, antes del
   return — cuando respondWith entrega `res`, el navegador toma el cuerpo
   y un clone() diferido (p.ej. dentro del then de caches.open) lanza
   "body is already used" y el put NUNCA ocurre (bloqueante de la tercera
   revisión, 2026-11-22). */
function esCacheable(res) {
  return res.ok && !res.redirected;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // los POST van directo (la cola es IndexedDB)

  /* Navegación (el HTML de la ruta): network-first con fallback a la última
     copia — SIN señal la app vuelve a abrir en la última página visitada
     (fase offline-lectura). Si la ruta nunca se cargó de golpe, cae al HTML
     del home: la app abre en el menú del rol en vez de una página de error. */
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (esCacheable(res)) {
            const copia = res.clone();
            event.waitUntil(caches.open(CACHE_NAV).then((c) => c.put(req, copia)));
          }
          return res;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match(HOME_PWA))),
    );
    return;
  }

  // estáticos de Next:
  //  - producción: cache-first (inmutables, con hash)
  //  - dev: network-first con fallback (chunks SIN hash de Turbopack —
  //    con señal siempre frescos, HMR intacto; sin señal la última versión)
  if (req.url.includes("/_next/static/")) {
    event.respondWith(
      MODO_DEV
        ? fetch(req)
            .then((res) => {
              if (esCacheable(res)) {
                const copia = res.clone();
                event.waitUntil(caches.open(CACHE).then((c) => c.put(req, copia)));
              }
              return res;
            })
            .catch(() => caches.match(req))
        : caches.match(req).then(
            (cached) =>
              cached ||
              fetch(req).then((res) => {
                if (esCacheable(res)) {
                  const copia = res.clone();
                  event.waitUntil(caches.open(CACHE).then((c) => c.put(req, copia)));
                }
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
        if (req.url.includes("/_next/") && esCacheable(res)) {
          const copia = res.clone();
          event.waitUntil(caches.open(CACHE).then((c) => c.put(req, copia)));
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || Promise.reject("offline"))),
  );
});

/* Mensajes desde la app: limpiar el caché de navegaciones al cerrar/iniciar
   sesión (los snapshots de DATOS se limpian en localStorage desde el
   AuthProvider — la caché del SW es por origen, no por usuario). */
self.addEventListener("message", (event) => {
  if (event.data?.tipo === "limpiar-cache") {
    event.waitUntil(caches.delete(CACHE_NAV));
  }
});

/* WEB PUSH (fase c del plan de push): la notificación llega con la app
   CERRADA, como la de cualquier app del teléfono. El payload lo envía el
   API (NotificacionesService.emitir → web-push). Además avisa a las
   ventanas abiertas (postMessage) para que la campana se actualice en
   tiempo real. */
self.addEventListener("push", (event) => {
  let datos = { titulo: "SVR-ERP", cuerpo: "Tienes una notificación nueva", referenciaTipo: null };
  try {
    const payload = event.data ? event.data.json() : {};
    datos = {
      titulo: payload.titulo || datos.titulo,
      cuerpo: payload.cuerpo || datos.cuerpo,
      referenciaTipo: payload.referenciaTipo ?? null,
    };
  } catch {
    // payload no-JSON: se usa el fallback de arriba
  }
  event.waitUntil(
    self.registration
      .showNotification(datos.titulo, {
        body: datos.cuerpo,
        icon: "/icons/pwa-192.png",
        badge: "/icons/pwa-192.png",
        data: { referenciaTipo: datos.referenciaTipo },
      })
      .then(() =>
        // Campana en tiempo real: las ventanas abiertas recargan su buzón al
        // instante (NotificationProvider escucha el postMessage).
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((lista) =>
          lista.forEach((cliente) =>
            cliente.postMessage({
              tipo: "notificacion-nueva",
              titulo: datos.titulo,
              cuerpo: datos.cuerpo,
            }),
          ),
        ),
      ),
  );
});

/* Al tocar la notificación: enfoca la app abierta o la abre en la sección
   correspondiente (deep-link fino por referencia queda como mejora). */
const esPestanaPWA = (url) => {
  // pathname exacto: includes("/m") también es verdadero en /maquinaria,
  // /mantenimiento y /mi-... (pestañas del ESCRITORIO) — bloqueante 4 PR #23
  try {
    const ruta = new URL(url).pathname;
    return ruta === "/m" || ruta.startsWith("/m/");
  } catch {
    return false;
  }
};

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino =
    event.notification.data?.referenciaTipo === "reportes_campo" ? "/m/reportes" : "/m";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((lista) => {
      for (const cliente of lista) {
        if (esPestanaPWA(cliente.url)) {
          cliente.focus();
          // Si navigate() falla (cliente no controlado), abre ventana nueva
          return cliente.navigate(destino).catch(() => self.clients.openWindow(destino));
        }
      }
      return self.clients.openWindow(destino);
    }),
  );
});
