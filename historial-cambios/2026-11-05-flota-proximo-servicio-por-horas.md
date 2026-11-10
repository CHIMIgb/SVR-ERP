# Flota: el próximo servicio sale de Mantenimiento (por horas), no de una fecha que nadie actualiza

**Fecha:** 2026-11-05
**Autor:** P4chec0php

## Cambios realizados
- `MaquinasService.proximoServicioPorMaquina()`: el horómetro al que toca el próximo servicio de cada máquina,
  tomado del último registro de Mantenimiento. Es una sola regla para Flota, Horómetro y Mantenimiento, con
  el mismo umbral de 50 h (`UMBRAL_SERVICIO_HRS`).
- `GET /maquinas` agrega dos campos opcionales: `proximoServicioHoras` y `horasParaServicio` (negativo =
  ya se pasó). `proximoMantenimiento` se conserva por compatibilidad.
- **Flota:**
  - El indicador pasa a "Servicio cerca o pasado".
  - La pestaña Mantenimiento muestra horómetro, próximo servicio y cuánto falta, de la más urgente a la
    menos.
  - La columna "Próx. servicio" de Equipos usa el mismo dato.
- Horómetro usa ese mismo cálculo en lugar de su propia consulta.

## Bugs corregidos
- **Flota marcaba "4 servicios vencidos" con un dato congelado.** Usaba `maquinas.proximo_mantenimiento`,
  una fecha sembrada que ningún flujo actualiza: registrar un servicio no la cambia. Ahora usa el próximo
  servicio real, por horas, igual que Horómetro y Mantenimiento.
- La prueba del trigger inmutable de Horómetro podía tomar la auditoría FAIL del traslape (que apunta a la
  misma lectura) y fallar al azar. Ahora toma la SUCCESS.

## Archivos tocados
- `apps/api/src/modules/maquinas/maquinas.service.ts`
- `apps/api/src/modules/horometro/horometro.service.ts`, `horometro.module.ts` y
  `horometro.integration.spec.ts`
- `packages/shared/src/types/maquinaria.ts` (solo campos opcionales)
- `apps/web/src/app/(dashboard)/maquinaria/page.tsx`

## Verificación
- `npx tsc --noEmit` en `apps/api` y `apps/web`, y `npx eslint` de la vista: sin errores.
- Unitarias de maquinaria: 99 de 99.
- Integración en serie de Flota, Horómetro, Mantenimiento y Combustible: 37 de 37, dos veces seguidas.
  Incluye que `/maquinas` entregue `proximoServicioHoras` y `horasParaServicio` del último servicio real.
- Smoke con curl: M001 llega con `proximoServicioHoras` 1450 y `horasParaServicio` 204.5, igual que en
  Horómetro.
- Capturas de Flota (pestaña Mantenimiento) en claro y oscuro.

## Pendientes
- `maquinas.proximo_mantenimiento` sigue en la base sin uso real. Quitarlo es otra migración: se deja para
  decidirlo con quien revise.
