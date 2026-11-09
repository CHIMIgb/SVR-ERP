# Asistencia: la geocerca se valida con la ubicación guardada de la obra

**Fecha:** 2026-11-05
**Autor:** P4chec0php

## Cambios realizados
- **Bug de seguridad corregido**: la API validaba la geocerca de cada marcaje (entrada y pase de lista) con
  `obraLat`, `obraLng` y `radioPermitidoMetros` que mandaba el navegador. Cualquiera podía declarar la obra
  donde estaba y salir "en sitio", o mandar un radio enorme. Ahora la API usa la ubicación y el radio
  guardados de la obra (`obras.lat`, `obras.lng`, `obras.radio_permitido_metros`); esos campos se quitaron de
  los DTO y, si un cliente los manda, la validación global responde 400.
- **Decisión del cliente**: en una obra sin ubicación registrada no se marca asistencia hasta que se registre.
  La API rechaza con `OBRA_SIN_COORDENADAS` (auditado) y la pantalla lo avisa, marca esas obras como
  "(sin ubicación)" y desactiva el botón de registrar. Se quitó el punto de referencia fijo que se usaba antes.
- Si la obra tiene ubicación pero no radio, se usa el radio por defecto (2 km).

## Archivos tocados
- `apps/api/src/asistencia/asistencia.service.ts` (modificado: helper `geocercaDeObra`)
- `apps/api/src/asistencia/dto/marcar-entrada.dto.ts`, `marcar-cuadrilla.dto.ts` (modificados)
- `apps/api/src/asistencia/asistencia.service.spec.ts`, `asistencia.integration.spec.ts` (modificados)
- `apps/api/src/nomina/nomina.integration.spec.ts` (modificado: obra de prueba con ubicación)
- `apps/web/src/app/(dashboard)/asistencia/page.tsx`, `apps/web/src/lib/api.ts` (modificados)

## Pruebas / verificación
- `npx jest`: 1038 de 1040 (las 2 que fallan son de `cobranza.service.spec.ts`, por fecha, ajenas).
- Unitarias nuevas: geocerca con la ubicación/radio de la obra, radio por defecto, y rechazo
  `OBRA_SIN_COORDENADAS` en entrada y en pase de lista.
- Integración (en serie) de asistencia, nómina y GPS: pasan. Las pruebas ahora crean sus propias obras de
  prueba (con y sin ubicación) en vez de usar una obra real.
- Smoke con la API corriendo: mandar `obraLat` → 400; obra sin ubicación → 400 con mensaje; sin token → 401.
- `npx tsc --noEmit` y `eslint` en web: sin errores.

## Pendientes y riesgos
- **Bloqueante para mergear**: hoy ninguna obra tiene ubicación registrada y el sistema no tiene forma de
  registrarla (no hay endpoint ni pantalla). Con este cambio nadie podría marcar asistencia hasta que eso
  exista o se carguen las ubicaciones.
- Las integraciones en paralelo de asistencia y nómina chocan entre sí (nómina genera la nómina de la
  semana para todos los trabajadores activos, incluidos los de prueba de asistencia); correrlas con
  `--runInBand`.
