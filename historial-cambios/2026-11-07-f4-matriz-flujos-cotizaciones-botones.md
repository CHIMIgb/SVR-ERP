# F4 — matriz de flujos de datos publicada en el doc + fix de botones fantasma en /cotizaciones

**Fecha:** 2026-11-07
**Autor:** agente OpenCode

## Cambios realizados
1. **`IMPLEMENTACIONES-A-FUTURO.md` — §11 F4 reescrita:** salida del análisis
   (static-audit contra schema/BD/workflows):
   - 6 cadenas ya al 100% (ciclo comercial, renta facturable, reportes
     facturables, compras→bodega, cobranza→tesorería, consolidado cliente).
   - Matriz de gaps con columna habilitador y remisión a la tarea del índice:
     OPERACIONES (9 filas: obras del seed, P4b/P2/P3/Fase 3/6.2/6.4/6.6) y
     COMERCIAL (12 filas: C3, F5, §10 ×4, 6.7, editor P7).
   - Regla de uso escrita: "al 100% solo cuando sus insumos tienen ✅ en la
     matriz" + nota de deuda transversal (dashboard/gps/documentos/MachineCard
     en mock).
2. **Indices actualizados:** Tier 0 (tarea 5 → ✅) y tabla §7 (F4 → ✅ análisis).
3. **Fix de UX en /cotizaciones** (pedido del usuario): en el estado
   ACEPTADA/RECHAZADA/LISTO los botones `Aceptar`/`Rechazar` ya no se muestran
   deshabilitados flotando — solo aparecen cuando la cotización está
   `PENDIENTE` (el "Editar" sigue visible en cualquier estado, eran solo los
   dos de decisión).
4. Nota de riesgo cerrada: re-verificar el puntero polimórfico `transacciones`
   cuando se ejecute la Fase 3 (puede alterar filas de /finanzas).

## Verificación
- `npx tsc --noEmit`: 0 errores.

## Pendientes y riesgos
- Fix físico de las 4 obras en BD sigue esperando la confirmación del seed.
