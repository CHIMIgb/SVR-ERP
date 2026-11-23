# 2026-11-20 — Offline-lectura: volver a abrir sin señal y seguir viendo los datos (PWA)

## Cambios realizados

**Tercer hueco del offline (lo que faltaba):** hasta hoy, recargar la app sin señal
ni siquiera cargaba el shell (el SW rechazaba las navegaciones) y las respuestas de la
API nunca se guardaban. Ahora:

1. **SW (`public/sw.js`) — navegaciones cacheadas:** las navegaciones (HTML de la
   ruta) van network-first con fallback a la última copia (`svr-nav-v1`, caché
   separada del shell). Sin señal, la app vuelve a abrir en la última página
   visitada. Los chunks son content-hashed: un HTML de una versión atrás funciona
   con sus chunks cacheados. Solo producción (MODO_DEV ya lo excluía todo).
   El listener `message` borra `svr-nav-v1` al pedirlo la app.
2. **Snapshot de datos (`lib/pwa/datos-cache.ts` — NUEVO):** `guardarDatos` /
   `leerDatos` / `limpiarDatosCache` / `limpiarCacheNavegacion`. localStorage con
   clave POR USUARIO (`svr-pwa-datos:<userId>:<clave>`) + `fechaGuardada` — la caché
   del SW es por origen y en un teléfono compartido serviría datos del usuario
   anterior al siguiente. Best-effort (cuota llena nunca rompe la vista).
   Presupuesto: ~15-20 KB por pantalla de listado (centésimas de los ~5 MB de
   localStorage); la cola de fotos en IndexedDB es lo pesado (~0.5-3 MB por captura
   pendiente), no esto.
3. **`/m/reportes`:** guarda el listado paginado y los stats en cada load exitoso;
   sin señal, `recargar`/`cargarStats` sirven el ÚLTIMO snapshot en vez del
   error/blanco. Los stats se guardan con las claves YA mapeadas (`criticos`, no
   `criticosActivos`).
4. **`AvisoSinConexion` (componente nuevo en `components/pwa/`):** banner ámbar
   "Sin conexión — mostrando los datos guardados el [fecha]. La sincronización
   continúa al volver la señal." Se oculta solo al volver la señal; gated con
   `!cargandoInicial` (los banners no existen durante la carga).
5. **`AuthProvider`:** logout limpia snapshots + pide al SW borrar `svr-nav-v1`
   (nada del usuario anterior para el siguiente); login exitoso hace la misma
   limpieza (borde de seguridad: sesión que crasheó sin logout).
6. Doc de `AvisoSinConexion` en COMPONENTS-PWA.md.

## Cosas nuevas

- `lib/pwa/datos-cache.ts` (helper compartible — las próximas pantallas PWA lo
  adoptan en 3 líneas).
- Componente `AvisoSinConexion` (patrón .tsx + .styles.ts + index.ts).

## Archivos tocados

- `apps/web/public/sw.js`
- `apps/web/src/lib/pwa/datos-cache.ts` — NUEVO
- `apps/web/src/components/pwa/AvisoSinConexion/` — NUEVO (3 archivos)
- `apps/web/src/app/(pwa)/m/reportes/page.tsx`
- `apps/web/src/providers/AuthProvider.tsx` (pieza compartida de sesión — excepción
  permitida)
- `COMPONENTS-PWA.md`

## Verificación / pruebas

- `npx tsc --noEmit` → limpio.
- `npm run lint` → 0 errores, 38 warnings (baseline). NOTA: los callbacks con
  `user?.id` en deps rompían el React Compiler ("memoization could not be
  preserved") — resuelto extrayendo `userId` plano antes de los callbacks.
- `npm test` (web) → 12/12. `node --check sw.js` → sintaxis OK.
- El SW y la navegación offline NO tienen test automatizado (archivo plano + browser)
  — smoke manual obligatorio, es la verificación real de esta fase.

## Pendientes / riesgos

- **Smoke manual en dispositivo (3 escenarios):**
  1. Cargar `/m/reportes` con señal → cortar señal → cerrar y REABRIR la app → debe
     abrir la última página con los datos + banner ámbar con la fecha.
  2. Logout → otro usuario entra sin que el primero haya tenido señal → NADA de sus
     datos (snapshot y navegaciones limpiados).
  3. Volver la señal → la app refresca sola (interceptor + evento online).
- El HTML cacheado offline puede quedar una versión atrás tras un deploy
  (mitigado por chunks hasheados; network-first lo corrige con señal).
- Snapshot por pantalla: solo `/m/reportes` lo usa hoy; el home `/m` puede adoptarlo
  después con el mismo helper.
- `limpiarCacheNavegacion` usa `navigator.serviceWorker.controller` — si el SW aún no
  controla la página (primer load), el postMessage se pierde y el caché se limpia en
  el siguiente logout. Ventana mínima, aceptada.
