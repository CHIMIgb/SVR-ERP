# Catálogo documentado de las vistas de la PWA

**Fecha:** 2026-11-18
**Autor:** agente

## Cambios realizados
- Se creó `docs-planes/docs-pwa/VISTAS-PWA.md` con el catálogo completo de las vistas móviles: las 13 rutas `/m/*` con su nombre en la tabla `vistas`, la ruta auxiliar `/m/pin-cambio` (exenta del RBAC), la matriz de pestañas por rol y las notas de asistencia universal, perfil y desactualización de los roles técnicos.
- La información se tomó de las fuentes ya existentes: `pwa-docs/vistas-movil-comercial-operaciones.md` (§7b, §8.1-2, §8.8) y los registros `2026-11-11-pwa-paso1-migraciones.md` y `2026-11-11-pwa-paso5-placeholders-guard.md`. No se inventaron vistas ni se modificó ninguna.

## Cosas nuevas
- `docs-planes/docs-pwa/VISTAS-PWA.md` (directorio `docs-planes/docs-pwa` ya existía, vacío).

## Archivos tocados
- `docs-planes/docs-pwa/VISTAS-PWA.md` (creado)
- `historial-cambios/2026-11-18-vistas-pwa-documento.md` (creado)

## Pruebas / verificación
- Solo documentación: no se corrió `tsc`, lint ni tests. Se verificó previamente que el directorio destino existía y no había archivo con el mismo nombre.

## Pendientes y riesgos
- La matriz por rol reproducida proviene de la spec y menciona «Técnico (×4)» y `/m/diesel` para Técnico-Diesel; esos roles ya se consolidaron en `Técnico`. El documento lo advierte explícitamente.
- No se contrastó el catálogo contra la tabla real `vistas` ni contra `lib/pwa/rol-nav.ts`; si hay divergencia, manda la BD.
