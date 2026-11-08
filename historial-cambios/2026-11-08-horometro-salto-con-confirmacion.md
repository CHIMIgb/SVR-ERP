# Horómetro: un salto grande se confirma antes de registrarse

**Fecha:** 2026-11-08
**Autor:** P4chec0php

## Cambios realizados
**Bug:** una lectura con un error de captura (por ejemplo 12,450 en vez de 1,245) pasaba todas las
validaciones: eran 8 h y no se encimaba con nada. El horómetro de la máquina quedaba en 12,458 **para siempre**,
porque una lectura nunca lo regresa. Flota, Horómetro, Mantenimiento y Combustible calculaban el próximo servicio
y el consumo con ese valor. Corregirlo solo se podía con SQL directo en el servidor.

Oscar no tiene un tope definido por el cliente, así que se pide **confirmación**, sin bloquear: una máquina puede
trabajar días sin lecturas registradas.

- **API, `POST /lecturas-horometro`:**
  - Si la lectura inicial está más de 24 h (un día de trabajo) arriba del horómetro de la máquina, sin
    `confirmarSalto: true` responde 400 `SALTO_DE_HOROMETRO`. Queda auditado y no se escribe nada.
  - Se revisa dentro de la transacción, contra el horómetro leído con el candado `FOR UPDATE`.
  - Con la confirmación, se registra y la auditoría guarda `saltoConfirmadoHoras`.
- **Vista de Horómetro:**
  - Si la lectura inicial supera por más de 24 h el horómetro de la máquina, aparece la casilla "Confirmo que la
    máquina trabajó X h sin lecturas registradas (su horómetro marca Y). El horómetro no se puede regresar
    después."
  - Sin marcarla, el formulario no se envía.
  - La confirmación se reinicia al cambiar la máquina o la lectura.

## Archivos tocados
- `apps/api/src/modules/horometro/dto/create-lectura-horometro.dto.ts`
- `apps/api/src/modules/horometro/horometro.service.ts`
- `apps/api/src/modules/horometro/horometro.integration.spec.ts`
- `apps/web/src/lib/api.ts`
- `apps/web/src/app/(dashboard)/horometro/page.tsx`

## Verificación
- Integración contra Postgres real: 13 de 13.
  - Los 2 casos nuevos se escribieron primero.
  - Sin confirmar, 1,160 → 1,168 sobre una máquina en 116 h da 400. El horómetro sigue en 116, no se crea la
    lectura y queda la auditoría FAIL `SALTO_DE_HOROMETRO`.
  - Confirmado, se registra, y la auditoría trae `saltoConfirmadoHoras: 34`.
- Unitarias de Horómetro: 15 de 15.
- `npx tsc --noEmit` (api y web) y `npx eslint`: sin errores.
- En el navegador, con lectura inicial 99,999 sobre una máquina en 1,245.5 h, aparece la casilla con el salto de
  98,753.5 h. Capturas a 390 y 1440 px, en claro y oscuro.

## Pendientes
- El margen de 24 h es la opción por defecto: el cliente no dio un dato. Si Oscar define otro, es la constante
  `SALTO_SIN_CONFIRMAR_HORAS`, en la API y en la vista.
- Sigue sin existir la anulación de una lectura que recalcule el horómetro de la máquina. Quedaría para el
  siguiente bloque.
