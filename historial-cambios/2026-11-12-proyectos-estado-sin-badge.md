# 2026-11-12 — /proyectos: la columna Estado deja de usar badges de color

## Qué se hizo

- **`apps/web/src/app/(dashboard)/proyectos/page.tsx`** — la columna `Estado` de
  la tabla ahora pinta texto plano (`text-sm font-semibold text-ui-700`) en vez
  de `<Badge>` con color por estado. Se eliminan `estadoVariant` y el import de
  `Badge`, que quedaban sin uso.

## Verificación

- `npx tsc --noEmit` (web): sin errores.
- `npx eslint "src/app/(dashboard)/proyectos/page.tsx"`: solo los 2 hallazgos
  preexistentes (`useMemo` sin usar y `setState` en el efecto de carga).

## Pendientes / riesgos

- El resto de las vistas conserva sus badges; este cambio es solo de `/proyectos`.
- Smoke visual pendiente (no hay navegador en este entorno): la columna debe
  mostrar "En Proceso" / "Finalizado" / "Pausado" sin píldora de color.
