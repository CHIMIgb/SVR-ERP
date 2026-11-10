# Bloque 9 review PR#17: DataTable con prop `lines` — rejilla definible por vista

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

**Decisión (b) del usuario** — el bordeado del DataTable deja de ser puramente
global: se agrega la prop `lines?: 'bold' | 'subtle'` con default `'bold'`
(comportamiento de hoy, visual idéntico en todas las vistas existentes).

1. **`DataTable.styles.ts`:** nuevo mapa `lines` con los 2 modos:
   - `bold` (default): filas con línea negra en claro (`border-ui-900 dark:border-ui-200`)
     y separador vertical por celda (`border-l border-ui-900 dark:border-ui-100 first:border-l-0`).
   - `subtle`: fila con línea fina (`border-ui-100`, el estilo pre-review) y SIN
     verticales — para tablas densas o de jerarquía visual baja.
   Se conservan las llaves `tr/td` del mapa (bold) para usos directos de
   `dataTableClasses` — las reglas `trInteractive/trEven/trOdd` intactas.
2. **`DataTable.tsx`:** prop `lines` con default `'bold'`; `tr`/`td` toman su
   clase del mapa según el modo — `cn()` respetando las clases de columna
   (`truncate`, `align`, etc.).
3. **`COMPONENTS.md` (sección 5.1):** prop nueva en la tabla de props +
   sub-sección "Líneas de la tabla" con: tabla dequé hace cada modo, ejemplos
   de uso (default y `lines="subtle"`), y cuándo NO usar subtle.

## Archivos tocados

- `apps/web/src/components/ui/DataTable/DataTable.styles.ts`
- `apps/web/src/components/ui/DataTable/DataTable.tsx`
- `COMPONENTS.md` (5.1 — prop + sub-sección de uso)

## Pruebas / verificación

- `npx tsc --noEmit` (web) ✅; `npx eslint` de los 2 archivos ✅ (0 salidas).
- Impacto visual: **cero** en las ~12 vistas que usan DataTable — el default
  es `bold` (el estado actual).
- Sin suite de tests frontend (infra pendiente) — cambio de contrato del
  componente con default estable.

## Pendientes y riesgos

- **Sin push** (orden del usuario) — commit local.
- Si alguna vista del sistema ya se había ajustado "apretada" esperando el
  bordeado por celda, sin pasarle `lines` no se ve distinta a hoy (default
  no-cambiante).
- Falta del plan: doc retroactivo de los 36 commits sin registro (decisión
  abierta del usuario ll: (a) doc único o (b) deuda declarada).
