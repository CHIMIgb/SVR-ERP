# Revisión del PR #19: ajuste contra pago simultáneo, horas del turno nocturno y reglas de nómina documentadas

**Fecha:** 2026-11-14
**Autor:** P4chec0php

## Cambios realizados
- **Ajuste contra pago simultáneo.** `registrarAjuste()` revisaba si la nómina estaba pagada y después escribía
  la línea y los totales por separado. Si otro usuario le daba "pagar todos" en medio, el ajuste entraba a una
  nómina ya pagada. Ahora la línea y el recálculo van en una `$transaction` que empieza con un `updateMany`
  condicional (`estado != PAGADA`): bloquea la fila, y si la nómina ya se pagó no escribe nada y responde 409
  `NOMINA_PAGADA` auditado. `recomputarTotales()` recibe el cliente de la transacción (por defecto el de siempre).
- **Horas cruzando la medianoche solo en el turno nocturno.** `horasEntreHoras()` sumaba 24 h a cualquier salida
  menor que la entrada. Un registro del mismo día con entrada 18:00 y salida 06:00 acreditaba 12 h. Ahora solo
  suma cuando el registro viene de la entrada nocturna de ayer; en el resto da 0 h, como antes del PR.
- **Reglas de dinero documentadas.** Sección 22 de `DECISIONS.md`: sueldo diario ÷7, prorrateo de ingreso y
  nómina pagada cerrada, con los archivos que deben cambiar juntos.

## Archivos tocados
- `apps/api/src/nomina/nomina.service.ts`
- `apps/api/src/nomina/nomina.service.spec.ts`
- `apps/api/src/asistencia/asistencia.service.ts`
- `apps/api/src/asistencia/asistencia.service.spec.ts`
- `DECISIONS.md`

## Verificación
- `npx tsc --noEmit` en `apps/api`: sin errores.
- Unitarias de nómina, asistencia y trabajadores: 248/248. Pruebas nuevas: el ajuste se rechaza si la nómina se
  paga mientras se guarda (no crea línea ni toca totales y audita el fallo), la línea y los totales van en una
  sola transacción, y un registro del mismo día con salida menor que la entrada da 0 h.
- Integración de los tres módulos contra Postgres real: 45/45 (incluye el ajuste exitoso, que ya corre dentro de
  la transacción, y el 409 sobre nómina pagada).

## Pendientes
- La carrera en sí (dos usuarios al mismo tiempo) se cubre con la prueba unitaria del candado; no hay prueba de
  integración concurrente porque sería no determinista.
