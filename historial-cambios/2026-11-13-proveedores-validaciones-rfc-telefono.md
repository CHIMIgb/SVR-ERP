# 2026-11-13 — /proveedores: RFC y teléfono validados al crear/editar proveedor

## Qué se hizo

- **`apps/web/src/app/(dashboard)/proveedores/page.tsx`** — el formulario
  proveedor (crear y editar comparten `handleGuardarProveedor`):
  - **Teléfono**: opcional, pero si se captura debe tener 10 dígitos
    (`telefonoEsValido` de `lib/formatters`) — toast "El teléfono debe tener
    10 dígitos." y no guarda.
  - **RFC**: opcional; pasa de la regex inline a la función compartida
    `rfcEsValido` (misma regla: 3-4 letras + 6 dígitos + homoclave de 3;
    12-13 caracteres).
  - Ambos inputs filtran al teclear (`limpiarRfc` / `limpiarTelefono`, con el
    tope de 10 dígitos del teléfono).
  - Placeholder del teléfono actualizado al formato real (Ej: 322-123-4567).

## Verificación

- `npx tsc --noEmit` (web): limpio.
- `npx eslint` del archivo: sin hallazgos.

## Pendientes / riesgos

- Smoke visual pendiente (sin navegador).
