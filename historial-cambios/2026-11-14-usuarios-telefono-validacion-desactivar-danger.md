# 2026-11-14 — /usuarios: validación de teléfono y Desactivar en rojo (danger)

## Qué se hizo

- **Teléfono con la validación del estándar** (`lib/formatters.ts`):
  - El input de teléfono (crear y editar — formulario compartido) aplica
    `limpiarTelefono` en el onChange: solo dígitos/espacios/guiones con
    tope de 10.
  - El submit valida con `telefonoEsValido` (exactamente 10 dígitos) —
    es opcional, pero si se captura debe ser válido. Aplica a crear y
    editar (mensajes: "El teléfono debe tener exactamente 10 dígitos.").
- **Botón "Desactivar" → `variant="danger"`** (rojo), siguiendo el patrón
  de la doc: Ver=info · Editar=warning · Eliminar=danger — desactivar es
  destructivo como eliminar. El botón "Activar" sigue en verde (`success`).
  La columna de acciones de /usuarios quedó alineada con el ejemplo
  oficial de COMPONENTS.md.

## Verificación

- `npx tsc --noEmit` (web): limpio; eslint solo su error patrón
  preexistente (`set-state-in-effect`).
- Smoke visual en navegador pendiente (sin navegador).
