# PWA: el aviso "Sin conexión" ya no repite el punto

**Fecha:** 2026-11-24
**Autor:** P4chec0php

## Cambios realizados
- **Antes**, el aviso de datos guardados (`AvisoSinConexion`) decía "…mostrando los datos guardados el 24/11/26,
  11:43 p.m.. La sincronización…": la hora en `es-MX` termina en "a.m." / "p.m." y el texto le agregaba el punto
  de la oración. Pasaba siempre que había fecha, en Inicio, Reportes y Flota y obras.
- **Ahora** el punto solo se agrega si la fecha no termina ya en punto. Sin fecha, la oración cierra igual que
  antes.

## Cosas nuevas
- `AvisoSinConexion.test.tsx`: primeras pruebas del componente.

## Archivos tocados
- `apps/web/src/components/pwa/AvisoSinConexion/AvisoSinConexion.tsx` (modificado)
- `apps/web/src/components/pwa/AvisoSinConexion/AvisoSinConexion.test.tsx` (nuevo)

## Pruebas / verificación
- 4 pruebas nuevas:
  - el aviso no se muestra si no se está sirviendo la copia;
  - con dos horas distintas no sale "..";
  - sin fecha queda un solo punto.

  Con el código anterior fallan las 2 que llevan fecha ("5:43 p.m.. La…"); con el arreglo pasan.
- Suite web 109/109, `tsc` limpio, `eslint` sin errores.
- En el navegador, Flota y obras sin red muestra "…el 24/11/26, 11:56 p.m. La sincronización continúa al volver la
  señal."

## Pendientes y riesgos
- Ninguno. El texto y el comportamiento del aviso no cambian, solo la puntuación.
