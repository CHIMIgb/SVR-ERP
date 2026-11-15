# 2026-11-14 — /roles: modales de Vistas y Permisos en solo lectura para el Administrador

## Qué se hizo

El hueco del frontend que el cliente pisó (abrir "Permisos" del
Administrador con checkboxes editables — el backend lo rechazaba con
`ROL_SISTEMA_PROTEGIDO`):

- Los modales de **Vistas** y **Permisos** ahora abren en **modo solo
  lectura** cuando el rol es `es_sistema` (Administrador):
  - Checkboxes **deshabilitados**.
  - **Sin botón Guardar** (el footer muestra solo Cerrar).
  - Con el matiz pedido: se muestran **SOLO las vistas y permisos que el
    rol tiene asignados** (vistas con `puedeVer`; permisos con
    `asignado=true`) — no la lista completa con desmarcados.
  - Subtítulo del modal indica "Solo lectura — ...".
- El backend NO cambia: `validarRolEditable` (403 `ROL_SISTEMA_PROTEGIDO`
  + auditoría FAIL) sigue siendo la muralla final.

## Verificación

- `npx tsc --noEmit` (web): limpio; eslint solo el error patrón
  preexistente.
- Smoke visual en navegador pendiente (sin navegador).
