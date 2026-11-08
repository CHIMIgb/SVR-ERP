# Ajuste /cotizaciones — acciones por estado (Ver siempre centrado; Editar solo PENDIENTE)

**Fecha:** 2026-11-07
**Autor:** agente OpenCode

## Cambios realizados (feedback en pantalla del usuario)
1. **Editar NO aparece en cotizaciones ya decididas** (ACEPTADA/RECHAZADA/
   FACTURADA): solo tiene sentido en PENDIENTE, donde viven también
   Aceptar/Rechazar. En los demás estados la fila solo muestra `Ver`.
   (En la iteración anterior quedó un "Editar" flotando en las decididas —
   el usuario lo pidió fuera y así quedó: acciones por estado, sin botones
   inertes).
2. **Botones centrados**: la columna Acciones pasó de `justify-end` a
   `justify-center` — con solo `Ver` ya no queda clavado a la derecha.

## Verificación
- `npx tsc --noEmit`: 0 errores (una pasada de depuración: el primer reemplazo
  dejó remanentes del render viejo → removidos y validado de nuevo).
