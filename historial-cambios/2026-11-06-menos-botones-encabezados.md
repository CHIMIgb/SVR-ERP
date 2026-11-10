# Menos botones en los encabezados de Asistencia y Flota

**Fecha:** 2026-11-06
**Autor:** P4chec0php

## Cambios realizados
El cliente pidió vistas con menos botones. Se quitaron dos que repetían una acción que ya está en otro lado:
- **Asistencia:** "Ir a nómina". Nómina ya está en el menú lateral. El encabezado queda con "Marcar entrada /
  salida" y "Pase de lista".
- **Flota:** "Checklist". Cada máquina tiene su propio botón Checklist en la tabla, que abre el formulario
  con su operador y su horómetro. El encabezado queda con "Alta de máquina" y "Despachar a obra".

`abrirChecklist` ahora siempre recibe la máquina. Se quitó el caso que tomaba "la primera de la lista"
cuando se abría desde el encabezado.

## Archivos tocados
- `apps/web/src/app/(dashboard)/asistencia/page.tsx`
- `apps/web/src/app/(dashboard)/maquinaria/page.tsx`

## Verificación
- `npx tsc --noEmit` y `npx eslint` de las dos vistas: sin errores.
- Capturas de los encabezados a 390, 768, 1024 y 1440 px, en claro y oscuro, y del checklist abierto desde la
  fila de una máquina.

## Pendientes
- Ninguno.
