# Ajuste visual StatsCard — spinner solo en el valor (icono y etiqueta reales)

**Fecha:** 2026-11-07
**Autor:** agente OpenCode

## Cambios realizados
Ajuste del usuario: el spinner de carga de las KPIs NO debe cubrir toda la
tarjeta — solo el espacio del número. `StatsCard.loading` ahora mantiene:
- **icono real** (chip con su color) y **etiqueta real** ("Total Operaciones",
  etc.) desde el primer render;
- el `Loader2 w-6 h-6 animate-spin text-primary` vive SOLO en la posición/clase
  del valor (`statsCardClasses.value` / `plainValue`), ambas variantes
  (con icono y limpia). Nada de "0" falso, nada de gaps altos.

Docs actualizados: `AGENTS.md` regla 2 y `COMPONENTS.md` §4.1 (текст del prop).

## Verificación
- `npx tsc --noEmit`: 0 errores.

## Pendientes y riesgos
- Ajuste visual menor: la altura de la card durante la carga puede variar 1-2px
  vs. el número real (el spinner no ocupa exactamente el mismo box del texto).
- El trend/hint siguen ocultos durante la carga (solo en LOADING exit previews).
