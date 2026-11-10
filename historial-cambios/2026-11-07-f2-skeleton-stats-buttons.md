# F2 global — skeleton en KPIs (StatsCard) y botones de acción (Button)

**Fecha:** 2026-11-07
**Autor:** agente OpenCode

## Cambios realizados
1. **`StatsCard`** (componente global de KPIs): prop nuevo `loading?: boolean` —
   conserva la tarjeta y muestra barras skeleton (icono/valor/etiqueta; ajustes al
   diseño limpio sin icono). Primera impresión con datos reales, nunca "0" falso.
2. **`Button`** (global): prop nuevo `skeleton?: boolean` — placeholder pulsante con
   el tamaño del botón (barra `ui-*` que se invierte en modo oscuro), deshabilitado
   + `aria-busy`, sin texto ni click. NOPs: `loading` de submit sigue igual.
3. **Inyección en las 12 vistas** de Operaciones + Comercial con `initialLoading`:
   - `loading={initialLoading}` en CADA `<StatsCard>` (48 tarjetas en total).
   - `skeleton={initialLoading}` en el botón principal del `PageHeader` (8 vistas —
     facturas/cobranza/proveedores/finanzas/cierres no tienen action en el header;
     sus CTAs viven fuera y quedan sin placeholder, fila pendiente documentada).
4. **`COMPONENTS.md`:** los dos props documentados (Button §2.1, StatsCard §4.1)
   con referencia a la regla dura de AGENTS.md.
5. Fuera de alcance: vistas no-OP/Com (dashboard/rrhh) — el prop global ya está
   disponible para cuando se toque cada módulo.

## Verificación
- `npx tsc --noEmit` (web): 0 errores.
- ESLint muestras: sin warnings nuevos (los `setState-in-effect` son preexistentes).
- Diff: 12 páginas + 2 componentes + docs.

## Pendientes y riesgos
- Los botones CTA dentro de Content (no header) de facturas/cobranza/proveedores/
  finanzas sin skeleton de carga — colocar manualmente si el reviewer lo pide.
- El effet pre de StatsCard en reportes/cobranza etc: para páginas cuyo
  `initialLoading` es React state único, múltiples StatsCards repiten la misma
  señala (ok por diseño).
