# 2026-11-12 — /proyectos: municipio como columna nueva (opcional)

## Qué se hizo

**BD**
- `apps/api/prisma/schema.prisma` — `model proyectos`: nueva columna
  `municipio String?` (nullable, sin backfill: los proyectos existentes no
  tienen el dato).
- `apps/api/prisma/migrations/20261112040000_proyectos_municipio/migration.sql`
  — `ALTER TABLE "proyectos" ADD COLUMN "municipio" TEXT;`. Aplicada con
  `prisma db execute` + `migrate resolve --applied` (procedimiento del repo:
  `migrate dev` no puede replayar el historial reconstruido).

**API**
- `dto/create-proyecto.dto.ts` y `dto/update-proyecto.dto.ts` — `municipio?:
  string` con `@IsOptional()` + `@IsString()` + `@MaxLength(120)`.
- `proyectos.service.ts` — se persiste en `create()` (y viaja a la obra),
  se actualiza en `update()`, se devuelve en `serialize()` y `ubicacionDe()`
  lo compone en la dirección de la obra en el orden
  `calle, colonia, municipio, ciudad, estado`.

**Web**
- `src/lib/api.ts` — `ProyectoDTO.municipio: string | null` y
  `ProyectoCreateInput.municipio?: string`.
- `src/app/(dashboard)/proyectos/page.tsx` — campo "Municipio" en los modales
  de **crear** y **editar** (con `hint="Opcional."`), en `emptyForm`,
  `openEdit` y `buildPayload`, y en el tooltip de la columna Ubicación.

## Verificación

- `npx prisma validate`: schema válido.
- `npx prisma migrate diff --from-config-datasource --to-schema`: ya **no**
  aparece `ADD COLUMN "municipio"`; solo queda el drift preexistente
  (enum `AuditAction`, 3 índices, columnas `users.pin_historial`/`intentos_pin`,
  FK `categorias_puesto_rol_id_fkey`).
- `npx tsc --noEmit` en `apps/web` y `apps/api`: sin errores.
- `npx jest src/proyectos` (unit): **50/50**.
- `npx jest --config jest.integration.config.js src/proyectos` (BD real):
  **14/14**, incluido el update de dirección con municipio (persistencia,
  serializado y auditoría `previous`/`new`).
- Smoke real contra la API: `POST /proyectos` con `municipio: 'Xalisco'` →
  respuesta `municipio: "Xalisco"` y obra con
  `ubicacion = "Calle Smoke 1, Col. Prueba, Xalisco, Tepic, Nayarit"`;
  `DELETE /proyectos/:id` → soft delete del proyecto **y** de su obra
  (proyecto temporal de prueba, ya eliminado).
- `npx eslint "src/app/(dashboard)/proyectos/page.tsx"`: solo los 2 hallazgos
  preexistentes (`useMemo` sin usar y `setState` en el efecto de carga).

## Pendientes / riesgos

- Los proyectos existentes quedan con `municipio` NULL y sus obras conservan
  la `ubicacion` ya guardada (sin municipio) — no se reescribió historia.
- `obras` no tiene columna propia de municipio: sigue guardando la dirección
  como texto compuesto.
- Si se manda `municipio: ''` en un `PATCH`, se guarda cadena vacía (no NULL);
  la UI siempre manda `''` solo cuando el campo está vacío, y el listado lo
  trata como dato ausente.
- Smoke visual del campo en los dos modales pendiente (sin navegador aquí).
