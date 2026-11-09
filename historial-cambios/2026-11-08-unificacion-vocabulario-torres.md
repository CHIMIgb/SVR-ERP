# Unificación de vocabulario: el tipo se deriva del área (torre) · accesos Cobrador

**Fecha:** 2026-11-08
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

Decisión del cliente: gana el vocabulario de las **6 torres**
(Mecanico/Soldador/Diesel/Mantenimiento/Administrativo/Residente) — el viejo
"Área (tipo de reporte)" (Incidente/Pipero/Checador/…) se olvida en el UI.

1. **El `tipo` ahora es espejo del área elegida** (1:1): el enum
   `TipoReporteCampo` extendío 4 valores (`SOLDADOR`, `DIESEL`, `MANTENIMIENTO`,
   `RESIDENTE`) — los viejos quedan como histórico del dump. Create/update del
   service derivan `tipo` = torre (resuelta, incl. "misma área"); el UI/API ya
   no lo captura (whitelist rechaza un payload viejo con `tipo`).
2. **Front:** fuera el select "Área (tipo de reporte)" (alta y editar), el
   filtro "Área" del listado, chip, TIPOS y imports muertos. El alta queda:
   Área destino (torre) → Subcategoría → Prioridad → Imágenes → Descripción.
3. **Cobrador: visibilidad de sus vistas** — role_vistas `/criba`, `/ventas`
   (puede_crear para vender en el POS) y `/ventas/corte`; role_permissions
   `criba.ver · ventas.ver · ventas.crear`. Verificado: su perfil entrega las 5 rutas.

## Archivos tocados

- `apps/api/prisma/migrations/20261108190000_enum_por_torre_y_accesos_cobrador` + schema
- `apps/api/src/reportes-campo` (DTOs sin tipo, service deriva tipo de la torre)
- `apps/web/src/lib/api.ts` + `reportes/page.tsx`

## Pruebas / verificación

- Unitarios **72/72** (nuevo: tipo derivado = torre; DTO sin tipo) +
  integración real **24/24**; `tsc --noEmit` api+web; eslint página 0.
- E2E real: create sin `tipo` con categoria=DIESEL → BD graba
  `tipo=DIESEL, categoria=DIESEL` (espejo) y demo eliminado (auditar).
- Cobrador login: vistas `/dashboard /reportes /criba /ventas /ventas/corte`.

## Pendientes y riesgos

- El filtro interno `tipo` del endpoint sigue disponible (sin UI); el histórico
  de reportes viejos conserva sus tipos del dump (Operador/Checador/…).
- El reporte "Misma área" con rol sin torre (Trabajador) queda
  tipo/categoria=ADMINISTRATIVO (oficina espera asignación real).
