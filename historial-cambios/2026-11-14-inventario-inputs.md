# 2026-11-14 — Ajustes de /inventario: estado sin badge, inputs numéricos y formulario 2×4

## Qué se hizo

- **Columna "Estado"** de la tabla: el badge de color ("Stock Bajo" rojo / "Ok"
  verde) ahora es **texto neutro** (`text-xs font-semibold text-ui-600`) —
  decisión del cliente de sin puntos de color. El Badge sigue en uso en el
  modal de orden de compra.
- **Stock Inicial (crear) / Stock Actual (editar) y Stock Mínimo (ambos)**:
  de `type="number"` a `type="text"` con `inputMode="numeric"` y filtro en el
  onChange que **solo deja pasar dígitos** (validación de enteros en la
  entrada, no se teclean letras/decimales).
- **Precio Unitario (crear y editar)**: de `type="number"` a `type="text"`
  con **separador automático de miles** (`formatearMiles`) y validación
  `esDecimalValido(precio, 0)` antes de enviar; el payload usa
  `parsearMiles` (con comas `Number()` daba `NaN`). En editar se precarga
  formateado.
- **Formulario (crear y editar) en 2 columnas × 4 filas**: se quitó el
  `sm:col-span-2` del Nombre — las 8 celdas fluyen: Nombre+Código,
  Categoría+Proveedor, Unidad+Stock, Stock Mín+Precio.

## Verificación

- `npx tsc --noEmit` (web): limpio.
- `eslint` en la vista: 1 error **preexistente** (setState en effect,
  línea 141; verificado con stash que ya estaba).
- Payloads idénticos en forma a la API (números); smoke visual pendiente.

## Pendientes / riesgos

- Smoke visual sin navegador (el filtro de dígitos y las comas se prueban al
  usar la vista).
- El badge de color del modal de orden de compra (apartado "Sugerido") se
  quedó igual — no se pidió cambiarlo.
