# 2026-11-13 — Clientes sin badge de estado y teléfono opcional en el alta del POS

## Qué se hizo

- **`apps/web/src/app/(dashboard)/clientes/page.tsx`** — la columna **Estado**
  de la tabla principal ya no pinta badges de color (Activo/Inactivo): solo el
  texto, mismo patrón que el pedido para cotizaciones. Los demás badges del
  detalle/consolidado (cotizaciones, facturas, cobros) quedan como estaban.
- **`apps/web/src/app/(dashboard)/ventas/page.tsx`** (mini-modal Nuevo
  Cliente):
  - **Teléfono** pasa a opcional: sin asterisco, sin "(opcional)" en el label.
    Si se captura debe tener 10 dígitos (`telefonoEsValido`); si va vacío se
    guarda '—' como en `/clientes` (el backend exige el campo).
  - **Empresa** pierde el "(opcional)" del label (solo "Empresa").
  - Obligatorios quedan Nombre y Correo.

## Verificación

- `npx tsc --noEmit` (web): limpio.
- `npx eslint` de los 2 archivos: solo los hallazgos preexistentes.

## Pendientes / riesgos

- Smoke visual pendiente (sin navegador).
