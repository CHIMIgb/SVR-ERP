# Candado condicional en sincronizarAsistencia: el sync no toca una nómina pagada en paralelo

**Fecha:** 2026-11-14
**Autor:** Agente (revisión PR #19)

## Cambios realizados
- `sincronizarAsistencia()` decidía si una nómina estaba pagada con el estado leído **antes** del loop
  (`findMany` inicial) y luego escribía líneas + recalculaba totales sin candado. Un "pagar todos" o un
  "marcar pagado" concurrente durante el sync modificaba un recibo ya pagado — la misma carrera que el
  PR #19 cerró en `registrarAjuste`, en una ventana más ancha.
- Ahora cada nómina se escribe en una `$transaction` que empieza con un `updateMany` condicional
  (`id`, `eliminado_en: null`, `estado != PAGADA`): bloquea la fila y solo escribe si sigue sin pagar.
  Si `count === 0`, no escribe nada, se cuenta como `nominasPagadasSinCambio` y continúa con la
  siguiente (no lanza 409: en un sync masivo lo correcto es saltarla, igual que las pagadas de antes).
- Los acumuladores informativos del resumen (`totalHorasExtraSincronizadas`, `totalFaltasAplicadas`,
  omisiones, etc.) ahora se acumulan **solo si** la transacción escribió, para que no cuenten una
  nómina que en realidad se saltó.
- El cálculo pesado (`findSemanal`, `sueldoDiario`, montos) queda fuera de la transacción: dentro solo
  van escrituras rápidas para no sostener el candado más de lo necesario. `recomputarTotales` recibe el
  cliente transaccional (ya lo aceptaba desde el commit `52b8d03`).

## Archivos tocados
- `apps/api/src/nomina/nomina.service.ts`
- `apps/api/src/nomina/nomina.service.spec.ts` (2 unitarias nuevas)
- `apps/api/src/nomina/nomina.integration.spec.ts` (1 test de integración nuevo)
- `DECISIONS.md` (§22: el candado aplica también al sync)

## Verificación
- `npx tsc --noEmit` en `apps/api` y `apps/web`: sin errores.
- Unitarias de nómina: 27/27, con dos pruebas nuevas: (1) el sync salta la nómina si se paga en medio
  (no hay `deleteMany`, ni `create`, ni `nominas.update`, `nominasPagadasSinCambio = 1`, resumen en 0),
  (2) las líneas y totales van en una sola transacción por nómina.
- Integración de nómina contra Postgres real: 9/9. La prueba nueva es determinista: entrada marcada,
  nómina marcada PAGADA, sync corre y no crea líneas, no toca `dias_trabajados`, el audit
  `NOMINA_PROCESADA` sale SUCCESS y `nominasPagadasSinCambio` la cuenta. La carrera en sí (dos usuarios
  al mismo tiempo) sigue cubierta por la unitaria del candado; no hay prueba de integración concurrente
  porque sería no determinista (mismo criterio ya aceptado en el PR #19).

## Pendientes / riesgos
- Si en el futuro alguien agrega escrituras fuera de la transacción dentro del loop del sync, la
  protección queda hueca — el comentario del código lo advierte.
- Fallo preexistente (no de este cambio ni del PR): 2 tests de integración de trabajadores fallan
  porque el rol `Tecnico` tiene hoy el permiso `sistema/notificaciones/ver`, que lo excluye de
  `ROLES_ASIGNABLES_WHERE` (roles con permisos de módulo `sistema` no son asignables desde el alta).
  Revisar si ese permiso se otorgó de más en un seed posterior.
