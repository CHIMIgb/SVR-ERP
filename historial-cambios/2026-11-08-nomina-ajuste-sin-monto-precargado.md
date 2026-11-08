# El ajuste de nómina ya no abre con $500 cargados

**Fecha:** 2026-11-08
**Autor:** P4chec0php

## Cambios realizados
**Bug:** el modal "Ajuste" de Nómina abría con tipo Bono y **monto de $500 ya escrito**. Con solo poner un
concepto de 3 letras y aceptar, se aplicaba un bono de $500 que nadie había decidido. Es el mismo tipo de dato
precargado que ya se había quitado de Horómetro y Combustible.

Ahora el monto arranca vacío, y el placeholder es "0.00" en lugar de "500", que parecía un valor sugerido. La
validación que ya existía no deja aplicar el ajuste sin monto.

## Archivos tocados
- `apps/web/src/app/(dashboard)/nomina/page.tsx`

## Verificación
- `npx eslint` de la vista: sin errores.
- En el navegador, al abrir "Ajuste" desde la tabla, el campo de monto está vacío, con placeholder "0.00", en
  claro y en oscuro.

## Pendientes
- Ninguno.
