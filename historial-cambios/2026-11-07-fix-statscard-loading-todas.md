# Fix — loading={initialLoading} real en TODAS las StatsCards (52 cards, 12 vistas)

**Fecha:** 2026-11-07
**Autor:** agente OpenCode

## Diagnóstico (por qué "no tienen spin las KPIs")
El script v4 que inyectaba `loading={initialLoading}` usaba un regex
`<StatsCard\b[\s\S]*?\/>` que paraba en el PRIMER `/>` — que estaba DENTRO del
prop del icono (`icon={<Plus className="w-5 h-5" />}`): por eso solo 1 card por
página recibió la prop (funcionaba en facturas porque ahí el regex aterrizó bien)
y el resto quedó sin el estado de carga.

## Cambios realizados
- Script v5: escáner línea a línea — el cierre de la card es la línea cuyo
  contenido es EXACTAMENTE ` />`; inserta `loading={initialLoading}` inmediatamente
  antes, y salta cards que ya lo tienen. Corrigió 46 cards multilinea.
- Script v6: las cards de UNA sola línea (facturas ×4 y cobranza ×4) reciben la
  prop inyectada en la misma línea.
- Verificación final por página (ocurrencias `loading={initialLoading}`):
  operaciones 4 (3 cards + botón header), inventario 4, proyecto 4, criba 5,
  reportes 5, clientes 8, cotizaciones 5, facturas 5, cobranza 8, proveedores 3,
  finanzas 7, ventas/cierres 4 — 🎯 todas las KPIs del ERP cargan con spinner.

## Verificación
- `npx tsc --noEmit`: 0 errores. Mojibake: 0.

## Pendientes y riesgos
- El lección no-trivial para el registro: cada regex multilinea con `[\s\S]*?` y
  backstop genérico ('\/>') rompe con JSX anidado — anclar el cierre exacto por
  línea. (Segunda vez que un script regex muerde más de lo que debe esta semana.)
