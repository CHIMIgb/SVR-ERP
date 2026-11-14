# 2026-11-14 — Fase 2 del plan de vistas de Sistema: /equipos

## Qué se hizo

Segunda fase de `PLAN-VISTAS-SISTEMA-USUARIOS-ROLES-EQUIPOS-2026-11-14.md`
(P11: residentes ↔ sus empleados, acceso solo Administrador).

**Commit `f3b630f8` — BD:**
- Migración `20261114020000_equipos_enum_jefe`:
  - `ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'JEFE_ASIGNADO'` —
    la acción de auditoría literal que pidió el cliente (el enum de BD es la
    lista cerrada de acciones válidas de `registro_auditoria`).
  - Vista `/equipos` (orden 52, icono UsersRound) + `role_vistas` SOLO
    Administrador (`puede_ver` + `puede_editar`; crear/eliminar n/a).
- `schema.prisma`: valor `JEFE_ASIGNADO` en el enum + `prisma generate`.
- `audit.constants.ts`: severidad default INFO para la acción nueva.

**Commit `d1b73a77` — API:**
- `GET /api/equipos` (`equipos.controller.ts` en el módulo usuarios):
  jefes = usuarios con rol **Residente** O con subordinados (P10: un jefe
  puede tener equipo de cualquier rol), cada uno con sus subordinados
  (nombre, roles, área, número de empleado) y los **candidatos sin jefe**
  (activos, sin jefe y sin equipo a su cargo).
- `PATCH /api/usuarios/:id/jefe` (body `{ jefeUserId: string | null }`):
  asignar / re-asignar / des-asignar. Guards: auto-jefe (`JEFE_INVALIDO`),
  jefe inexistente/inactivo, **ciclo** (el jefe no puede ser subordinado
  del usuario — jerarquía de 1 nivel). Audita la acción literal
  `JEFE_ASIGNADO` con `metadata {campo, anterior, nuevo, accion:
  asignado|reasignado|desasignado}`. Permiso `sistema.usuarios.editar`.
- Tests: unitarios **34/34** (6 nuevos: agrupación de equipos, sin-jefe,
  asignar/desasignar y 3 fallos); integración BD real **13/13** — el test
  nuevo verifica la asignación persistida, el audit SUCCESS con metadata,
  el ciclo rechazado (FAIL + `JEFE_INVALIDO`), la des-asignación y que
  `findEquipos` refleja el equipo.

**Commit web — vista `/equipos`:**
- `lib/api.ts`: `EquipoDTO`, `MiembroEquipoDTO`, `EquiposDTO`, `equiposApi`.
- `app/(dashboard)/equipos/page.tsx`: PageHeader + 3 StatsCards (jefes,
  sin asignar, total enlazados), **cards por jefe** con su equipo y
  acciones **Reasignar / Quitar** por RBAC (`puedeEditar`), panel
  **"Sin jefe asignado"** con select "Asignar a...", modales de
  confirmación (asignar / re-asignar / quitar), skeletons de carga y
  `RefreshOverlay` para los refetches. Responsive (1/2/3 columnas).

## Verificación (smoke real contra API :3001)

- Listado: 1 jefe ("Óscar Residente de Obra") con sus 3 subordinados de
  demo, 31 usuarios sin jefe.
- Ciclo completo: asignar Carlos SVR al equipo (4 miembros) → el PATCH de
  ciclo **rechazado** con mensaje claro → revertir. En `registro_auditoria`:
  `JEFE_ASIGNADO` SUCCESS con `metadata.accion = asignado/desasignado` y
  FAIL por ciclo.
- Gates: `npx tsc --noEmit` limpio (web y api), `prisma validate` ok;
  eslint solo el error patrón preexistente (`set-state-in-effect` en el
  useEffect de carga — deuda conocida de todas las vistas).
- Smoke visual en navegador pendiente (sin navegador).

## Pendientes / riesgos

- El "jefe" se identifica por rol con nombre **'Residente'** o por tener
  subordinados — si algún día se renombra el rol, hay que ajustar el query
  (documentado como shortcut en el service).
- Un Administrador puede ser asignado como subordinado de un residente
  (cualquier usuario sin jefe es candidato) — no se restringió porque P10
  confirma vínculo usuario↔usuario sin restricción de rol.
- Falta la Fase 3 (`/roles` — gestión de identidad, con CRUD de roles
  según la respuesta del cliente).
