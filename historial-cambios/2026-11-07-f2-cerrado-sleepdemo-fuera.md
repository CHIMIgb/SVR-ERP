# F2 cerrado — sleepDemo retirado de las 22 vistas y marcado ✅ en el documento

**Fecha:** 2026-11-07
**Autor:** agente OpenCode

## Cambios realizados
1. **Delay de demo eliminado** (`sleepDemo(3000)`, usado para revisar skeletons):
   - 22 vistas de `(dashboard)` dejaron de tener las líneas `await sleepDemo();`
     (y sus imports) — el script final detectó las variantes inline (el sleep
     había quedado en la MISMA línea del arrow en ~20 páginas por cómo se
     insertó) además de la versión standalone.
   - Helper `apps/web/src/lib/demo-delay.ts` **eliminado**.
2. **`docs-planes/IMPLEMENTACIONES-A-FUTURO.md`:**
   - Índice Tier 0: tarea 3 marcada **✅ REALIZADO 2026-11-07** (limpia el texto
     temporal del sleep).
   - Tabla §7: fila **F2 → ✅ Realizado** con el resumen (RefreshOverlay nuevo,
     consolidación de overlays, paginación siempre visible, KPIs con spinner
     en el valor, botones con skeleton, banners post-carga animados, regla
     dura en AGENTS.md).
   - §11 F2: estado reescrito de "⏳ Pendiente" a ✅ con el detalle final.

## Verificación
- `npx tsc --noEmit` (web): 0 errores tras el retiro — el modulo compila sin
  la lib.
- Búsqueda final de `sleepDemo` en todo el src: **0 residuos**.

## Pendientes y riesgos
- Tier 0 restante: F3 (validación en toasts) y F4 (matriz de flujos); y el
  fix físico de las 4 obras (espera "go").
- Las vistas del módulo Maquinaria (maquinaria/horometro/combustible/
  mantenimiento) siguen en `LoadingState` a página completa — la regla de
  AGENTS.md los cubrirá cuando se toque ese módulo.
