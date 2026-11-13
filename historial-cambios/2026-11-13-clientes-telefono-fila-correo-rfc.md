# 2026-11-13 — Validadores compartidos de teléfono y RFC + fila Correo|RFC en clientes

## Qué se hizo

Pedido del cliente: crear funciones de validación de teléfono y RFC como las
del separador de comas (compartidas en `lib/formatters.ts`). Nota: el commit
anterior de este cambio quedó deshecho por el usuario (el log no tenía
`37e1140a`), así que aquí va el cambio completo.

- **`apps/web/src/lib/formatters.ts`** — 4 helpers compartidos:
  - `telefonoEsValido(valor)`: exactamente 10 dígitos (ignora espacios/guiones).
  - `limpiarTelefono(valor)`: filtra el input a dígitos, espacios y guiones.
  - `rfcEsValido(valor)`: formato MX 3-4 letras + 6 dígitos + homoclave de 3
    (acepta ñ y &; probado con `AUR780101XXX` y `VERS810225EQ8`, el RFC del
    representante legal de los Word).
  - `limpiarRfc(valor)`: mayúsculas, sin caracteres ajenos, máx 13.
- **`apps/web/src/app/(dashboard)/clientes/page.tsx`**:
  - `validateForm` (usada por crear y editar): teléfono opcional pero con 10
    dígitos si se captura; RFC opcional pero con formato válido si se captura
    (toast "El RFC no tiene un formato válido (ej. AUR780101XXX).").
  - Los inputs Teléfono y RFC filtran al teclear (`limpiarTelefono` /
    `limpiarRfc`).
  - **Fila Correo | RFC**: Correo pierde el ancho completo y vive junto a RFC
    (Nombre → Empresa | Teléfono → Correo | RFC).
- **`apps/web/src/app/(dashboard)/ventas/page.tsx`** — el mini-modal
  "Nuevo Cliente" del POS valida el teléfono al guardar (toast "El teléfono
  debe tener 10 dígitos.") y filtra al teclear.

## Verificación

- `npx tsc --noEmit` (web): limpio.
- `npx eslint` de los 3 archivos: solo los hallazgos preexistentes
  (set-state-in-effect del efecto de carga y deps de useCallback).
- Self-check del regex de RFC con casos reales e inválidos (en el shell).

## Pendientes / riesgos

- RFC sin dígito verificador real (homoclave calculada): se valida el formato,
  no la autenticidad del RFC.
- Clientes viejos con teléfonos cortos siguen en BD; la regla aplica a
  capturas nuevas.
