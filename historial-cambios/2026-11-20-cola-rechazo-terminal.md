# 2026-11-20 — Cola PWA: ids enviados + estado terminal "rechazado" (bloqueante 5 PR #23)

## Cambios realizados

**Bloqueante 5 de la review del PR #23, dos piezas:**

1. **Mensaje falso del modal:** `sincronizarAhora()` devolvía el conteo de TODA la
   pasada — si salía un item viejo de la cola y el nuevo fallaba, el modal decía
   "Incidente registrado exitosamente" y se cerraba. Ahora la pasada devuelve los
   **IDS enviados** (`Promise<string[]>`) y el modal solo felicita si SU item está
   en la lista (`enviados.includes(item.id)`).
2. **Reintentos infinitos de 4xx:** `marcarError` no tenía tope ni estado terminal —
   un 422 de validación (no 409) se reintentaba cada 2 min para siempre. Ahora los
   4xx del contrato (≠409: BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, NOT_FOUND,
   UNPROCESSABLE_ENTITY, LOCKED, TOO_MANY_REQUESTS) marcan estado TERMINAL
   `rechazado`: no se reenvían solos, esperan decisión humana (Descartar/Reintentar
   en `EstadoCola`, igual que el conflicto). 5xx y red siguen reintentando solos;
   409 sigue yendo a `conflicto`.

## Cosas nuevas

- `ElementoCola.estado` gana `"rechazado"` (apps/web/src/lib/pwa/offline.ts).
- `marcarRechazada(id)` y `consultarEstado(id)` en offline.ts.
- `PuertoEnvio` gana `rechazo?: boolean`; `puertoPorDefecto` lo deduce del `error.code`
  del contrato (AllExceptionsFilter) con `CODIGOS_RECHAZO_TERMINAL`.
- `EstadoCola`: badge "Rechazado" (error), acciones Descartar/Reintentar y el loader
  global NO gira mientras un rechazado espera decisión.
- Modal: si su item terminó en `rechazado`, el toast dice "El servidor rechazó este
  reporte..." en vez del "quedará guardado y se enviará solo" que mentiría.
- Doc de `EstadoCola` y `ModalNuevoReporte` actualizada en COMPONENTS-PWA.md.

## Archivos tocados

- `apps/web/src/lib/pwa/offline.ts`
- `apps/web/src/lib/pwa/sincronizador.ts`
- `apps/web/src/components/pwa/EstadoCola/EstadoCola.tsx`
- `apps/web/src/components/pwa/ModalNuevoReporte/ModalNuevoReporte.tsx`
- `apps/web/src/lib/pwa/sincronizador.test.ts` — 4 tests nuevos (8 en total).
- `COMPONENTS-PWA.md`

## Verificación / pruebas

- `npx jest src/lib/pwa/sincronizador.test.ts` → 8/8:
  - devuelve los ids enviados, no un conteo global.
  - 4xx → `marcarRechazada` y en la siguiente pasada NO se reintenta.
  - 5xx → `marcarError` (retriable).
  - 409 → `marcarConflicto` (intacto).
- Suite completa del web (`npm test`) → 12/12.
- `npx tsc --noEmit` → limpio.
- `npm run lint` → 0 errores, 38 warnings (baseline de la rama).

## Pendientes / riesgos

- Smoke manual en dispositivo pendiente: capturar con server caído → "quedó guardado";
  capturar con payload inválido (server arriba) → toast de rechazo + item "Rechazado"
  en EstadoCola con Descartar/Reintentar; item viejo en cola + captura nueva con señal
  → solo la nueva se registra y cierra el modal.
- Un item "rechazado" queda CONTANDO en el badge de pendientes hasta que el humano
  lo descarte o lo reintente (decisión deliberada: no esconder un reporte perdido).
- `TOO_MANY_REQUESTS` (429) se trata como terminal por simplicidad; si algún día
  limitamos tasa con reintento diferido, agregarlo a la lista de reintentables.
