# Aviso de datos viejos por snapshot servido (no por navigator.onLine)

**Fecha:** 2026-11-21
**Autor:** SVR-ERP Dev (agente)

## Cambios realizados
- Punto I-3 de la segunda revisión del PR #23: `AvisoSinConexion` ya NO
  depende de `navigator.onLine` (antes se ocultaba con Wi-Fi vivo aunque se
  sirviera snapshot — el caso típico: server de la LAN caído). Ahora el
  padre le dice si está sirviendo snapshot con la prop obligatoria
  `sirviendoSnapshot`; `false` renderiza `null`.
- `/m/reportes`: nueva bandera `mostrandoSnapshot` que `recargar()` controla
  (true al servir snapshot, false al traer datos frescos o al fallar sin
  snapshot). El banner vive solo con esa bandera y `!cargandoInicial`.
- `/m` (Inicio): la condición `carga.tipo === "offline"` ya era "se sirvió
  snapshot"; se pasa la prop y el banner ya no se auto-oculta por onLine.
- `COMPONENTS-PWA.md` §6b actualizado (descripción, props, cuándo usar/no).

## Cosas nuevas
- Prop `sirviendoSnapshot` en `AvisoSinConexion` (obligatoria).
- Estado `mostrandoSnapshot` en `/m/reportes`.

## Archivos tocados
- apps/web/src/components/pwa/AvisoSinConexion/AvisoSinConexion.tsx (modificado)
- apps/web/src/app/(pwa)/m/reportes/page.tsx (modificado)
- apps/web/src/app/(pwa)/m/page.tsx (modificado)
- COMPONENTS-PWA.md (doc del componente)

## Pruebas / verificación
- `npx tsc --noEmit` en apps/web: limpio.
- `npm run lint` en apps/web: 0 errores, 38 warnings preexistentes.
- `npm test -- --runInBand`: 5 suites, 16/16 tests.
- `git diff --check`: limpio.
- Smoke manual en teléfono (Wi-Fi vivo + server caído): NO realizado — es
  el escenario exacto que este cambio corrige.

## Pendientes y riesgos
- Sin tests front de este componente (la revisión pide cubrir los estados;
  el test de AvisoSinConexion puede entrar cuando se toquen los helpers de
  pantalla).
- El texto del banner dice "La sincronización continúa al volver la señal":
  con server caído y Wi-Fi vivo la frase es imprecisa (la señal está, falta
  el server); se deja porque el comportamiento real (reintentar) es el mismo.
