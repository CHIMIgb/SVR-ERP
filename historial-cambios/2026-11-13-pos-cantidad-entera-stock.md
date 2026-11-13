# 2026-11-13 — POS: labels con solo asterisco rojo, cantidad entera y bloqueo por stock

## Qué se hizo

Ajustes pedidos por el cliente sobre el POS:

- **`apps/web/src/app/(dashboard)/ventas/page.tsx`** — los labels del mini-modal
  "Nuevo Cliente" y del modal **Retiro de Efectivo** ya no traen el asterisco
  blanco duplicado en el texto: el asterisco ROJO lo pinta el componente
  `ModalField required`.
- **Modal Retiro de Efectivo** — el input **Monto (MXN)** pasa a `type="text"`
  con separador de miles automático (`formatearMiles` de `lib/formatters`,
  ya compartido con cotizaciones y proyectos); la validación usa
  `parsearMiles`.
- **`apps/web/src/components/pos/ProductPicker.tsx`**:
  - El input **Cantidad** pasa a `type="text"` que **solo acepta dígitos
    enteros** (`onChange` filtra con `/[^0-9]/g`) — se acaban los decimales
    tipo "0.5" en el picker.
  - Al agregar una cantidad que **supera el stock** disponible (considerando
    lo que ya hay en el carrito de ese material+medida), la vista muestra el
    toast "Stock máximo" al instante y el **input de cantidad se borra**.
    Implementado con `onAdd → boolean`: la página valida y devuelve `false`,
    el picker limpia el campo.
  - **La validación de stock se lanza AL TECLEAR**, no solo al agregar: el
    picker recibe `enCarritoDe(materialId, unit)` (cantidad ya en carrito) y
    en cada dígito capturado compara contra `stock - enCarrito`; al superar,
    toast inmediato + input borrado. El guard de "Agregar" queda como defensa
    (doble-click).

## Verificación

- `npx tsc --noEmit` (web): limpio.
- `npx eslint` de los 2 archivos: sin hallazgos.
- Sin smoke visual (sin navegador).

## Pendientes / riesgos

- La medida puede admitir cantidades fraccionarias en el futuro (m³, tonelada):
  si el negocio lo pide, se relajará el filtro a decimales con `inputMode`.
- El guard dentro de `setCart` se conserva como defensa ante doble-click.
- El toast puede repetirse si se teclea el mismo exceso varias veces: es el
  comportamiento pedido (avisar y borrar cada vez).
