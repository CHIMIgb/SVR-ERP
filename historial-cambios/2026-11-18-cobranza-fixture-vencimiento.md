# Cobranza: fixture con vencimiento relativo

**Fecha:** 2026-11-18
**Autor:** agente

## Cambios realizados
- `mockCuenta.fecha_vencimiento` dejó de ser la fecha fija `2026-10-01` y ahora se calcula como hoy + 30 días. Con la fecha antigua, los tests que asumen una cuenta `AL_CORRIENTE` empezaron a recibir `ATRASO_GRAVE` (48 días de atraso al 18-nov-2026). El cálculo del service era correcto; el fixture había envejecido.

## Cosas nuevas
- Ninguna.

## Archivos tocados
- `apps/api/src/cobranza/cobranza.service.spec.ts` (modificado, 1 línea)
- `historial-cambios/2026-11-18-cobranza-fixture-vencimiento.md` (creado)

## Pruebas / verificación
- `cd apps/api; npx jest --runInBand cobranza.service.spec` → 1 suite, 35/35 pruebas, exit 0.

## Pendientes y riesgos
- No se tocó `cobranza.service.ts`: el cálculo de `situacion`/`diasAtraso` sigue dependiendo de la fecha del reloj del servidor (no hay reloj inyectado). El fixture ya no envejece porque se recalcula en cada ejecución.
