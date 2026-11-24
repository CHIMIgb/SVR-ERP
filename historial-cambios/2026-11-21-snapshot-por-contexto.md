# Snapshot de reportes por contexto (filtro + búsqueda + página)

**Fecha:** 2026-11-21
**Autor:** SVR-ERP Dev (agente)

## Cambios realizados
- Menor 3 de la segunda revisión del PR #23: el snapshot offline de
  `/m/reportes` ya no usa la clave única `'reportes'` para cualquier
  consulta. La clave ahora lleva el CONTEXTO:
  `reportes:<filtro|todos>:<búsqueda>:<página>` — sin red se sirve el
  snapshot de la MISMA consulta; uno de otro filtro (p. ej. "Todos"
  mostrando lo que era del filtro Cerrados) ya no puede confundir.
- El banner `AvisoSinConexion` sigue mostrando la fecha del snapshot que
  se sirve (no cambió).

## Cosas nuevas
- Ninguna función nueva; la clave es un template string en `recargar()`.

## Archivos tocados
- apps/web/src/app/(pwa)/m/reportes/page.tsx (modificado)

## Pruebas / verificación
- `npx tsc --noEmit` en apps/web: limpio.
- `npm run lint`: 0 errores, 38 warnings preexistentes.
- `npm test -- --runInBand`: 6 suites, 20/20 tests.
- `git diff --check`: limpio.
- Smoke manual: NO realizado (sin señal, cambiar filtro y volver).

## Pendientes y riesgos
- Las claves con búsqueda acumulan entradas únicas en localStorage (una
  por combinación vista; ~15-20 KB cada una). El logout las limpia todas
  (`limpiarDatosCache` borra por prefijo); sin logout el usuario que mucho
  busca podría acumular centenas — riesgo bajo, presupuesto documentado en
  `datos-cache.ts`.
- Un snapshot viejo bajo la clave `'reportes'` (formato anterior) queda
  huérfano hasta el logout — nadie lo lee ya.
