# Modo oscuro — el legacy `.card` tokenizado (causa raíz capturada por el usuario)

**Fecha:** 2026-11-05
**Autor:** agente OpenCode (por capturas nuevas del usuario en /finanzas)

## Diagnóstico (análisis pedido por el usuario)
- El card de "Flujo Neto Proyectado" y el panel/cuenta de "Conciliación"
  usaban la clase global **`.card`** de `globals.css` (`@layer components`).
- El autor del PR #13 la dejó **sin dark a propósito** (lo declaró en las
  Notas del PR: "para que tus tarjetas sigan legibles" mientras él adaptaba
  las suyas).
- Por eso	tokenizar las VISTAS no alcanzó: el wrapper era el legacy global.
- Es el motivo del ajedrez: los "componentes reutilizables" (`Card` del ui)
  ya están tal y como están definidos, pero la clase CSS `.card` era blanca
  como base.

## Cambios realizados (1 solo lugar, a nivel global — según lo pedido)
- `apps/web/src/app/globals.css`: la clase `.card` pasa de
  `bg-white border-slate-200` a **`bg-surface border-ui-200`**; con esto la
  clase legacy se voltean **automáticamente** con `.dark` en TODAS las vistas
  que la usan (finanzas, conciliación y cualquier otro módulos sin olvidar)
  — mismos estados en claro (idéntico: blanco/🤝 es igual para ambos tokens).
- Regla respetada: solo se llaman variables globales (por ejemplo
  `--color-surface/--color-ui-200`) — nada de colores crudos nuevos.
- En turbopack dev corriendo verificado el CSS compilado:
  `.card { ... border-color: var(--color-ui-200); background-color:
  var(--color-surface); }` ✔ (el compilado lo refleja ya con hot reload).

## Archivos tocados
- `apps/web/src/app/globals.css` (solo la clase `.card`).

## Pruebas / verificación
- `npx tsc --noEmit` web ✔.
- CSS compilado inspeccionado después del cambio (arriba) ✔.

## Pendientes y riesgos
- Los títulos/textos que todavía estén apoyando otros elementos legacy
  (`bg-slate-*` clusters) ahora se voltea con los tokens del sistema.
- Si alguna vista necesita sombras mas o zonas de impresión, se usan las
  clases propias según el plan — no se toca `.btn-primary` (perma el botón).
