# 2026-11-13 — B3.2: el backend de ventas acepta cliente del catálogo (clienteId)

## Qué se hizo

Fase B3.2 (cliente real en el POS):

- **`create-venta.dto.ts`** — `clienteId?` (UUID opcional) junto al `cliente?`
  de texto que ya existía (compatibilidad total con clientes actuales del POS).
- **`ventas.service.ts`** — paso nuevo "1. Cliente del catálogo" en `create`:
  - Con `clienteId`: valida que exista, esté activo y no eliminado; guarda
    `cliente_id` + **snapshot del nombre** (empresa || nombre) en la columna
    `cliente` de texto (los tickets siguen leyéndose igual).
  - Sin `clienteId`: flujo de siempre (`Público en general` o el texto).
  - Fallo de negocio: `CLIENTE_NO_ENCONTRADO` con audit FAIL **antes** de
    lanzar (patrón `fallir`).
  - Numeración de pasos del método reordenada (1→6).
  - `serializeVenta` expone `clienteId` (undefined si es nula).

## Verificación

- `npx tsc --noEmit` (api): limpio.
- Unit `src/ventas`: **57/57** (2 nuevos: con cliente válido guarda id +
  snapshot y expone `clienteId`; con cliente inexistente audita FAIL y no crea
  venta ni descuenta stock).
- Integración `ventas.integration.spec.ts`: **12/12** — 2 nuevos contra BD real:
  venta con cliente del catálogo deja `cliente_id` + snapshot en la fila y
  audit SUCCESS; con cliente fantasma audita FAIL (`error_code`
  CLIENTE_NO_ENCONTRADO) y no existe ninguna venta con ese `cliente_id`.
- **Hallazgo del día:** el suite de integración de ventas depende del reloj —
  a las 02:00+ local, con el turno real 07:00–02:00 en BD, los tests de venta
  fallan con FUERA_DE_HORARIO. Se corrió con el horario temporal
  00:00–23:59 (UPDATE en `configuracion_sistema`) y **restaurado a
  07:00 / 02:00 al terminar** (verificado). Deuda anotada: el spec debería
  fijar su propio horario como los unit (env TURNO_*).

## Pendientes / riesgos

- El frontend todavía no envía `clienteId` (B3.3, sin hacer): el POS sigue
  mandando "Público en general" y todas las ventas nuevas nacen con
  `cliente_id` NULL hasta entonces.
