# 2026-11-14 — /roles: barra de búsqueda y filtros arriba de cada tabla

## Qué se hizo

El tab Usuarios de `/roles` **sí tenía** la barra de búsqueda y filtros,
pero quedó renderizada **debajo** de la tabla (el reorden del commit
anterior movió el bloque de búsqueda detrás de los `</Tabs>`). Ahora cada
**TabPanel** abre con su **SearchBar + Filtros** arriba (entre la píldora
de tabs y la tabla), exactamente como la referencia de conciliación.

- Tab Roles: búsqueda (nombre/descripción) + filtros Área y Uso.
- Tab Usuarios: búsqueda (nombre/correo/número) + filtros Área y Estado PIN.

## Nota de proceso

Al mover los bloques con un script, se comió accidentalmente los 4
FormModal de la vista (crear/editar/eliminar/estado); se restauraron
íntegros desde git (verificado con `tsc` + conteo de modales).

## Verificación

- `npx tsc --noEmit` (web): limpio; eslint solo el error patrón
  preexistente.
- Estructura verificada: los 2 TabPanel abren con su SearchBar; los 7
  modales (crear, editar, eliminar, estado, vistas, permisos, ficha) están
  completos.
- Smoke visual en navegador pendiente (sin navegador).
