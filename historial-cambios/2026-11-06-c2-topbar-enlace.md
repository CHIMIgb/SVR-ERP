# Sugerencias review PR #15 (C2) — enlace del Topbar ya no muere

**Fecha:** 2026-11-06
**Autor:** agente OpenCode

## Cambios realizados
`apps/web/src/components/layout/Topbar.tsx:25`: el buscador de módulos
mandaba a `/reportes-campo` (ruta borrada por la unificación de reportes
de este PR) → ahora apunta a `/reportes` con el nombre 'Reportes'.

## Archivos tocados
- `apps/web/src/components/layout/Topbar.tsx` (1 línea)

## Pruebas / verificación
- `npx tsc --noEmit` ✔. eslint en el archivo solo muestra 2 warnings de
  imports sin usar PREexistentes (no tocados por este cambio).

## Pendientes y riesgos
- Verificación manual en navegador pendiente (Sidebar ya cubierto en el
  bloqueador 3; Topbar era el segundo punto de entrada con la ruta vieja).
