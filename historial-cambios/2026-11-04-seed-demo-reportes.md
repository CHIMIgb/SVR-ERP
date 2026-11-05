# Seed demo: 2 reportes por cada área posible

**Fecha:** 2026-11-04
**Autor:** agente OpenCode (a petición del usuario)

## Cambios realizados
- Insertados en BD real **16 reportes** (RC006..RC021) — **2 por cada tipo**:
  Administrativo, Mecanico, Operador, Pipero, Checador, Incidente, Ingeniero,
  Trabajador. Estados variados (Pendiente/Visto/Atendido/En Revisión/Resuelto)
  con prioridades; los INCIDENTE con prioridad Alta para el banner rojo; 4
  RESUELTOS con responsable (trabajadores reales T002/T003) para ver la columna
  "Responsable"; **RC018** lleva cliente+proyecto+monto ($8,750) para probar el
  flujo **Facturar → CxC**.
- Script guardado y reproducible: `apps/api/prisma/seed-reportes-demo.sql`
  (idempotencia NO garantizada: los códigos RC006..RC021 chocan con P2002 si se
  re-corre — de propósito).
- El conteo total por área ya no es exactamente 2 para todas — hay rows previas
  del seed original (RC001-005, IN001-002): MECANICO=3, OPERADOR=3, PIPERO=3,
  INCIDENTE=6, CHECADOR/INGENIERO/TRABAJADOR/ADMINISTRATIVO=2.

## Archivos tocados
- `apps/api/prisma/seed-reportes-demo.sql` (script guardado en el repo)
- BD svr_erp: 16 filas insertadas (sin registro_auditoria — es seed, no flujo
  vía service)

## Pruebas / verificación
- psql: INSERT 0 16 + UPDATE 1 ✔; conteo por tipo verificado arriba ✔
- No se tocaron los registros previos.

## Pendientes y riesgos
- Los seed-data no pasan por el service → NO generan registro_auditoria
  (son datos demo, no flujo).
- Si algún día restauras BD, vuelve a correr el script para volver a llenarlos.
