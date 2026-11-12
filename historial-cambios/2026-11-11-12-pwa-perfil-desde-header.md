# PWA — vista de Perfil accesible desde el header (todos los roles)

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)
**Rama:** `pwa-base`

## Cambios realizados (autorizados)

El perfil deja de ser pestaña del nav inferior: se abre tocando el bloque
**avatar + nombre + rol del HEADER** y existe para TODOS los roles.

1. **`(pwa)/layout.tsx`** (shell):
   - Guard de vista: `/m/perfil` exentada junto a `/m/pin-cambio` (ruta
     común, no vista RBAC por rol).
   - Header: el bloque avatar+nombre+rol ahora es `<button>` que navega a
     `/m/perfil` (feedback hover/active). **ThemeToggle y logout SALEN del
     header** (viven solo en Perfil, petición del cliente) — el header
     queda: bloque de perfil + notificaciones.
2. **`lib/pwa/rol-nav.ts`**: `/m/perfil` fuera de `NAV_MOVIL` (deja de
   renderizar la pestaña; icono `User` sin uso removido del import).
3. **`m/perfil/page.tsx`** (reemplaza el placeholder, theme-aware):
   - Encabezado con avatar (iniciales) + nombre completo + rol.
   - Tarjeta "Información del empleado": correo, área (torre) y roles —
     desde `useAuth().user`. El número de empleado NO se muestra (no
     existe en `UserAuth`; llegará con la fase login-PIN del backend).
   - Tarjeta "Tema" con el `ThemeToggle` reutilizado (en móvil es el
     botón rotativo claro/oscuro/sistema que ya trae el componente).
   - Botón «Cerrar sesión» (≥44px táctil) → `logout()` + redirect `/`.
4. **Docs `pwa-docs/vistas-movil-comercial-operaciones.md`** (la carpeta
   fue renombrada de `pwa/` a `pwa-docs/` por el usuario): flujos de nav
   sin Perfil como pestaña + nota del acceso por header (líneas 37, 443,
   525, 581).

## Archivos tocados

- `apps/web/src/app/(pwa)/layout.tsx`
- `apps/web/src/app/(pwa)/m/perfil/page.tsx`
- `apps/web/src/lib/pwa/rol-nav.ts`
- `pwa-docs/vistas-movil-comercial-operaciones.md`

## Pruebas / verificación

- `tsc --noEmit` ✅; eslint ✅ (los 3 archivos de código).
- Pendiente smoke en teléfono: tap en el bloque del header → Perfil;
  nav inferior ya sin la pestaña; tema y logout desde la vista.

## Pendientes y riesgos

- Sin push (orden del usuario).
- El ThemeToggle en Perfil renderiza su variante móvil (botón rotativo);
  si se quisieran los 3 botones explícitos habría que darle una prop.
- El aviso de vencimiento de PIN (banner del shell) no se movió: sigue
  bajo el contenido en todas las vistas.
