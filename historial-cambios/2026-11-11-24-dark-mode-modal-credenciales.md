# 2026-11-11 — Fix review PR #18 #7: modo oscuro del modal de credenciales

## Problema (review del PR #18, punto 7)

En `CredencialesAccesoModal` el PIN —el dato principal— iba en
`text-slate-900` sobre la superficie del modal: en modo oscuro casi no se
ve, y el aviso `amber-*` no llevaba sus variantes `dark:`.

## Cambios

- `CredencialesAccesoModal.tsx`:
  - PIN: `text-slate-900` → `text-slate-900 dark:text-slate-50`.
  - Aviso: `border-amber-200 bg-amber-50 text-amber-800` → agrega
    `dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300`
    (mismo patrón que el `Aviso` de la vista de trabajadores).

## Verificación / pruebas

- `npx tsc --noEmit` y eslint limpios en el archivo.
- Sin test visual automatizado (no hay infra front): el smoke de modo oscuro
  queda pendiente — cambiar de tema con el interruptor y abrir el modal del
  alta de un trabajador; el PIN debe leerse claro y el aviso ambar legible.

## Pendientes / riesgos

- Los labels `text-ui-500` y bordes `border-ui-200/divide-ui-100` son tokens
  del kit (tema-conscientes) — no requerían cambio.
