# 2026-11-14 — /equipos: columna de Rol en la tabla

## Qué se hizo

- **Nueva columna "Rol"** en la tabla de `/equipos`, entre Residente y
  Área — muestra los roles activos del residente (texto neutro, "—" si no
  tiene).
- La celda "Residente" deja de repetir el rol en el subtítulo: ahora
  muestra nombre + número de empleado (o email si no tiene).

## Verificación

- `npx tsc --noEmit` (web): limpio; eslint solo su error patrón
  preexistente (`set-state-in-effect`).
- Smoke visual en navegador pendiente (sin navegador).
