# Cerrar naranja en los modales de solo lectura del Administrador en /roles

**Fecha:** 2026-11-14
**Autor:** Agente (ajuste del usuario)

## Cambios realizados
- En `/roles`, el botón **Cerrar** de los modales de solo lectura (Vistas del rol y Permisos del rol,
  que aplican solo al registro del Administrador `es_sistema`) era `variant="secondary"` (gris).
  El usuario lo pidió naranja, igual que el botón Guardar → `variant="primary"` cuando `soloLectura`.
- Los modales editables siguen igual: `secondary` "Cancelar" + `primary` "Guardar".

## Archivos tocados
- `apps/web/src/app/(dashboard)/roles/page.tsx` (2 líneas: footer de ambos modales)

## Verificación
- `npx tsc --noEmit` en `apps/web`: sin errores.
- `npx eslint` en la vista: único error preexistente (línea 130, `fetchRoles()` en un effect —
  regla `react-hooks/set-state-in-effect`); confirmado con stash que existe sin este cambio.
- Smoke pendiente del usuario: abrir la ficha del Administrador → Vistas / Permisos → el Cerrar
  sale naranja.

## Pendientes / riesgos
- Nota contra `COMPONENTS.md`/AGENTS.md: la convención documentada dice que el pie de un modal de
  solo lectura lleva Cerrar `variant="secondary"` — este ajuste del usuario la desvía a propósito
  para estos dos modales; si se generaliza, actualizar la doc del kit.
