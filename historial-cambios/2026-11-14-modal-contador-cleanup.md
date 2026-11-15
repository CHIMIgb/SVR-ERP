# El contador de modales solo decrementa si el modal abrió

**Fecha:** 2026-11-14
**Autor:** Agente (fix 2 de la review del PR #20 · plan en `docs-planes/PLAN-FIXES-REVIEW-PR20-2026-11-14.md`)

## Cambios realizados
- En `Modal.tsx` del kit (`src/components/ui/Modal/`), el `return () => {...}` del `useEffect` no
  estaba condicionado: el cleanup corre **siempre**, pero el incremento solo con `open === true`.
  Tres caminos malos, todos cerrados con un early-return cuando `!open` (el cleanup solo se registra
  en las corridas que sí incrementaron):
  1. **Modal cerrado que se desmonta** mientras otro está abierto: el cleanup restaba −1 sin haber
     sumado → el contador llegaba a 0 y **liberaba el scroll del fondo con el otro modal encima**.
  2. **Peor (no mencionado en la review):** `handleKeyDown` = `useCallback([onClose, persistent])`;
     los 36 archivos que usan el kit pasan `onClose` inline → identidad nueva en cada render del
     padre → el efecto re-corre → **cada re-render de un modal cerrado restaba −1** (cleanup resta,
     el body no suma). Con un modal abierto y la página re-renderizando, el contador se clampa a 0
     una y otra vez liberando el scroll.
  3. **Modal abierto con `onClose` inline:** resta y suma balanceado en el mismo flush (sin parpadeo
     visible), pero re-tocaba `paddingRight` cada vez (thrash menor).
- El listener de Escape no se pierde: con `open=false` nunca se agregó, y el early-return conserva
  eso. El comportamiento con `open=true` queda idéntico (anidados: solo el último en cerrarse
  libera).

## Archivos tocados
- `apps/web/src/components/ui/Modal/Modal.tsx`

## Verificación
- `npx tsc --noEmit` en `apps/web`: sin errores.
- `npx eslint src/components/ui/Modal`: sin errores.
- ⚠️ **Smoke pendiente del usuario** (sin infra de tests front), en cualquier vista con modal (ej.
  `/inventario`):
  1. Abrir modal A → abrir B encima → cerrar B → el fondo sigue bloqueado hasta cerrar A.
  2. Modal con `onClose` inline que se desmonta sin haberse abierto (cambiar de tab) → abrir otro
     modal → el fondo bloquea bien.
  3. (Opcional) abrir un modal y disparar un refetch con `RefreshOverlay` → el fondo sigue
     bloqueado.

## Pendientes / riesgos
- Riesgo bajo: el único caso que cambia es el cleanup de corridas con `open=false`, que antes restaba
  de más.
- Faltan las fases 3 (migraciones — pendiente decisión Opción 1/2) y 4 (panel GitGuardian) del plan.
