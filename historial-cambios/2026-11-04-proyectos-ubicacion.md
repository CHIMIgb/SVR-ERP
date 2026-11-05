# /proyectos — ubicación exacta (calle, colonia, ciudad, estado, CP)

**Fecha:** 2026-11-04
**Autor:** agente OpenCode (a petición del usuario)

## Cambios realizados
1. **BD**: migración `20261104003000_proyectos_ubicacion` (aplicada psql +
   `migrate resolve`; drift cero verificado) que agrega 5 columnas nullable a
   `proyectos`: `calle`, `colonia`, `ciudad`, `estado_ubicacion`
   (se llamar "estadoUbicacion" para no chocar con el `estado` del proyecto),
   `codigo_postal VARCHAR(10)`. + backfill: los 3 proyectos existentes
   quedaron con dirección completa.
2. **Backend**: `CreateProyectoDto`/`UpdateProyectoDto` con los 5 campos
   (`@Matches` CP de 5 dígitos en español), service create/update los persiste
   y `serialize` los expone en camelCase; auditoría PROYECTO_(CREADO|ACTUALIZADO)
   lleva previo/nuevo con la dirección (sin acción de auditoría nuevamente).
3. **Frontend**:
   - Columna **"Ubicación"** en el DataTable: `Ciudad, CP` + calle debajo,
     Tooltip con la dirección completa.
   - Sección **"Ubicación de la obra"** en los modales Crear/Editar (calle,
     colonia, ciudad, estado, CP con máscara de 5 dígitos); **obligatoria en
     UI** (validación en español que lista lo faltante).
   - Modal de detalle (curva S) muestra la dirección compuesta en `ubicacion`.
4. **Seed demo**: 5 proyectos nuevos **P004..P008** con clientes reales de la BD,
   estados/presupuestos variados y dirección completa (script
   `apps/api/prisma/seed-proyectos-demo.sql`, reproducible).
5. **Tests** (regla dura): unit del DTO (CP inválida en español, calle de 201
   caracteres) + integración REAL: crear sin dirección → actualizar con ella →
   persistencia en BD + auditoría previous (ciudad null) / new (con dirección).

## Nota del color: la API quiere dirección OBLIGATORIA al crear/editar (UI), pero la BD queda nullable para no romper los 3 proyectos existentes; al recargar el proyecto viejo se exigirá la dirección al editar (decisión acordada).

## Archivos tocados
- `apps/api/prisma/schema.prisma` + migración + `seed-proyectos-demo.sql`
- `apps/api/src/proyectos/dto/*`, `proyectos.service.ts`
- `apps/api/src/proyectos/proyectos.integration.spec.ts`,
  `dto/create-proyecto.dto.spec.ts`
- `apps/web/src/app/(dashboard)/proyectos/page.tsx`
- `apps/web/src/lib/api.ts`

## Pruebas / verificación
- `prisma validate` + `generate` + **migrate diff vacío** ✔.
- Suite API: 961/963 (solo las 2 de cobranza preexistentes, ajenas) ✔.
- Integration proyectos: 9/9, incluyendo la nueva ✔.
- `npx tsc --noEmit` (web y api) ✔; eslint archivo nuevo: solo 1 error
  PREEXISTENTE (setState en effect de fetchData, sin relación).

## Pendientes y riesgos
- `ProjectDetailsModal` sigue parcialmente mock en más campos (desconectado de
  API — deuda ya documentada en `docs-planes/IMPLEMENTACIONES-A-FUTURO.md`).
- El buscador del listado NO incluye la dirección (buscar por nombre/cliente
  continúa; si el usuario busca "Tepic" en la búsqueda no sale — avisar si se
  quisiera).
- El error de eslint marcado es de setState en fetchData (pre-existente).
- **Posterior (07530487):** el modal de Crear ya no incluye "Progreso (%)" —
  todo proyecto nace en 0% (el backend ya lo hace por default, `progreso=0`);
  el avance se captura únicamente al Editar. Editar conserva el campo.
