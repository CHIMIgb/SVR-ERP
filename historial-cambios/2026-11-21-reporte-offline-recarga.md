# Reporte offline: recarga de la vista y desaparición del reporte

**Fecha:** 2026-11-21
**Autor:** SVR-ERP Dev (agente)

## Cambios realizados
- `ModalNuevoReporte`: no se llama a `sincronizarAhora()` cuando `haySenal()` es
  falso. Antes el fetch offline fallaba y marcaba el item como `error` aunque el
  toast dijera "se enviará cuando haya señal". El sincronizador global ya
  reintenta en el evento `online`.
- `offline.ts`: `conStore()` resuelve en `tx.oncomplete`, no en el `onsuccess`
  de la request. Cerraba una ventana en la que un reload inmediato (HMR de
  Turbopack en dev) podía perder una captura recién encolada.
- `/m/reportes`: al capturar se limpian el filtro de estado y la búsqueda antes
  de recargar la lista, para que el reporte recién enviado no quede oculto y
  parezca borrado. Abrir/cerrar el modal sin capturar NO limpia los filtros.

## Cosas nuevas
- `apps/web/src/lib/pwa/offline.test.ts`: test con IndexedDB falso que verifica
  que `encolar()` solo resuelve tras el commit de la transacción.
- `trasCaptura()` en la página de reportes de la PWA.

## Archivos tocados
- apps/web/src/components/pwa/ModalNuevoReporte/ModalNuevoReporte.tsx (modificado)
- apps/web/src/lib/pwa/offline.ts (modificado)
- apps/web/src/lib/pwa/offline.test.ts (creado)
- apps/web/src/app/(pwa)/m/reportes/page.tsx (modificado)

## Pruebas / verificación
- `npx tsc --noEmit` en apps/web: limpio.
- `npm run lint` en apps/web: 0 errores, 38 warnings preexistentes (no bloquean).
- `npm test -- --runInBand` en apps/web: 5 suites, 13/13 tests.
- `git diff --check`: limpio.
- Smoke manual: NO realizado en teléfono con modo avión tras este cambio.

## Pendientes y riesgos
- La recarga de vista en `dev:https:ip` es el HMR de Turbopack (cambio de
  `sessionId` del WebSocket o >25 reconexiones); no se cambió código por eso.
  Falta repetir el flujo con `npm run build && npm run start` o la PWA
  instalada para confirmar que no ocurre en producción.
- No se inspeccionaron IndexedDB ni la BD real después de reconectar: si el
  backend no llega a crear el reporte, el item sale igual de la cola al recibir
  ACK y el problema de percepción podría persistir.
- Limpiar filtro y búsqueda al capturar es comportamiento nuevo a petición del
  flujo; el usuario pierde el filtro que tenía activo al registrar un reporte.
