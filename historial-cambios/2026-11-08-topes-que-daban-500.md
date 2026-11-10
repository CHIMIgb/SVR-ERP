# Topes que faltaban: valores fuera de rango daban 500

**Fecha:** 2026-11-08
**Autor:** P4chec0php

## Cambios realizados
**Bug:** algunos valores pasaban la validación de la API pero no cabían en su columna, y la BD respondía con un
**500** sin auditoría, en lugar de un 400 claro.

- **Trabajadores (alta y edición):**
  - `vacacionesDias`: entero (la columna es `Int`, y 2.5 daba 500), de 0 a 365.
  - `horasExtraSemana`: hasta 168 h, con 2 decimales.
  - `tarifaHoraExtra` y `descuentosSemana`: caben en `Decimal(10,2)`, con 2 decimales.
  - Licencia: largo máximo de `tipo` (100) y `folio` (60), recortados.
  - Contacto de emergencia: largo máximo de `nombre` (150) y `parentesco` (50). El `telefono` usa la misma regla
    que el teléfono del trabajador; antes aceptaba cualquier texto de 7 caracteres.
- **Combustible (alta y edición):** si el consumo calculado no cabe en sus columnas (rendimiento `Decimal(8,2)` o
  desviación `Decimal(6,2)`), responde 400 `CONSUMO_FUERA_DE_RANGO` con un mensaje en español y queda auditado.
  Por ejemplo, 800 L en media hora daba 1,600 L/h (11,329 % contra lo esperado). Un valor así es un error de
  captura.

La vista de Trabajadores no captura ninguno de esos campos de Trabajadores, así que no cambia.

## Archivos tocados
- `apps/api/src/trabajadores/dto/create-trabajador.dto.ts`
- `apps/api/src/trabajadores/dto/update-trabajador.dto.ts`
- `apps/api/src/trabajadores/dto/trabajadores.dto.spec.ts`
- `apps/api/src/modules/combustible/combustible.service.ts`
- `apps/api/src/modules/combustible/combustible.service.spec.ts`

## Verificación
- Las pruebas se escribieron primero: 12 casos nuevos fallaron antes del arreglo.
- Unitarias de Trabajadores y Combustible: 109 de 109.
- Integración de Trabajadores y Combustible contra Postgres real: 17 de 17.
- `npx tsc --noEmit` en `apps/api`: sin errores.
- Smoke con la API corriendo: 800 L en 0.5 h da 400 con el mensaje de consumo, y un alta con
  `vacacionesDias: 2.5` da 400. Antes los dos daban 500.

## Pendientes
- Si la máquina no tiene consumo esperado registrado, la API asume 14 L/h sin avisar. Queda para decidir: pedir
  el consumo esperado en el alta de la máquina, o marcar esas cargas como "sin referencia".
