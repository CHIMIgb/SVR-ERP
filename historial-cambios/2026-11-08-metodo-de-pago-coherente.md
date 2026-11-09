# El método de pago corresponde con los sueldos

**Fecha:** 2026-11-08
**Autor:** P4chec0php

## Cambios realizados
**Bug:** se aceptaba cualquier combinación de esquema de pago y sueldos. Un trabajador "Solo efectivo" podía
tener sueldo por transferencia, y como Nómina arma el SPEI con quien tiene sueldo por transferencia mayor a 0,
entraba a la dispersión bancaria aunque cobrara solo en efectivo.

**Regla (decisión de Oscar):** "Solo efectivo" significa sueldo por transferencia en 0. Por simetría, "Solo
transferencia" significa sueldo en efectivo en 0. "Mixto" lleva los dos.

- **API, alta y edición de trabajador:** una combinación incoherente responde 400 `METODO_PAGO_INCOHERENTE`,
  auditado. En la edición se revisa la combinación que quedaría: lo que se manda más lo que ya estaba guardado.
- **Formulario de trabajador:**
  - Al elegir "Solo efectivo", el sueldo por transferencia queda en 0 y bloqueado, con la nota "No aplica: cobra
    solo en efectivo". Lo mismo al revés con "Solo transferencia".
  - Si un trabajador ya guardado trae otra combinación, el campo no se bloquea y la validación explica que debe
    ser 0 o que se cambie el esquema a Mixto. Así se puede corregir desde ahí.

Hoy los 49 trabajadores de la BD local son "Mixto": ningún registro existente queda inválido.

## Archivos tocados
- `apps/api/src/trabajadores/trabajadores.service.ts`
- `apps/api/src/trabajadores/trabajadores.service.spec.ts`
- `apps/web/src/components/workers/TrabajadorFormModal.tsx`

## Verificación
- Las pruebas se escribieron primero: 3 combinaciones incoherentes fallaron antes del arreglo.
- Unitarias de Trabajadores: 79 de 79. Cubren alta y edición, válidas e incoherentes; en la edición, cambiar
  solo el esquema de un trabajador Mixto con ambos sueldos da 400.
- `npx tsc --noEmit` (api y web) y `npx eslint` del formulario: sin errores.
- En el navegador, en "Alta de trabajador" con "Solo efectivo", la transferencia queda en 0 y bloqueada y el
  efectivo editable. Capturas a 390 y 1440 px, en claro y oscuro.

## Pendientes
- La simetría para "Solo transferencia" es lectura de la regla, no algo que Oscar haya dicho literalmente.
  Confirmarla con él.
