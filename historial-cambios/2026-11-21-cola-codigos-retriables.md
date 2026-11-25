# La cola deja de matar reportes válidos (401/423/429 retriables)

**Fecha:** 2026-11-21
**Autor:** SVR-ERP Dev (agente)

## Cambios realizados
- Punto I-1 de la segunda revisión del PR #23: `CODIGOS_RECHAZO_TERMINAL`
  en `sincronizador.ts` queda solo con los 4xx de DATOS
  (`BAD_REQUEST`, `FORBIDDEN`, `NOT_FOUND`, `UNPROCESSABLE_ENTITY`).
  Antes incluía `UNAUTHORIZED`, `LOCKED` y `TOO_MANY_REQUESTS`: con la
  sesión vencida, una ráfaga del throttler (429) o un bloqueo (423), los
  reportes válidos quedaban en estado terminal "Rechazado" y ya no se
  enviaban solos. Ahora van a `marcarError` (reintentable).
- Comentarios del contrato actualizados en `offline.ts` y `sincronizador.ts`.

## Cosas nuevas
- 3 tests de `puertoPorDefecto` (el mapeo código → estado real, que no
  estaba cubierto: el test previo usaba un puerto simulado con el flag
  `rechazo` ya fijo).

## Archivos tocados
- apps/web/src/lib/pwa/sincronizador.ts (modificado)
- apps/web/src/lib/pwa/offline.ts (comentario)
- apps/web/src/lib/pwa/sincronizador.test.ts (mock de apiClient + 3 tests)

## Pruebas / verificación
- `npx tsc --noEmit` en apps/web: limpio.
- `npm run lint` en apps/web: 0 errores, 38 warnings preexistentes.
- `npm test -- --runInBand`: 5 suites, 16/16 tests.
- `git diff --check`: limpio.
- Smoke manual en teléfono: NO realizado.

## Pendientes y riesgos
- Con sesión vencida (`refresh` invalid → `window.location.href = '/'`),
  la pasada del sincronizador redirige al login sin limpiar la cola (no
  pasa por `logout()`); los items quedan en `error` y se reenvían al
  re-entrar, que es el comportamiento deseado — pero depende de que el
  usuario inicie sesión de nuevo en el MISMO navegador.
- El flujo 401 → refresh → reintento dentro de una pasada puede tardar
  hasta ~8 s (timeout del refresh) por item; aceptable para una cola FIFO.
