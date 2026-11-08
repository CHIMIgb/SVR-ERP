# GPS: el recorrido que se muestra es siempre el de la máquina seleccionada

**Fecha:** 2026-11-08
**Autor:** P4chec0php

## Cambios realizados
**Bug:** al elegir otra máquina en GPS, los "Eventos de hoy" y el "Recorrido de hoy" de la máquina **anterior**
seguían en pantalla, bajo el nombre de la nueva, hasta que llegaba la respuesta. Si la respuesta fallaba o
tardaba, se quedaba la información equivocada. Solo se mostraba "Cargando…" la primera vez.

Ahora el historial y el error se comparan con la máquina seleccionada al pintarse (`maquinaId`). Lo de otra
máquina no se muestra: se ve "Cargando…" hasta que llega lo suyo. No se vacía en cada refresco de 30 s, así que
tampoco parpadea. El error guarda de qué máquina es, para no aparecer bajo otra.

## Archivos tocados
- `apps/web/src/app/(dashboard)/gps/page.tsx`

## Verificación
- `npx tsc --noEmit` y `npx eslint` de la vista: sin errores. El typecheck atrapó un caso sin máquina
  seleccionada (`undefined === undefined`), que se cubrió.
- En el navegador, al cambiar de máquina el panel carga lo de la nueva sin errores de consola. El instante
  intermedio, mientras llega la respuesta, no se pudo capturar con el script de capturas.

## Pendientes
- Ninguno.
