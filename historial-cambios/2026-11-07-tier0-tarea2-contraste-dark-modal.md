# Tier 0 tarea 2 — contraste dark en modal Ver Detalle (`ProjectDetailsModal.tsx`)

**Fecha:** 2026-11-07
**Autor:** agente OpenCode

## Diagnóstico (con capturas del usuario, modo oscuro)
Los Cards del modal se adaptaban bien porque usan `bg-surface`/`ui-*` (tokens que
se invierten en `.dark`), pero **todos los textos internos usaban `slate-*` crudo**
sin migrar: en oscuro quedaban "texto negro sobre fondo negro" (los valores CPI/SPI
"1.00", los títulos "Personal en Obra"/"Flota Asignada", las notitas bajo los
semaforos). No faltaba componente global: es CSS dedicado del archivo del modal.

## Cambios realizados (`apps/web/src/components/projects/ProjectDetailsModal.tsx`)
Siguiendo la regla oficial de migración de `globals.css`
(`slate-N` → `ui-N`; en claro idéntico, en oscuro se invierte):
- `text-slate-900` → `text-ui-900` (8: valores dinero, títulos de bloque, CPI/SPI,
  nombres/puestos)
- `text-slate-600` → `text-ui-600` (labels de FinRow)
- `text-slate-500` → `text-ui-500` (+1: "Utilidad Neta Real" y notas CPI/SPI)
- `text-slate-400` → `text-ui-400` (5: fechas, labels 9px, captions puestos/máquinas)
- Chips de icono (`finIconColors`): `bg-green/blue/amber/red-100` +
  `dark:bg-{c}-500/15` + `dark:text-{c}-400` (convención ya usada en `/inventario`);
  neutral: `bg-slate-100 text-slate-500` → `bg-ui-100 text-ui-500`
- Chip de máquina en flota: `bg-blue-50` + `dark:bg-blue-500/15 dark:text-blue-400`
- **No se tocaron** componentes globales (Modal, Badge ya adaptados en las 9 fases
  del modo oscuro), ni lógica, ni estructura. Solo clases.

## Verificación
- `grep slate-` en el archivo: **0 restantes** (17 clases migradas + chips).
- `npx tsc --noEmit` (apps/web): sin error.
- En modo claro los valores son visualmente idénticos por diseño (`ui-N` ≡
  `slate-N`); la verificación visual en oscuro queda para el usuario (el browser
  estaba abierto con el modal).

## Registro
- Índice del doc: tarea 2 del Tier 0 marcada ✅ (2026-11-07); pendiente del modal
  en 6.6.1 actualizada.

## Pendientes y riesgos
- Si algún fondo de icono queda "claro" en oscuro (chips pasados), ajustar con la
  misma convención; no detectado en tsc.
- Revisar otros componentes de `components/projects/*` (MachineCard, etc.) siguen
  con `slate-*` crudo — quedan aparte (están listados como deuda de migración en F4
 /dashboard; no son parte de esta tarea).
