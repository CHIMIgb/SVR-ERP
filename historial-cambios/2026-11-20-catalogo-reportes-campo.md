# reportes-campo emite con el catálogo (commit b de 3)

**Fecha:** 2026-11-20
**Autor:** agente
**Plan de origen:** catálogo de alertas autorizado 2026-11-20 (tras `abea901e`)

## Cambios realizados
- Los **10 sitios de emisión** de `reportes-campo.service.ts` ahora construyen
  su entrada con `construirAlerta(ALERTAS.X, contexto, id, userId)` del
  catálogo — ya no hay `titulo`/`cuerpo` inline ni `TipoNotificacion` en este
  service (el import del enum se retiró por no usarse):
  - `REPORTE_ACEPTADO_AUTOR` (aceptar), `REPORTE_NUEVO_TORRE` (crear),
    `REPORTE_ASIGNADO_TRABAJADOR` (asignar), `REPORTE_REASIGNADO_EX_ANTERIOR`
    y `REPORTE_REASIGNADO_ACEPTADOR` (reasignar), `REPORTE_CERRADO_ASIGNADO`
    y `REPORTE_CERRADO_AUTOR` (cerrar), `REPORTE_ACTIVIDAD` (comentar ×3
    audiencias — una sola definición).
- **Textos idénticos al copy vivo** (mismos slices 140/120, mismo «—», mismo
  fallback 'Reporte'): cero cambio de comportamiento.

## Verificación / pruebas
- `npm run build`: OK. Unit reportes-campo: 112/112.
- Integración (BD real): 38/38 — incluye los SUCCESS de `REPORTE_ADJUNTO` y el
  flujo de aceptar/asignar/cerrar que emiten.
- `git diff --check`: sin errores. `npx tsc --noEmit`: 0 errores.

## Archivos tocados
- `apps/api/src/reportes-campo/reportes-campo.service.ts`
- `historial-cambios/2026-11-20-catalogo-reportes-campo.md` (creado)

## Pendientes y riesgos
- Ningún test asertaba los textos de emisión (solo mocks), así que el refactor
  no tocó specs — los textos del catálogo están asertados en `catalogo.spec.ts`.
- Falta el commit (c): nómina + proveedores + ventas (3 sitios).
- Sin push: el commit queda local.
