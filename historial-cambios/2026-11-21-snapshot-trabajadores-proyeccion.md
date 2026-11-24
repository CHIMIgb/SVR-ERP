# Snapshot de trabajadores sin nómina (proyección mínima)

**Fecha:** 2026-11-21
**Autor:** SVR-ERP Dev (agente)

## Cambios realizados
- Punto I-2 de la segunda revisión del PR #23: el snapshot offline de
  trabajadores ya NO guarda el `TrabajadorDTO` completo (sueldo fiscal y
  efectivo, teléfono, contacto de emergencia, descuentos). Solo guarda la
  proyección `{id, nombre, puesto}` — lo único que consume el select de
  asignar en `/m/reportes`.
- Fix en los DOS lugares que guardaban el DTO completo:
  - `datos-offline.ts` (precarga del shell)
  - `page.tsx` de `/m/reportes` (el "live" del modal de asignar — segundo
    lugar que la review no había marcado)

## Cosas nuevas
- Ninguna función nueva; misma proyección inline en los dos puntos
  (dos usos: el estándar permite tolerar, la tercera se extrae).

## Archivos tocados
- apps/web/src/lib/pwa/datos-offline.ts (modificado)
- apps/web/src/app/(pwa)/m/reportes/page.tsx (modificado)

## Pruebas / verificación
- `npx tsc --noEmit` en apps/web: limpio.
- `npm run lint` en apps/web: 0 errores, 38 warnings preexistentes.
- `npm test -- --runInBand`: 5 suites, 16/16 tests.
- `git diff --check`: limpio.
- Smoke manual: NO realizado.

## Pendientes y riesgos
- Un snapshot VIEJO con sueldos ya guardado en localStorage de un teléfono
  en uso NO se migra: se sobreescribe en la próxima visita con señal, y los
  snapshots se limpian igual en logout/login. Hasta entonces, ese teléfono
  conserva los datos viejos (no se pueden borrar remotamente).
- `limpiarDatosCache` en la ruta de sesión vencida sigue pendiente (parte
  del mismo hallazgo I-2 de la review; se aborda como cambio aparte).
