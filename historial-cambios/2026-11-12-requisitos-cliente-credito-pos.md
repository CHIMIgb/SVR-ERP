# 2026-11-12 — docs: requisitos del cliente 2026-11-12 (estados de cuenta, pagos a proveedores, crédito en POS) al análisis docs-svr

## Qué se documentó

Nueva sección **§9 "Requisitos nuevos del cliente (2026-11-12)"** en
`ANALISIS-DOCS-SVR-PROCESOS-EXCEL-2026-11-12.md`, con la información que dio
el SVR en lenguaje directo (textual):

1. **Estados de cuenta de clientes y proveedores** (§9.1) — decodificado:
   cliente = los 2 Excel de estados de cuenta de retiros (CxC); proveedor =
   PROVEEDORES/EXTERNOS 01 (CxP con conciliación semanal). Estado verificado:
   proveedor parcial (falta conciliación semanal), cliente NO existe.
2. **Pagos a proveedores** (§9.2) — los abonos parciales; ✅ ya construido
   (abonos atómicos + egreso), falta solo el envoltorio semanal.
3. **Crédito otorgado por SVR para pagar en el POS** (§9.3) — el dato nuevo
   más importante: el crédito lo otorga SVR al cliente, se consume en el POS
   sin efectivo y se refleja en el estado de cuenta. Verificado contra
   schema: `clientes` NO tiene campos de crédito (limite/días/saldo) y la
   venta POS no genera CxC (C3) — esquema nuevo obligatorio + método de pago
   CRÉDITO con validación de disponible.

Incluye el orden sugerido de construcción (1. schema de crédito → 2. C3 →
3. método CRÉDITO en POS con rechazo/audit FAIL → 4. estado de cuenta) y una
**pregunta nueva al cliente** (sumar a F2 del plan): cómo asignan el crédito
hoy, quién lo aprueba y qué pasa al rebasarlo.

## Archivos tocados

- `docs-prioridades/ANALISIS-DOCS-SVR-PROCESOS-EXCEL-2026-11-12.md` (§9 nuevo)
- `historial-cambios/2026-11-12-requisitos-cliente-credito-pos.md` (este registro)

## Verificación / pruebas

- Solo docs — sin código.
- Grep real: `clientes` en schema.prisma sin campos de crédito (verificado,
  cierra la duda abierta del mensaje anterior).
- El requisito 2 (pagos) ya está construido — se marcó como ✅, no como tarea.

## Pendientes / riesgos

- La pregunta del crédito (asignación/aprobación/rebase) es nueva y va a la
  F2 del plan comercial — sin respuesta, el schema de crédito puede salir
  torcido (¿límite fijo, por plazo, manual?).
- El "disponible" derivado (límite − CxC abiertas) asume que todas las CxC
  del cliente consumen el crédito — si hay CxC que no son de POS (renta,
  reportes), hay que decidir si también descuentan disponible.
