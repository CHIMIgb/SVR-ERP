# 2026-11-14 — Modal "Ver equipo" de /equipos: X de cerrar y botón warning

## Qué se hizo

En el modal "Ver equipo" de `/equipos`:

- **X de cerrar (arriba a la derecha)**: faltaba porque `ModalHeader`
  renderiza la X **solo si recibe `onClose`** (prop documentada en
  COMPONENTS.md §5.1, tabla ModalHeader) y no se la estaba pasando.
  Agregada: `onClose={() => setVerOpen(false)}`.
- **Botón "Cerrar" del footer**: `variant="secondary"` → `variant="warning"`
  (pedido explícito del cliente).

## Nota de documentación (conflicto puntual)

El ejemplo básico de Modal en COMPONENTS.md (§5.1, líneas ~3620-3625)
documenta el Cerrar con `variant="secondary"` y el ModalHeader **con**
`onClose`. El X seguía el ejemplo — el Cerrar quedó en `warning` por
decisión del cliente, que hoy es una desviación del ejemplo de la doc.
Si el `warning` debe ser el estándar de los botones Cerrar de los modales
de solo lectura, se actualiza el ejemplo de COMPONENTS.md aparte (un solo
lugar, la doc manda).

## Verificación

- `npx tsc --noEmit` (web): limpio; eslint solo su error patrón
  preexistente.
- Smoke visual en navegador pendiente (sin navegador).
