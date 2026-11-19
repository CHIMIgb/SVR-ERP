# Vistas de la PWA (`/m/*`)

**Fecha:** 2026-11-18

La PWA vive dentro de `apps/web` como grupo de rutas `(pwa)` con URL `/m/*`.
Las vistas se registran en la tabla `vistas` (migración
`20261111130000_pwa_vistas_rbac`, `es_menu = FALSE`, orden 900+) y alimentan
`user.vistas`, de donde lee `lib/pwa/rol-nav.ts` para construir la navegación
inferior. **Prohibido hardcodear el menú por rol en cada pantalla.**

Fuentes de este catálogo: `pwa-docs/vistas-movil-comercial-operaciones.md`
(§7b, §8.1-2 y §8.8), `historial-cambios/2026-11-11-pwa-paso1-migraciones.md`
y `historial-cambios/2026-11-11-pwa-paso5-placeholders-guard.md`.

## Catálogo de las 13 vistas

| # | Ruta | Nombre en BD | ¿Pestaña? |
|---|------|--------------|-----------|
| 1 | `/m` | Inicio | Sí, universal |
| 2 | `/m/asistencia` | Asistencia | Sí (El Residente ve además la de su equipo) |
-| 3 | `/m/reportes` | Reportes | Sí |
| 4 | `/m/contactos` | Contactos | Sí (Trabajador y Residente) |
-| 5 | `/m/perfil` | Mi perfil | **No**: se abre desde el header, común a todos los roles |
-| 6 | `/m/obras` | Obras | Sí (Residente) |
| 7 | `/m/flota-obras` | Flota y obras | Sí (Técnicos) |
-| 8 | `/m/inventario` | Inventario | Sí (Técnicos) |
| 9 | `/m/diesel` | Diésel | Sí (según la spec, solo Técnico-Diesel — ver nota) |
-| 10 | `/m/pos` | POS | Sí (Cobrador) |
-| 11 | `/m/corte` | Corte del día | Sí (Cobrador) |
-| 12 | `/m/finanzas` | Finanzas | Sí (Administrador) |
| 13 | `/m/modulos` | Módulos | Sí (Administrador) |

## Clasificación por módulo (Comercial / Operaciones)

Equivalencia entre la vista PWA y la ruta del escritorio del mismo módulo. El
resto de las vistas (`/m`, `/m/asistencia`, `/m/contactos`, `/m/perfil`,
`/m/flota-obras`, `/m/diesel` y `/m/modulos`) queda fuera de esta clasificación.

### Operaciones

| Vista PWA | Nombre en BD | Vista de escritorio |
|---|---|---|
| `/m/reportes` | Reportes | `/reportes` |
| `/m/inventario` | Inventario | `/inventario` |
| `/m/obras` | Obras | `/proyectos` |

### Comercial

| Vista PWA | Nombre en BD | Vista de escritorio |
|---|---|---|
| `/m/pos` | POS | `/ventas` |
| `/m/corte` | Corte del día | `/ventas/corte` |
| `/m/finanzas` | Finanzas | `/finanzas` |

## Rutas auxiliares que NO son vistas RBAC

| Ruta | Para qué | Acceso |
|------|----------|--------|
| `/m/pin-cambio` | Cambio obligatorio de PIN en el primer ingreso | Exenta del guard de vistas del shell; siempre permitida |

## Matriz por rol (según la spec §7b / §8.8)

| Rol | Pestañas |
|-----|----------|
| Trabajador | `/m` Inicio · `/m/asistencia` · `/m/reportes` · `/m/contactos` |
| Residente | `/m` Inicio · `/m/asistencia` (equipo) · `/m/reportes` · `/m/obras` · `/m/contactos` |
| Técnico (×4 en la spec) | `/m` Inicio · `/m/asistencia` · `/m/reportes` · `/m/flota-obras` · `/m/inventario` (+ `/m/diesel` solo Técnico-Diesel) |
| Cobrador | `/m` Inicio · `/m/asistencia` · `/m/pos` · `/m/corte` |
| Administrador | `/m` Inicio · `/m/reportes` · `/m/finanzas` · `/m/modulos` |

La asistencia es universal: `puede_ver` de `/m/asistencia` para Trabajador,
Residente, los 4 Técnicos y Cobrador (solo ver; la captura es propia). El
Residente además consulta la de su equipo con los permisos de asistencia ya
existentes.

## Notas

- `/m/perfil` no es pestaña: se abre desde el header (avatar + nombre + rol).
  El guard del shell la exenta del RBAC de vistas.
- Las 12 rutas distintas de `/m` y `/m/pin-cambio` se crearon como
  `PantallaPlaceholder`; total documentado: 14 pantallas móviles.
- **Desactualización conocida:** la spec habla de «Técnico (×4)» y de
  `/m/diesel` exclusivo de Técnico-Diesel. Hoy los cuatro técnicos están
  consolidados en un solo rol `Técnico`. La matriz de arriba reproduce lo
  documentado; para conceder accesos, verificar antes contra la BD real.
- El catálogo de la tabla `vistas` y la nav se mantienen sincronizados mediante
  la migración seed idempotente; no hay mapeos ad hoc en `rol-nav.ts`.
