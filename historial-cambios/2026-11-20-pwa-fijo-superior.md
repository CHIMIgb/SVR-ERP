# Bloque superior fijo en /m/reportes + aclaración del botón Ubicación

**Fecha:** 2026-11-20
**Autor:** agente
**Origen:** captura del usuario — «que todo lo que está arriba de filtros se quede fijo, que solo se deslicen los reportes» + «no veo el botón ubicación»

## Hallazgo del botón Ubicación (no es bug)
Los reportes de la captura (INC0053/0039/0029/0011) **no tienen ubicación en
BD**: verificado con psql — `proyecto_id` NULL, `proyecto_direccion` NULL
(no existe columna en la tabla: el domicilio se arma del proyecto),
`latitud`/`longitud` NULL. Son reportes demo creados ANTES de que existiera
la captura de ubicación. El botón aparece solo en reportes CON dónde ver
(obra o GPS) — se prueba creando un reporte nuevo desde el modal de la PWA
(GPS u obra).

## Cambios realizados
- **`(pwa)/m/reportes/page.tsx`:** todo lo que está arriba de la lista
  (encabezado + stats + EstadoCola + error de carga + búsqueda + chips)
  quedó en un bloque **`sticky top-0 z-20 bg-canvas -mx-4 px-4 pb-3`** — se
  queda pegado bajo el header del shell mientras **solo la lista de
  reportes desliza**. Patrón sticky sobre el scroll de la página (sin
  contenedor anidado — la técnica que se descartó antes por anti-patrón en
  móvil; con sticky el scroll sigue siendo uno solo, el de la página).
- Los chips ya no necesitan su sangrado `-mx-4` (el bloque fijo ya cubre a
  todo lo ancho).

## Archivos tocados
- `apps/web/src/app/(pwa)/m/reportes/page.tsx`
- `historial-cambios/2026-11-20-pwa-fijo-superior.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit`: 0 errores. `npm run lint`: 0 errores, 37 warnings preexistentes.
- `git diff --check`: sin errores.
- Smoke pendiente: deslizar los reportes y confirmar que el bloque superior
  se queda fijo sin saltos, y que los cards pasan por debajo.

## Pendientes y riesgos
- El bloque fijo consume ~45% de la pantalla (header+stats+buscador+chips):
  es lo pedido, pero si con muchas notificaciones en cola (EstadoCola) se
  siente alto, se puede plegar el buscador o stats.
- Sin push: el commit queda local.
