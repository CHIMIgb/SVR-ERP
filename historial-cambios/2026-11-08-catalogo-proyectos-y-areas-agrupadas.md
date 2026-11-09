# /reportes — catálogo de proyectos con permiso de la vista + áreas agrupadas por la guía

**Fecha:** 2026-11-08
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

1. **Proyectos no cargaban para roles no-admin** (tecnico/residente/cobrador/
   trabajador): el select usaba `GET /proyectos`, que exige
   `operaciones.proyectos.ver` — permiso que estos roles no tienen (403 silencioso).
   Nuevo endpoint con el permiso de la propia vista:
   `GET /reportes-campo/proyectos-en-proceso` → proyectos activos `EN_PROCESO`
   (id + nombre, orden alfabético, datos maestros sin paginar). El front lo
   consume desde `reportesCampoApi.proyectos()` y ya no toca `proyectosApi`.
2. **Áreas del alta agrupadas según la guía del cliente** (optgroups en el
   select de crear y editar):
   - Administración (jefes y oficina) → Administrativo
   - Residentes (ingenieros encargados de obra y de personal) → Residente
   - Técnicos (mantenimiento, mecánico, diésel y soldador) → las 4 torres técnicas
   (los Trabajadores no tienen área propia: envían a la torre que corresponda).

## Archivos tocados

- `apps/api/src/reportes-campo/controller.ts` (+service) — `proyectosEnProceso`
- `apps/web/src/lib/api.ts` (+`proyectos()`), `reportes/page.tsx` (catálogo nuevo, optgroups)

## Pruebas / verificación

- Unitarios 77/77; `tsc --noEmit` api+web.
- E2E real: técnico llama `GET /reportes-campo/proyectos-en-proceso` → 6
  proyectos EN_PROCESO (Escuela Secundaria, Fraccionamiento Valle Sur, …).

## Pendientes y riesgos

- Si el cliente quiere separar COBRADORES y TRABAJADORES como áreas propias del
  select (hoy: Cobradores dentro de Administrativo; Trabajadores sin torre), serían
  2 valores nuevos del enum `CategoriaReporte` + seed — pendiente de confirmar.
