# Modo oscuro — /proveedores y Avatar compartido (fase 8b)

**Fecha:** 2026-11-05
**Autor:** agente OpenCode (por captura del usuario)

## Diagnóstico
- La vista `/proveedores` NO estaba en los dominios que barrí en las fases
  previas (fue su fase aparte por el otro dev e mi barrido no la incluyó).
  Conservaba 45 clases crudas `bg-white/slate-*` (nombre, avatar letra,
  categorías, RFC, teléfono).
- El componente `Avatar` compartido SÍ estaba migrado por el PR #13
  (`bg-primary/10`… y niveles success/warning/error/info con `dark:` ya) —
  salía gris simplemente porque la página le `pro` heredaba text crudo. La
  letra oscura del avatar `bg-ui-900` era la clase que la imagen mostraba.

## Cambios realizados (scripts/oscuro-fase8b.cjs, reprod.)
- `/proveedores/page.tsx`: 45 reemplazos `bg-white→bg-surface`, `slate-N→ui-N`.
- `components/ui/Avatar/Avatar.styles.ts`: 0 cambios necesarios (como el PR13
  ya lo incluía).

## Pruebas / verificación
- `npx tsc --noEmit` web: 0 errores ✔
- grep de crudos en la vista y Avatar: 0 residual ✔

## Pendientes y riesgos
- Revisión visual del usuario — módulos restantes fuera del alcance
  (RRHH/Maquinaria/Sistema) siguen siendo tarea del otro dev.
