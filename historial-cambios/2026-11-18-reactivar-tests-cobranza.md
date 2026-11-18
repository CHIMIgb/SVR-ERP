# Fase 4a: reactivar los 2 tests de cobranza

**Fecha:** 2026-11-18
**Autor:** Agente (autorizado por el usuario — Fase 4 del plan de corrección)

## Contexto

Los 2 tests omitidos al integrar Jest al CI fallaban porque `mockCuenta` usaba
fechas fijas (`fecha_vencimiento: 2026-10-01`, `creado_en: 2026-09-01`) que el
18-nov-2026 ya clasifican como `ATRASO_GRAVE`. El arreglo duradero es hacer esas
fechas relativas a hoy, no dejar el `it.skip`.

## Cambios realizados

- `apps/api/src/cobranza/cobranza.service.spec.ts`:
  - `fecha_vencimiento` → 30 días en el futuro.
  - `creado_en` → 7 días en el pasado.
  - Reactivados los 2 `it()` (sin `skip` y sin comentarios `shortcut:`).
- `AGENTS.md` y `.opencode/agent/svr-erp.md`: ya no mencionan tests omitidos.
- Registros anteriores actualizados para reflejar la reactivación.

## Archivos tocados

- `apps/api/src/cobranza/cobranza.service.spec.ts` (modificado)
- `AGENTS.md` (modificado)
- `.opencode/agent/svr-erp.md` (modificado)
- `historial-cambios/2026-11-18-ci-tests-unitarios.md` (modificado)
- `historial-cambios/2026-11-18-ci-integracion-y-smoke.md` (modificado)
- `historial-cambios/2026-11-18-reactivar-tests-cobranza.md` (creado)

## Pruebas / verificación

- `npm run test -- --runInBand` en `apps/api`: **93 suites, 1417 passed,
  1417 total, 0 skipped** (antes 1415 passed + 2 skipped).

## Pendientes y riesgos

- Las fechas relativas se calculan al cargar el módulo; con una suite de varias
  horas el valor seguiría siendo el del inicio (no es el caso: tarda segundos).
- Los tests que necesitan atraso usan sus propios overrides (`hace40`,
  `hace10`, `2026-08-15`), por lo que no se vieron afectados.
