# 2026-11-13 — /proveedores: abono con monto en miles y solo EFECTIVO como método

## Qué se hizo

- **`apps/web/src/app/(dashboard)/proveedores/page.tsx`** — modal
  **Registrar Abono**:
  - **Monto a Abonar (MXN)** pasa a `type="text"` con separador de miles
    automático (`formatearMiles` compartido); la validación usa
    `parsearMiles`.
  - **Método de Pago**: solo **EFECTIVO** (se retiran Tarjeta, Transferencia
    y Mixto de la UI). Se eliminó la constante `MEDIOS_PAGO` sin uso.
- El backend (`registrar-abono.dto.ts`) ACEPTA los otros métodos — solo se
  retiran de la UI, así que si se necesitan luego es un ajuste de una línea.

## Qué dicen los documentos sobre métodos de pago a proveedores

- **`docs-svr-dudas/`** (txt de los Excel): NADA fija métodos. Solo existe la
  duda abierta de `PROVEEDORES.txt` #1: *"¿Los proveedores también les dan
  crédito? ¿En qué situaciones se usa: todo se compra a crédito y se va
  abonando, o hay compras de contado?"* — pendiente de responder.
- **`docs_dudas/Dudas del SVR-11-11-2026.docx`**: habla de métodos de pago,
  pero de **NÓMINA** (sueldo fiscal por transferencia, bonos en efectivo,
  bancos Banorte y BBVA) — no de pagos a proveedores.
- **Conclusión:** ningún documento contradice ofrecer solo EFECTIVO en el
  abono; la forma real de pagar a proveedores queda por confirmar con el
  cliente (encaja con la duda de crédito/contado y con la conciliación
  semanal de las CLAVES 8-9).

## Verificación

- `npx tsc --noEmit` (web): limpio.
- `npx eslint` del archivo: sin hallazgos.

## Pendientes / riesgos

- Smoke visual pendiente (sin navegador).
- Si la realidad es que pagan por transferencia (como en nómina), regresaría
  como opción al confirmar con el cliente.
