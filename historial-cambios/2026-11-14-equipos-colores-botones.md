# 2026-11-14 — /equipos: colores de botones (cierra) y centrado de acciones

## Qué se hizo

Ajuste visual pedido por el cliente tras ver la tabla:

- **Modal "Ver equipo" — botón Cerrar**: `variant="warning"` (ámbar) →
  `variant="primary"` — el naranja de marca que muestra el botón Asignar
  en la captura. (Nota: la captura que mandó el cliente muestra Asignar
  en naranja `primary`; el ámbar de `warning` era un tono distinto.)
- **Tabla — botón "Asignar"**: `variant="primary"` (naranja) →
  `variant="success"` (verde).
- **Columna "Acciones" centrada**: `align: 'center'` en la columna y
  `justify-center` en el contenedor de los botones (antes `right`/`justify-end`).
- "Ver equipo" sigue en `variant="info"` (azul) — patrón de la doc para
  acciones de ver/leer.

Referencia de variantes (`Button.styles.ts`): `primary` = naranja de
marca (`bg-primary`), `success` = verde (`bg-green-500`),
`warning` = ámbar (`bg-amber-500`), `info` = azul (`bg-blue-500`).

## Verificación

- `npx tsc --noEmit` (web): limpio; eslint solo su error patrón
  preexistente (`set-state-in-effect`).
- Smoke visual en navegador pendiente (sin navegador).
