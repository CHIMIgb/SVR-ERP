# /reportes — ubicación = área destino (misma área u otra torre), fuera ubicación física

**Fecha:** 2026-11-08
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

Corrección del concepto "Ubicación": NO es una ubicación física — es **el área a la
que se envía el incidente** (otra torre o la misma área de quien lo levanta).

**Backend (DTO/service):**
- `mismaArea: boolean` opcional en create/update: resuelve la torre del reportante.
  shortcut documentado en el service: hoy no existe link user↔trabajador en BD
  (pendiente PWA/nueva-info), quien levanta desde el web es oficina/jefes →
  "misma área" = ADMINISTRATIVO. Al existir el link, el mapeo por
  `categorias_puesto` ya está escrito (torrePrefijoPorPuesto: mecánico→MECANICO,
  soldador→SOLDADOR, diésel→DIESEL, mantenimiento→MANTENIMIENTO,
  ingeniero→RESIDENTE, resto→ADMINISTRATIVO).
- Sin torre explícita y sin mismaArea → `CATEGORIA_REQUERIDA` auditado.
- Fuera del DTO/capture físico: `maquinaId/obraId/obraTexto/latitud/longitud`
  (columnas de BD sin borrar; `obra_texto` queda 'Sin obra asociada').
- `resolverMaquina/resolverObra` eliminados (muertos); removeFrom serialize:
  maquina*/latitud/longitud/obra.

**Frontend (/reportes + api.ts):**
- Columna **Ubicación** = badge de la torre destino (Mecanico/Soldador/...).
  **Responsable** = persona asignada ('Sin asignar' / 'Cerrado').
- Detalle: fila "Envía a" (área destino); fuera obra/máquina/GPS.
- Create: select **"Ubicación (área a la que se envía)"** con opción
  **"Misma área (la del reportante)"** + las 6 torres; subcategorías deshabilitadas
  for "Misma área" (la torre se resuelve al guardar). Sin obra/máquina/GPS.
- Editar: sin obra/máquina; la torre destino se elige explícita de las 6.
- Limpieza: catálogos (obras/máquinas), `falloGpsRef`, `formatDetalle`,
  `siguienteEstado`, `ESTADO_API` muertos fuera.

## Archivos tocados

- `apps/api/src/reportes-campo/dto/create-reporte-campo.dto.ts` / `update-reporte-campo.dto.ts`
- `apps/api/src/reportes-campo/reportes-campo.service.ts`
- specs (unit + integration)
- `apps/web/src/lib/api.ts` + `apps/web/src/app/(dashboard)/reportes/page.tsx`

## Pruebas / verificación

- Unitarios módulo: **69/69** (`npx jest src/reportes-campo`).
- Integración real: **24/24** incluido nueva prueba "misma área" con ADMINISTRATIVO
  persistido y visible en el detalle.
- `tsc --noEmit` OK (api y web); `eslint` de la página: 0 problemas.
- E2E real: `mismaArea:true` → INC0025 con categoria=Administrativo;
  `categoria:MECANICO` → INC0026 Mecanico; sin destino → 400
  CATEGORIA_REQUERIDA. Ambos demo borrados (soft delete) al terminar.

## Pendientes y riesgos

- "Misma área" hoy SIEMPRE resuelve ADMINISTRATIVO para usuarios web (falta el
  link user↔trabajador; cuando la PWA lo defina, activar el mapeo por puesto —
  ya está escrito y comentado en el service).
- El modal de creación conserva también el select "Área (tipo de reporte)": es
  la naturaleza del reporte; si el cliente quiere unificarlo con la ubicación,
  es un cambio menor pendiente de confirmarlo.
