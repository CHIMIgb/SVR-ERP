# Limpieza UI: fuera simulador-movil, menú de usuario y botón de sesión

**Fecha:** 2026-11-04
**Autor:** agente OpenCode (a petición del usuario)

## Cambios realizados
1. **QUITADO el módulo "Simulador App"** (`/simulador-movil`, prototipo):
   - Eliminada la ruta `apps/web/src/app/(dashboard)/simulador-movil/page.tsx` (-899 líneas).
   - Quitado del `ROUTE_META` de `Sidebar.tsx`.
   - Eliminado de la BD local: `role_vistas` (1 fila) + `vistas` (1 fila, quedan 26).
2. **QUITADO el recuadro emergente al clic en el usuario (Topbar):**
   - Ya no aparece el popup con email/rol/"Cerrar Sesión" de la imagen 1 — los datos
     del usuario quedan solo informativos (div, no botón).
   - Se quitaron estado/ref/click-fuera/logout del Topbar (el logout vive solo en el sidebar).
3. **Botón "Cerrar Sesión" del sidebar más agarrable:**
   - Ahora es botón rojo sólido completo (borde + fondo red-500, texto blanco)
     SIEMPRE, no solo al hover; hover aclara a red-400 y `active:scale` al presionar.
   - Al cerrar sesión redirige al login (`window.location.href = "/"`) — antes se
     quedaba en la vista abierta sin usuario.

## Cosas nuevas
- Ninguna; sustracción y ajuste de estilo.

## Archivos tocados
- `apps/web/src/app/(dashboard)/simulador-movil/page.tsx` (eliminado)
- `apps/web/src/components/layout/Sidebar.tsx` (modificado)
- `apps/web/src/components/layout/Topbar.tsx` (modificado)
- BD local `svr_erp`: DELETE en `role_vistas` y `vistas` (ruta /simulador-movil)

## Pruebas / verificación
- `npx tsc --noEmit` (apps/web): limpio ✔ (tras limpiar `.next/types` con la caché
  de la página borrada).
- BD verificada: 26 vistas restantes.
- Pendiente: prueba visual en el navegador (sidebar + clic en usuario).

## Pendientes y riesgos
- La vista muriera también en las semillas (`seed_rbac/migration.sql`) se deja
  histórica — NO se re-aplica al sistema (baseline). Si se restaura desde el dump
  del 8-sep, la vista de simulador volverá a aparecer como link muerto; habría que
  repetir el DELETE.
- Login/logout verificado por código; pruebas de navegación del browser no.
