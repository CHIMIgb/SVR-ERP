# PWA: el selector de tema solo deja Claro y Oscuro (fuera "Sistema")

**Fecha:** 2026-11-11
**Autor:** agente SVR-ERP (GLM-5.3-Flash)

## Cambios realizados
- El toggle de tema del **perfil de la PWA** ya no ofrece "Usar el tema del sistema"
  (ícono de computadora): solo **Claro** y **Oscuro**. El tema del teléfono pasa a ser
  el DEFAULT inicial (cambio anterior), no una opción elegible — una vez que el
  usuario fija claro u oscuro, ese queda.
- El escritorio conserva sus tres opciones (regla de independencia escritorio/PWA):
  `ThemeToggle` recibió el prop `conSistema` (default true) y el perfil le pasa `false`.

## Archivos tocados
- `apps/web/src/components/layout/ThemeToggle.tsx` (modificado: prop `conSistema`)
- `apps/web/src/app/(pwa)/m/perfil/page.tsx` (modificado: `conSistema={false}` + texto)

## Pruebas / verificación
- `npx tsc --noEmit` verde.
- Pendiente smoke en el teléfono: el perfil muestra 2 opciones y el ciclo
  móvil rota claro ↔ oscuro.

## Pendientes y riesgos
- Edge menor: si la preferencia guardada es `system` (default), el toggle muestra
  "Claro" como activo hasta que el usuario toque una opción — visual, no funcional.
