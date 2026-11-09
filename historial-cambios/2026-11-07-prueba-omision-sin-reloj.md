# La prueba de omisión sin marcaje ya no depende de la hora

**Fecha:** 2026-11-07
**Autor:** P4chec0php

## Cambios realizados
La prueba de integración "a quien no checó nada se le crea el día ya resuelto como falta" no mandaba
`fecha`, así que el servicio usaba hoy, y el resultado dependía de cuándo se corriera:
- **Antes de la entrada más la tolerancia** (7:15 para el trabajador de prueba), el servicio responde
  `AUN_EN_TOLERANCIA`: todavía no hay omisión. Falló así al correrla a la 1 a. m.
- **En domingo** respondería `DIA_DE_DESCANSO`.

Ahora la prueba manda el día laboral anterior (si ayer fue domingo, el sábado). El servicio no cambia: sus
reglas son las correctas.

## Archivos tocados
- `apps/api/src/asistencia/asistencia.integration.spec.ts`

## Verificación
- `npx tsc --noEmit` en `apps/api`: sin errores.
- Integración de Asistencia contra Postgres real, a la 1 a. m.: 11 de 11.

## Pendientes
- Ninguno.
