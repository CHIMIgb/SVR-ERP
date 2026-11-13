# 2026-11-13 — /finanzas: tipo como texto y egresos en rojo

## Qué se hizo

- **`apps/web/src/app/(dashboard)/finanzas/page.tsx`** — tabla de
  transacciones:
  - La columna **Tipo** ya no pinta badges de color: solo el texto
    ("Ingreso"/"Egreso"), mismo patrón que clientes/cotizaciones/proveedores.
    Se eliminó el import de `Badge` que quedó sin uso.
  - La columna **Monto**: los ingresos siguen en verde (+); los **egresos
    ahora en rojo** (−) en lugar del texto neutro.

## Verificación

- `npx tsc --noEmit` (web): limpio.
- `npx eslint` del archivo: sin hallazgos.

## Pendientes / riesgos

- Smoke visual pendiente (sin navegador).
