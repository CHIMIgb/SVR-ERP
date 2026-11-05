# Nómina: vista limpia, modo oscuro, responsiva y recibos que se imprimen bien

**Fecha:** 2026-11-04
**Autor:** P4chec0php

## Cambios realizados
- Vista rehecha con el mismo patrón que Asistencia:
  - Encabezado "Nómina" con el periodo (sin el texto largo de esquema mixto) y botones sin íconos:
    Sincronizar asistencia, Sobres con firma, Exportar SPEI.
  - 4 indicadores sin íconos: Transferencia SPEI, Efectivo en sobres, Total a pagar (con percepciones y
    deducciones) y Pagados (con el monto pendiente). Se quitó la barra oscura de totales (repetía lo mismo).
  - Selector de puesto en lugar de 6 píldoras; tabla con encabezado neutro y columnas secundarias ocultas en
    pantallas medianas. Al tocar un trabajador se abre su recibo con el desglose completo.
  - Acciones por fila en texto: Ajuste, Marcar pagado / Revertir.
- Modal de recibos rehecho: selector de trabajador, vista previa y botón Imprimir. Los recibos siempre son
  blancos (papel), también en modo oscuro.

## Bugs corregidos
- **"Layout SPEI BBVA" generaba cuentas falsas**: ponía la misma CLABE (`012180000000000000`) y la misma
  cuenta de origen (`0123456789`) a todos los trabajadores. El sistema no guarda la CLABE de nadie. Ahora
  "Exportar SPEI" descarga solo datos reales (nombre, puesto, monto, concepto) con la columna CLABE vacía y
  avisa que hay que llenarla antes de subirla al banco.
- **Un clic en la tarjeta "Estatus de liquidación" marcaba toda la nómina como pagada, sin confirmar.**
  Ahora es un botón "Marcar todos como pagados" con confirmación que dice cuántos trabajadores y cuánto.
- **La impresión de sobres salía mal**: se imprimía la página de atrás y el velo del modal, y el modal
  recortaba los recibos (de 6 salían 4). Ahora se imprimen solo los recibos, dos por fila, completos y sin
  partirse entre páginas (regla `.solo-impresion` en `globals.css`).
- Si la red fallaba, la vista se quedaba en "Cargando…"; si la API fallaba, el error se perdía. Ahora hay
  aviso con "Reintentar" y la vista nunca se traba.
- "Marcar pagado / pendiente" no se bloqueaba: un doble clic lo cambiaba dos veces. Ahora se bloquea
  mientras procesa (igual sincronizar y marcar todos).
- **Acciones que se pisaban**: sincronizar y "marcar todos" devuelven la nómina completa; si mientras tanto
  se marcaba un pago, la respuesta vieja lo regresaba a "Pendiente" en pantalla. Ahora solo corre una acción
  que modifique la nómina a la vez (sincronizar, pagar, revertir, pagar todos, ajuste, reintentar).
- El ajuste aceptaba monto 0 o negativo; ahora usa las mismas reglas que la API (monto de al menos $0.01,
  redondeado a centavos; concepto de 3 a 200 caracteres) y avisa si el pago ya estaba marcado como pagado.
  El modal no se puede cerrar mientras se envía.
- Exportación SPEI: protegida contra fórmulas de Excel en nombres y puestos, monto sin comillas (lo piden
  algunos importadores bancarios) y se desactiva si la nómina no cargó bien (datos desactualizados).
- Recibos: si el trabajador elegido ya no está en la lista se muestran todos, e "Imprimir" se desactiva sin
  recibos (antes imprimía la pantalla entera).
- Si las deducciones superan el efectivo, el recibo lo avisa en vez de mostrar un sobre negativo sin
  explicación.

## Cosas nuevas
- `RecibosNominaModal`: prop opcional `trabajadorInicialId` (abre el recibo de un solo trabajador).
- `globals.css`: utilidad de impresión `.solo-impresion` (documentada en el archivo).

## Archivos tocados
- `apps/web/src/app/(dashboard)/nomina/page.tsx` (modificado)
- `apps/web/src/components/layout/RecibosNominaModal.tsx` (modificado)
- `apps/web/src/app/globals.css` (modificado: regla de impresión)

## Pruebas / verificación
- `npx tsc --noEmit` y `npx eslint` sin errores; `npm run build` correcto.
- Capturas reales en Chrome (login real, API local) a 390, 768, 1024 y 1440 px, claro y oscuro, de la
  vista y de los 3 modales (recibos, ajuste, confirmación de pago). Para ver percepciones, deducciones y un
  sobre negativo sin escribir en la base, en el navegador de prueba se sustituyó solo la respuesta de
  `GET /api/nomina/actual` con datos de ejemplo sobre los trabajadores reales.
- Impresión revisada en modo "print" del navegador, en claro y oscuro: solo salen los recibos, sobre papel
  blanco, los 6 completos.
- Descarga real del CSV en el navegador de prueba: BOM UTF-8, nombres y montos reales, columna CLABE vacía.
- Camino de error con la red caída: aviso con el motivo, indicadores en "—" y acciones desactivadas.

## Pendientes y riesgos
- **Por decidir (negocio):** guardar la CLABE de cada trabajador (y la cuenta de origen de la empresa) para
  que la exportación SPEI salga lista para el banco. Hoy no existe ese dato en el sistema.
- `lib/api.ts` (compartido, no se tocó): si el refresco del token falla mientras hay peticiones esperando,
  esas peticiones nunca terminan (el botón se queda en "Sincronizando…"); y un 502/504 con HTML llega como
  error crudo de JSON. Afecta a todas las vistas.
- Cambios de presentación a propósito: se quitó el indicador "Horas extras GPS" (las horas extra se ven por
  trabajador y en su recibo) y la barra oscura de totales; la exportación incluye solo a quien tiene sueldo
  por transferencia.
