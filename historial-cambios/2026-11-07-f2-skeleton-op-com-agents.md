# F2 refuerzo — Operaciones + Comercial 100% con skeleton en primera carga; regla dura en AGENTS.md

**Fecha:** 2026-11-07
**Autor:** agente OpenCode

## Diagnóstico (con observación del usuario)
El usuario vio inconsistencia: "algunas tablas muestran spin y otras skeleton".
Causa real mapeada módulo por módulo:
- Las vistas de DataTable de Operaciones/Comercial **ya pintaban skeleton** de
  primera carga (`DataTable loading={}` — verificado que internamente renderiza
  filas skeleton, DataTable.tsx l64-78): /operaciones, /inventario, /proyectos,
  /criba, /reportes, /clientes, /cotizaciones, /facturas, /cobranza, /proveedores,
  /finanzas, /mantenimiento (maquinaria), /combustible.
- Los faltantes encontrados en Comercial: **/ventas** (POS mostraba spinner en el
  card del catálogo) y **/ventas/corte** (sin estado de carga alguno: contenido
  aparecía de golpe).

## Cambios realizados
1. `/ventas` POS: card del catálogo → `<Skeleton variant="card" />` (antes
   `LoadingState` spinner).
2. `/ventas/corte`: agrega `cargandoConfig` → `<Skeleton variant="card" />`
   mientras carga la config del turno (antes sin indicador; el extra limpia el
   .finally del fetch local, sin tocar lógica).
3. **`AGENTS.md`: regla dura nueva** "Loaders/Skeletons": la primera impresión de
   una vista SIEMPRE es skeleton (tablas = DataTable loading; bloques = Skeleton;
   refetches = RefreshOverlay; LoadingState reservado a auth/layout/acciones) y
   prohibido copiar bloques `Loader2+animate-spin` entre vistas.

## Verificación
- `npx tsc --noEmit`: 0 errores. Diff: 3 archivos, +17/-3.

## Pendientes y riesgos
- `/maquinaria` y `/horometro` (módulo Maquinaria, fuera del alcance pedido)
  todavía renderizan `LoadingState` a página completa con sus tablas HTML
  manuales — hablan la misma regla cuando se toque ese módulo (deuda anotada).
