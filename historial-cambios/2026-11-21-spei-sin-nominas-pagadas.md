# Nómina: el archivo SPEI ya no incluye las nóminas pagadas

**Fecha:** 2026-11-21
**Autor:** P4chec0php

## Cambios realizados
- "Exportar SPEI" filtraba solo por `sueldoFiscal > 0`, así que también metía las nóminas ya marcadas como
  pagadas. Si se exportaba después de pagar a algunos, el archivo para el banco les volvía a transferir.
- Ahora solo van las que faltan por pagar. El aviso dice cuántas ya pagadas se dejaron fuera. Si todo lo de
  transferencia ya está pagado, no se genera archivo y lo avisa.
- `jest.config.ts` de la web: se agrega el `moduleNameMapper` del alias `@/`. Es la misma línea que ya trae la
  rama del PR #23 (`02ca79e`), así que al juntarse no hay conflicto; sin ella, las pruebas que importan con
  `@/` no corren en `main`.

## Cosas nuevas
- `apps/web/src/app/(dashboard)/nomina/page.test.tsx`: primera prueba de la página de Nómina.

## Archivos tocados
- `apps/web/src/app/(dashboard)/nomina/page.tsx` (modificado)
- `apps/web/src/app/(dashboard)/nomina/page.test.tsx` (creado)
- `apps/web/jest.config.ts` (modificado)

## Pruebas / verificación
- `npm test` en `apps/web`: 7/7 (3 nuevas). Antes del arreglo fallaban 2: el CSV incluía a la nómina pagada y,
  con todo pagado, igual generaba el archivo.
- `npx tsc --noEmit` y `eslint`: limpios.
- No se probó en navegador: haría falta marcar como pagadas nóminas de la BD local. El cambio no mueve nada de
  lugar en la pantalla, solo el contenido del archivo y el texto del aviso.

## Pendientes y riesgos
- El sistema sigue sin guardar la CLABE de los trabajadores (pregunta abierta para el cliente): la columna va
  vacía, como antes.
