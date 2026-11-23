# 2026-11-20 — Inicio del residente: reportes abiertos y críticos que requieren atención

## Cambios realizados

Bloque propio del RESIDENTE en el Inicio de la PWA (`/m`), sobre la base del trabajo de
Chimi en `pwa/inicio-admin` (fusión a esta rama: asistencia propia, asistencia del
equipo con filtros/llamada, "Mi equipo hoy" e inicio del administrador).

Dos tarjetas "acción primero" (opción A confirmada por el cliente):

- **Reportes abiertos** — `nuevos + enCurso` de reportes_campo del ámbito del
  residente (el server ya lo resuelve: sus reportes + los de sus trabajadores vía
  `jefe_user_id`). Tap → `/m/reportes`.
- **Requieren tu atención** — **críticos activos** (prioridad Alta/Crítica sin
  cerrar; `criticosActivos` del mismo `stats()`). Con críticos la tarjeta se pinta en
  rojo; en 0 queda neutra con "Sin críticos abiertos". Tap → `/m/reportes`.

Detalles:
- `reportesCampoApi.stats()` — SIN backend nuevo: el endpoint ya devuelve los cuatro
  números con el ámbito resuelto.
- **Offline-lectura:** guarda el snapshot en `datos-cache` con la MISMA clave
  (`stats`) y forma que ya usa `/m/reportes` — sin señal, el Inicio sirve ese
  snapshot con el banner `AvisoSinConexion` (fecha de antigüedad); sin snapshot el
  bloque no existe (el error se reporta en su pantalla).
- Carga con `Skeleton variant="card"`; en error sin snapshot el bloque se oculta.
- Gated: solo roles Residente con la vista `/m/reportes` en su menú (`navDelRol`).

## Archivos tocados

- `apps/web/src/app/(pwa)/m/page.tsx` — componente `ReportesResidente` + gating.
- Fusión de `origin/pwa/inicio-admin` a esta rama (asistencia del residente, inicio
  del admin, PanelEmpresa — sin conflictos; tsc verde tras el merge).

## Verificación / pruebas

- `npx tsc --noEmit` → limpio.
- `npm run lint` → 0 errores, 38 warnings (baseline de la rama).
- `npm test` (web) → 12/12.
- Smoke visual del residente en el teléfono: pendiente del usuario (números con su
  equipo de prueba INC0072-0074; crítico en 0 se ve neutro, con críticos se pinta rojo).

## Pendientes / riesgos

- Las dos tarjetas llevan a `/m/reportes` SIN filtro pre-aplicado (el listado de la
  PWA no tiene chip de "críticos"); si el cliente quiere aterrizar filtrado, sería
  leer un query param en esa página — queda como mejora, no bloqueante.
- El snapshot `stats` es compartido entre Inicio y Reportes (misma clave/forma a
  propósito): si una pantalla cambiara la forma del objeto, habría que ajustar ambas.
