# GPS: vista limpia, aviso de posiciones simuladas y día del historial en hora de México

**Fecha:** 2026-11-06
**Autor:** P4chec0php

## Cambios realizados
- **Vista con el mismo patrón que las demás:**
  - Encabezado corto, botones sin íconos ("Simular posiciones" y "Nueva geocerca"), indicadores en una
    sola tira y pestañas sin íconos.
  - Tokens de modo oscuro; antes quedaban 14 clases `slate-*` y un `bg-white`.
  - Debajo de los indicadores, la hora de la última actualización.
  - **Aviso de posiciones simuladas.** Mientras no llegue el feed del proveedor, las posiciones las genera
    la simulación. La vista lo avisa y ya no muestra "EN VIVO".
  - **Carga por fuente** (rastreo y geocercas) con aviso y Reintentar:
    - Si falla el refresco de cada 30 s, se avisa y se dice de qué hora son las posiciones. Antes el error
      se tragaba.
    - El recorrido de hoy tiene su propio aviso de error. Antes un fallo se mostraba como "sin entradas ni
      salidas hoy".
  - **Geocercas:** paginadas en el servidor (antes se pedían 100 y el resto se cortaba sin aviso).
    - Modal con errores por campo y las reglas de la API.
    - Eliminar pide confirmación con botón rojo (antes era un `window.confirm`).
  - A 1024 px el panel de la máquina baja debajo del mapa; al lado quedaba tan angosto que se cortaba.
- **API** (`gps.service.ts`):
  - Las 5 consultas que marcaba el auditor de paginación tienen tope (catálogo de máquinas, geocercas
    activas, y máquinas × geocercas para los cruces).
  - La respuesta del rastreo agrega `simulada`: la última posición la generó la simulación
    (`proveedor_gps = 'SIMULADO'`).
- `common/validacion.ts`: nuevos `inicioDelDiaEnZona()` y `sumarDiasFecha()`.

## Bugs corregidos
- **El recorrido "de hoy" cortaba el día a medianoche UTC.** En México eso es de 6 p.m. de ayer a 6 p.m. de
  hoy: aparecían como de hoy las posiciones de anoche, y lo de hoy después de las 6 p.m. no salía hasta el
  día siguiente. Ahora el día se corta en la zona de la empresa.
- **La alerta de consumo del rastreo usaba la columna congelada** `alerta_consumo_anormal`, que no la
  actualiza ningún flujo. Ahora sale de la última carga real (`MaquinasService.ultimaCargaPorMaquina`),
  igual que en Flota.
- **Datos simulados presentados como reales:** "Actualizar posiciones" y el indicador "EN VIVO" hacían
  pasar por rastreo real las posiciones simuladas.

## Archivos tocados
- `apps/api/src/gps/gps.service.ts`, `gps.module.ts`, `gps.service.spec.ts` y `gps.integration.spec.ts`
- `apps/api/src/common/validacion.ts` y `validacion.spec.ts` (nuevo)
- `apps/web/src/lib/api.ts` (solo se agregó `simulada` a `MaquinaGpsDTO`)
- `apps/web/src/app/(dashboard)/gps/page.tsx` (reemplazo completo)

## Verificación
- `npx tsc --noEmit` en `apps/api` y `apps/web`, y `npx eslint` de la vista: sin errores.
- Unitarias de GPS y de `common`: 65 de 65. Incluyen:
  - La alerta sale de la última carga y no de la columna.
  - El inicio del día en México y en una zona con horario de verano.
  - Fechas que cambian de mes y de año.
- Integración de GPS contra Postgres real: 13 de 13. Incluye que, para el 15 de enero, el historial trae
  las posiciones de las 10:00 y las 19:00 y deja fuera la de las 21:30 del día anterior.
- El auditor de paginación (`audit-pagination.cjs`) ya no marca el módulo.
- Capturas a 390, 768, 1024 y 1440 px, en claro y oscuro: rastreo, geocercas, el modal con errores y la
  confirmación de eliminar.

## Pendientes
- Conectar el feed del proveedor GPS cuando la empresa dé el acceso. Solo hay que llamar a
  `procesarGeocercas()` con sus posiciones.
