# F2 — /proveedores y /finanzas: botones con skeleton + tablas de proveedores al estándar

**Fecha:** 2026-11-07
**Autor:** agente OpenCode

## Cambios realizados
1. **/finanzas:** los botones del header (`Exportar` y `Nueva Transacción`)
   reciben `skeleton={initialLoading}` (el placeholder pulsante con su tamaño).
   No los detectó el automatismo v4 porque su `action` empieza con un `<div>` de
   dos condicionales — corrección manual.
2. **/proveedores:** mismo tratamiento en `Nueva Orden` + `Proveedor`.
3. **Tablas de /proveedores (las 4 al estándar DataTable-loading):**
   - Principal (`proveedores`) y OC (`ordenes`): la rama de carga ya no usa
     `Skeleton variant="table"` (skeleton suelto de 4 columnas sin contenedor,
     el de la imagen 3) — ahora renderiza el **DataTable real con `loading`**,
     mismo look que el resto del ERP (contenedor + skeleton por columna real).
   - **Estados de cuenta** (antes `resumenFiltrado.length === 0 ? EmptyState :
     …`): nueva rama `initialLoading → DataTable loading` — ya no muestra
     "Sin estados de cuenta" vacío durante la primera carga.
   - **Ledger** (modal detalle): `loading={!ledger}` en su DataTable.
   - Imports muertos limpiados (`Skeleton`, `RefreshOverlay` de cobranza-mark).
4. Estándar recordatorio: REGLA GLOBAL — el skeleton de tabla SIEMPRE es el del
   componente `DataTable` (`loading=`), nunca `Skeleton variant="table"` suelto;
   grabado así en `AGENTS.md` desde el refuerzo anterior.

## Verificación
- `npx tsc --noEmit`: 0 errores.
- ESLint proveedores/finanzas: 0 warnings nuevos (imports muertos fuera).

## Pendientes y riesgos
- Otros CTAs interiores (tabs de /finanzas: contraseñas export/lote) revisar si
  el reviewer los quiere con skeleton — pendiente de pasada fina.
