# 2026-11-20 — Offline en DEV + precarga declarativa de catálogos (fase offline-datos)

## Contexto del reporte del usuario

Probó la PWA instalada contra el servidor de DEV (`npm run dev:https:ip` + CA) cortando
internet y encontró: (1) no puede acceder sin conexión, (2) los selects de formularios
mueren (catálogos de la BD).

**Diagnóstico:** en DEV el shell registra el SW con `?modo=dev`, que OMITÍA todos los
handlers de caché (decisión vieja: chunks de Turbopack sin hash + cache-first se
pudrirían). Con ese SW el teléfono no cachea NADA → sin señal ni shell arranca y la
sesión (que SÍ vive en localStorage) nunca se lee. La sesión no era el problema: el
shell sin caché sí.

## Cambios realizados

1. **SW capaz de offline en DEV** (`public/sw.js`): el modo dev ya NO omite el
   fetch handler — usa RED-PRIMERO con fallback a caché para los estáticos
   (chunks de Turbopack: con señal siempre frescos, HMR intacto; sin señal sirve la
   última versión servida). Producción sigue igual (cache-first para inmutables con
   hash). Además, el fallback de navegación ahora cae al HTML del **home `/m`** cuando
   la ruta pedida nunca se cargó de golpe (antes: página de error).
   **BUG corregido de pasada (regresión del commit `565505cd`):** el `activate`
   borraba CUALQUIER caché distinta de `svr-shell-v1` — incluida `svr-nav-v1` — en
   cada activación del SW. Ahora conserva ambas.
2. **Archivo declarativo `lib/pwa/datos-offline.ts` (NUEVO):** la lista
   `DATOS_OFFLINE` (clave + llamada que trae el dato) es el ÚNICO lugar donde se
   agrega/quita qué se precarga. Hoy: `subcategorias`, `proyectos`, `trabajadores`.
   + `precargarDatosOffline(userId)`: recorrida secuencial best-effort con señal.
3. **Precarga al entrar:** el shell `(pwa)/layout.tsx` lanza `precargarDatosOffline`
   en segundo plano (fire-and-forget, una vez por visita) con usuario y señal.
4. **Selects offline:** `ModalNuevoReporte` (subcategorías/proyectos) y el modal de
   asignación (`/m/reportes`, trabajadores) guardan el catálogo en cada load exitoso
   y, SIN señal, sirven el snapshot (los selects quedan usables; el alta viaja por la
   cola con idempotencia y el server valida al sincronizar). El perfil NO se tocó:
   ya funciona offline (lee el usuario de localStorage).
5. Nota técnica: los reads de snapshot van en el `catch` tras el `await` — los
   setState síncronos al inicio del effect los marcaba la regla
   `react-hooks/set-state-in-effect` (2 errores de lint).

## Cómo probar el offline EN TU ENTORNO (dev:https:ip)

1. Reinicia `npm run dev:https:ip` (sirve el sw.js nuevo).
2. En el teléfono, con SEÑAL: abre/instala la app → una vez cargada, el SW nuevo
   toma control (skipWaiting) → navega las pantallas que quieras tener offline
   (cada carga queda cacheada) → entra a Reportes (precarga catálogos + snapshot).
3. **Modo avión** → cierra y reabre la app → abre con tu sesión, los datos de
   reportes con el banner ámbar de fecha, y los selects del "Nuevo reporte" llenos.
4. Crea un reporte sin señal → queda en la cola → vuelve la señal → sincroniza solo.
5. **Login offline NO existe** (validación server-side): lo que reabre es la sesión
   de la última entrada con señal.
6. Tras editar código en dev sin señal verás la versión anterior (network-first lo
   corrige al volver la señal) — trade-off documentado del modo dev.

## Archivos tocados

- `apps/web/public/sw.js` — dev con caché red-primero, fallback al home, activate
  que ya no borra `svr-nav-v1`.
- `apps/web/src/lib/pwa/datos-offline.ts` — NUEVO (lista declarativa + precarga).
- `apps/web/src/app/(pwa)/layout.tsx` — efecto de precarga.
- `apps/web/src/components/pwa/ModalNuevoReporte/ModalNuevoReporte.tsx`
- `apps/web/src/app/(pwa)/m/reportes/page.tsx` — snapshot de trabajadores.

## Verificación / pruebas

- `npx tsc --noEmit` → limpio; `npm run lint` → 0 errores (38 warnings baseline).
- `npm test` (web) → 12/12; `node --check sw.js` → OK.
- Smoke en dispositivo: PENDIENTE DEL USUARIO (guía arriba) — no automatizable
  (service worker + entorno físico).

## Pendientes / riesgos

- En dev-offline el código servido puede quedar una edición atrás (por diseño del
  network-first; con señal se autocorrige).
- La lista `DATOS_OFFLINE` crece por pantalla: cada nueva pantalla PWA agrega su
  línea y su fallback con `leerDatos` — el costo por pantalla es mínimo.
- El ícono del push (`/icons/pwa-192.png`) no se garantiza cacheado offline
  (cosmético).
