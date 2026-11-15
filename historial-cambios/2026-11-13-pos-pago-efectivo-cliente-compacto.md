# 2026-11-13 — POS: mini-modal de cliente compacto y solo "Efectivo" (+Crédito deshabilitado)

## Qué se hizo

Ajustes pedidos por el cliente sobre el POS:

- **`apps/web/src/components/pos/PaymentPanel.tsx`**:
  - Se retiran **Tarjeta** y **Transferencia** como métodos (sus paneles de
    confirmación también). El único método activo queda **Efectivo**.
  - Botón **Crédito** visible pero **deshabilitado** (`disabled` + opacity +
    tooltip "Próximamente: venta a crédito, pendiente de definición") — no
    hace nada hasta que se resuelvan las dudas de C3 (venta a crédito → CxC).
- **`apps/web/src/app/(dashboard)/ventas/page.tsx`** — el mini-modal
  **Nuevo Cliente** es más pequeño (vuelve al tamaño `lg` del kit, se quita
  `size="full"`) y pasa a **2 columnas × 2 filas**: Nombre | Empresa
  (opcional) / Teléfono | Correo.

## Verificación

- `npx tsc --noEmit` (web): limpio.
- `npx eslint` de los 2 archivos: sin hallazgos.
- Sin smoke visual (sin navegador).

## Pendientes / riesgos

- Al resolver C3 (venta a crédito), el método 'credito' debe añadirse al tipo
  `PaymentMethod` (lib/pos), al backend (`MetodoPagoInput`/`MetodoPago`) y
  generar CxC — hoy solo existe el botón muerto.
- `SPEI_ACCOUNT` y el icono `CreditCard` quedaron sin uso en PaymentPanel (se
  quitaron sus imports); SPEI sigue exportado en lib/pos por si otra vista lo
  usa.
