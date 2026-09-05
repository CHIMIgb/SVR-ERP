# Plan de Implementación — Aprobación de Cierres de Caja

## Resumen del Requerimiento
Los cierres de caja deben registrar una **aprobación del Administrador**:
cierre nace como `PENDIENTE`, un Admin lo puede **aprobar** o **rechazar**
(con motivo obligatorio). Solo el rol **Administrador** puede aprobar/rechazar.

## Impacto Backend
- **Schema `cierres_caja`**: agregar `estado` (PENDIENTE/APROBADO/RECHAZADO,
  default PENDIENTE), `aprobador_id`, `motivo_rechazo`.
- **Enum `AuditAction`**: `CIERRE_CAJA_APROBADO`, `CIERRE_CAJA_RECHAZADO`.
- **DTOs**: `RechazarCierreDto { motivo }`.
- **Service** (`ventas.service.ts`):
  - `createCierre` → estado PENDIENTE por defecto.
  - `serializeCierre` → expone estado/aprobadorId/motivoRechazo.
  - `aprobarCierre(id, userId)` y `rechazarCierre(id, dto, userId)`,
    ambos validan: rol Admin, cierre existe, estado PENDIENTE; rechazo exige
    motivo. Registran auditoría SUCCESS/FAIL.
  - helper `esAdmin(userId)` (rol `Administrador`).
- **Controller**: `PATCH /ventas/cierres/:id/aprobar` y `.../rechazar`.

## Impacto Frontend
- Mostrar estado del cierre (PENDIENTE/APROBADO/RECHAZADO) y motivo de rechazo.
- Si el usuario es Admin: botones Aprobar / Rechazar (con motivo).

## Validación y Riesgos
- tsc web + tsc api deben pasar.
- Tests unitarios (service + controller) e integración (auditoría real).
- Falta ver cómo el frontend estas vistas (feature B — pendiente por separado).
