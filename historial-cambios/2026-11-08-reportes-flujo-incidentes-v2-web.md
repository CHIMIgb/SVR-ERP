# /reportes — flujo incidentes v2 (frontend): detalle con imágenes/actividades/cerrar

**Fecha:** 2026-11-08
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

Cara web del flujo ServiceNow-like (acompaña al `feat(api)` commit `249e025d`):

1. **Detalle del incidente** (botón "Ver" → modal grande): datos completos +
   descripción larga, **grid de imágenes** (src data URI, máx 4/2 MB — agrega
   con input de archivo + FileReader→base64) y **Actividades** (bitácora con
   textarea Publicar; bloqueado al estar Cerrado). Acciones de flujo dentro:
   **Iniciar** (Nuevo→En curso), **Cerrar incidente** (confirm + audita),
   Asignar/Reasignar persona y Editar — todo por RBAC (puedeEditar).
2. **Crear modal**: ubicación por **radio Obra / Mi ubicación actual (GPS)**
   (geolocalización del navegador; ambos lat/lng o ninguno), **categoría torre**
   requerida y **subcategoría** filtrada por la categoría del catálogo nuevo.
   Editar mantiene mismos campos menos GPS.
3. **Estados simplificados**: filtros/cards/columnas con NUEVO ('Nuevo'),
   EN_CURSO ('En curso'), CERRADO ('Cerrado'); banner de críticos cuenta sin
   cerrar ("sin cerrar"); StatsCards = Nuevos / En curso / Cerrados / Críticos activos.
4. **Fuera del flujo anterior**: botón de avance por fila ("Validar/Marcar X"),
   modales Facturar y Marcar Resuelto, cliente/proyecto/monto del DTO.
   Columnas: ID · Fecha · Reporta · Ubicación (badge GPS si trae lat/lng) ·
   Prior. · Estado · Responsable (categoría + persona) · **Subcategoría** (nueva)
   · Descripción breve (truncada 90 chars) · Acciones (Ver/Editar/Eliminar).
5. **lib/api.ts**: tipos del nuevo contrato (`EstadoIncidente`, `ReportesIncidenteDetalle`,
   `ActividadDTO`, `AdjuntoDTO`, `SubcategoriaDTO`, stats `nuevos/enCurso/cerrados`)
   y métodos `detalle/comentar/adjuntar/subcategorias`; fuera `facturar/obtener`.

## Cosas nuevas

- Nada reutilizable nuevo fuera de la página: el detalle vive inline en
  `page.tsx` (componente de dominio, no del kit UI — no tocó COMPONENTS.md).

## Archivos tocados

- `apps/web/src/lib/api.ts` (contrato v2)
- `apps/web/src/app/(dashboard)/reportes/page.tsx` (reescrito)

## Pruebas / verificación

- `npx tsc --noEmit` (web) OK. `npm run lint` a nivel repo: los 31 errores son
  **preexistentes en otras vistas** (clientes/combustible/cotizaciones/criba...)
  — en `/reportes/page.tsx` queda limpio (0 errores/warnings tras quitar imports).
- E2E contra API corriendo: crear pasada previa no (crear con categoría ya
  probado en INC0024 del commit anterior; re-creación con GPS pendiente de UI),
  detalle de INC0019 + publicar actividad ("Revisión inicial por el
  responsable") + avanzar a En curso + stats nuevos=8/enCurso=12/cerrados=3 +
  subcategorías (9 filas). Todo SUCCESS real contra la BD.
- La prueba de carga de imagen por UI (input file) no se corrió por fetch (requiere
  browser) — la ruta ya está cubierta por la integración real (24/24, PNG real).

## Pendientes y riesgos

- La UI GPS usa la geolocalización del navegador: en escritorio sin permiso
  falla con mensaje claro; en producción (PWA) se probará sobre HTTPS.
- El criterio "quien reporta" firma la actividad solo si no hay persona
  asignada (backend escope autor = asignado → reporta → usuario).
