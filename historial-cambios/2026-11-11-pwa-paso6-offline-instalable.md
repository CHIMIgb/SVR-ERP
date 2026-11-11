# PWA base — paso 6: offline (cola + sincronizador) y PWA instalable

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)
**Rama:** `pwa-base` (paso 6 del §8.6)

## Cambios realizados

### 1. La cola (outbox) — `lib/pwa/offline.ts`
IndexedDB directo con un wrapper mínimo de ~80 líneas — **sin dependencias
nuevas** (idb/Dexie no justificados frente a un wrapper del tamaño del
problema). Store `outbox`:
- `{ id (UUID del teléfono), endpoint, payload, creado_en, intentos, estado }`
- `encolar / pendientes (FIFO) / contarPendientes / marcarEnviada /
  marcarError` — los envíos NUNCA duplican filas (idempotencia por
  `X-Idempotencia-Key` = el UUID del teléfono; contrato documentado para las
  fases de captura).

### 2. El sincronizador — `lib/pwa/sincronizador.ts`
- Disparadores: al abrir la app · evento `online` · cada 2 min.
- FIFO por `creado_en` (el reporte antes que su adjunto); un fallo NO bloquea
  la cola (el elemento queda con `estado=error` y reintentos).
- Import perezoso del apiClient (el token en memoria viaja en cada envío).
- Pass única a la vez (bandera `corriendo`).

### 3. Contador visible — `lib/pwa/useCola.ts`
Hook reactivo de pendientes (leer + `online` + intervalo) — alimenta el badge
"N pendientes" que RoleNav ya reservaba.

### 4. Instalable
- **`public/manifest.json`** — name/short_name, `start_url: /m`,
  `display: standalone`, theme naranja, iconos 192/512.
- **Iconos placeholder generados con node** (PNG válido escrito a mano con
  zlib — cuadrado naranja de marca): se reemplazan cuando el cliente
  entregue el logo real.
- **`public/sw.js`** — service worker mínimo pero real: cache-first para
  `/_next/static` (inmutables), network-first con fallback para el resto.
  La DATA de capturas vive en IndexedDB, no en el SW.
- **Layout raíz:** `metadata.manifest` + `viewport.themeColor`.
- **`(pwa)/layout.tsx`:** `serviceWorker.register('/sw.js')` +
  `iniciarSincronizador()` + badge real con `useCola()`.

### 5. Documentación nueva
- **Carpeta `pwa/` en la raíz** (decisión del usuario):
  - `pwa/vistas-movil-comercial-operaciones.md` — el plan completo MOVIDO
    desde `docs-planes/` (referencias actualizadas en AGENTS.md y
    COMPONENTS.md).
  - `pwa/offline-y-sincronizacion.md` — NUEVO: el "cómo funcionará" del
    offline (qué se encola y qué no, dónde se guarda, idempotencia, los 3
    disparadores, UX, seguridad, límites).
  - `pwa/sincronizador.spec.ts.txt` — el test del sincronizador (FIFO,
    fallo no bloquea, cola vacía) como PENDIENTE de infra: la web aún no
    tiene runner de jest (tsc rompería con jest sin tipos).

## Archivos tocados

- `apps/web/src/lib/pwa/offline.ts` (nuevo)
- `apps/web/src/lib/pwa/sincronizador.ts` (nuevo)
- `apps/web/src/lib/pwa/useCola.ts` (nuevo)
- `apps/web/public/manifest.json` + `sw.js` + `icons/pwa-192.png` +
  `icons/pwa-512.png` (nuevos)
- `apps/web/src/app/(pwa)/layout.tsx` (SW + sync + badge)
- `apps/web/src/app/layout.tsx` (manifest + viewport)
- `pwa/*` (carpeta nueva: plan movido + doc offline + test pendiente)

## Pruebas / verificación

- `tsc` ✅; eslint ✅ (0 salidas en los archivos nuevos).
- **`npm run build` de producción ✅ con las 14 rutas `/m/*`
  prerenderizadas** (la web compila completa con la PWA).
- PNGs verificados (firma + tamaño, 556 bytes el de 192).
- El spec del sincronizador quedó como pendiente documentado (sin runner de
  jest en web aún).

## Pendientes y riesgos

- Sin push (orden del usuario).
- El SW cachea el shell; las capturas usan la cola — el smoke del paso 7
  requiere HTTPS o localhost (la cámara/GPS y la instalación lo exigen).
- Los iconos son placeholder de marca — reemplazar con el logo real cuando
  el cliente lo entregue.
- Siguiente y último: paso 7 (smoke por rol con los números demo +
  verificación del instalable en el teléfono).
