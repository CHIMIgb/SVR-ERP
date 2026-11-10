# F2 — paginación visible durante el skeleton (/cobranza + /proveedores)

**Fecha:** 2026-11-07
**Autor:** agente OpenCode

## Diagnóstico (con la observación del usuario: "en /proveedores no se carga la paginación y en otras sí")
Auditoría de las 12 vistas de OP/Com: la-pagination SOLO estaba dentro de la rama
post-carga en **/cobranza ×4** y **/proveedores ×3** (el resto ya la mostraba
siempre — por eso otras vistas la aprecian bajo el skeleton y estas no, y el
layout saltaba al llegar los datos).

## Cambios realizados
- Los 7 bloques de tabla refactorizados al patrón final:
  `<DataTable loading={gate}>` SIEMPRE presente (skeleton estándar) +
  `<Pagination>` SIEMPRE presente (barra visible durante el skeleton, exactamente
  como las demás vistas) — se eliminan las ramas ternario con EmptyState
  (el `emptyText` del DataTable hereda el mensaje del EmptyState original).
- Archivos afectados: cobranza (cuentas/cobros/vencimientos/por-obra),
  proveedores (principal/OC/estados-de-cuenta; el ledger modal no tiene
  paginación y se queda como está).
- Imports muertos limpiados (EmptyState en cobranza proveedores — el resto de
  usos: cobranza mantiene su EmptyState del modal detalle; verificado).

## Verificación
- `npx tsc --noEmit`: 0 errores.
- ESLint amber: 0 warnings nuevos (2 incidentes auto-reparados durante la corrida:
  maxBodyHeight duplicados y una coma tras emptyText, corregidos en el mismo pase
  con su corrector v8; los EmptyState imports de proveedores/cobranza re-evaluated).
- Diff: cobranza -74, proveedores -49 aprox (menos ternario, más plano).

## Incidentes y control
- El script v7 introdujo 2 lunados por archivo (maxBodyHeight duplicado y marca
  de `emptyText` con coma) — reparados en el mismo pase; el diff final quedó
  limpio para leerse.

## Pendientes y riesgos
- Visual del usuario: /proveedores y /cobranza deben ya mostrarte la barra de
  paginación bajo el skeleton desde el primer frame (y sin saltos).
