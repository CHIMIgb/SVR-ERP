# Flota: auditoría, listados paginados y candados contra registros simultáneos

**Fecha:** 2026-11-05
**Autor:** P4chec0php

## Cambios realizados
- Máquinas, despachos y checklists ya cumplen los 4 requisitos de endpoint de `AGENTS.md`:
  - JWT y permisos por ruta, como antes.
  - Auditoría del éxito.
  - Auditoría del fallo de negocio con `fallir()` y su `error_code`, antes de lanzar.
- Acciones nuevas en `AuditAction`: `MAQUINA_CREADA`, `DESPACHO_CREADO`, `CHECKLIST_REGISTRADO` y
  `HOROMETRO_REGISTRADO` (esta la usa el siguiente cambio). Todas están en `ACTION_SEVERITY_MAP`. Un
  checklist con falla se audita con WARNING.
- Se guarda quién registró (`creado_por`) en máquinas, despachos y checklists.
- **Listados paginados** (`?page=&limit=`, tope 100, respuesta `{ items, pagination }`):
  - `GET /despachos` acepta `maquinaId`, `desde` y `hasta`. Con fechas, trae solo los despachos que se
    enciman con ese rango (es lo que pide el cronograma).
  - `GET /checklists` acepta `maquinaId` y `estado`.
  - `GET /maquinas` sigue sin paginar: es el catálogo de la flota y lo usan los selects de Horómetro,
    Mantenimiento, Combustible y GPS. `AGENTS.md` exenta los catálogos; se le puso tope de 500.
- La vista Flota usa helpers de dominio nuevos en `lib/api.ts` (`maquinasApi`, `despachosApi`,
  `checklistsApi` y `horometroApi`, este último para el siguiente cambio) en vez de `apiClient` directo.
  - Cronograma: pide solo la ventana de dos semanas que muestra.
  - "Todos los despachos" y Checklists: paginados en el servidor, con `Pagination`. Checklists se filtra
    por resultado.
  - Equipos: paginación local, porque el catálogo llega completo.
  - Una respuesta vieja (cambio rápido de página o de semana) ya no pisa a la nueva.

## Bugs corregidos
- **Dos despachos encimados de la misma máquina enviados al mismo tiempo se registraban los dos:** la
  revisión de traslape no estaba en una transacción. Ahora se hace con un candado sobre la máquina
  (`SELECT … FOR UPDATE`).
- **Dos altas del mismo código al mismo tiempo daban error 500:** las dos pasaban la revisión y el índice
  único frenaba a la segunda. Ahora es 409, igual que un duplicado normal.
- Un duplicado de máquina respondía 400; ahora 409, como el resto de los conflictos.
- El filtro de checklists mostraba "Seleccionar...": `Select` usa `""` para su placeholder.

## Archivos tocados
- `apps/api/prisma/migrations/20261105200000_flota_horometro_auditoria/migration.sql` (nueva)
- `apps/api/prisma/schema.prisma`, `apps/api/src/audit/audit.constants.ts`
- `apps/api/src/modules/maquinas/`: servicio, controller, módulo, `maquinas.service.spec.ts`,
  `flota.controllers.spec.ts` (nuevo) y `flota.integration.spec.ts` (antes `checklists.integration.spec.ts`)
- `apps/api/src/modules/despachos/`: servicio, controller, módulo, `dto/create-despacho.dto.ts` y
  `dto/query-despacho.dto.ts` (nuevo)
- `apps/api/src/modules/checklists/`: servicio, controller, módulo, `checklists.service.spec.ts`,
  `dto/create-checklist.dto.ts` y `dto/query-checklist.dto.ts` (nuevo)
- `apps/web/src/lib/api.ts` (solo se agregó)
- `apps/web/src/app/(dashboard)/maquinaria/page.tsx`

## Verificación
- `npx tsc --noEmit` en `apps/api` y `apps/web`, y `npx eslint` de la vista y de `lib/api.ts`: sin errores.
- Unitarias de maquinaria: 85 de 85. Incluyen los guards y el permiso de cada ruta de los tres controllers,
  y la auditoría SUCCESS/FAIL de los servicios.
- Integración contra Postgres real (`flota.integration.spec.ts`, en serie con Horómetro, Mantenimiento y
  Combustible: 35 de 35):
  - Auditoría SUCCESS y FAIL con `error_code`: `MAQUINA_DUPLICADA`, `DESPACHO_TRASLAPADO`,
    `FECHAS_INVALIDAS`, `MAQUINA_NO_ENCONTRADA` y `PROYECTO_NO_ENCONTRADO`.
  - Dos altas y dos despachos simultáneos: solo se registra uno.
  - Paginación y ventana del cronograma.
  - `registro_auditoria` no se puede borrar ni modificar.
- El auditor de paginación de `AGENTS.md` (`audit-pagination.cjs`) ya no marca máquinas, despachos ni
  checklists.
- Smoke con curl y login real: 401 sin token, 403 con el usuario de RRHH, 400 en validaciones, 404 con
  máquina u obra inexistente, 409 en traslape y en duplicado.
- Capturas a 390, 768, 1024 y 1440 px, en claro y oscuro: Equipos con paginación, Despachos y Checklists
  filtrados por resultado.

## Pendientes
- La migración se aplicó en la base local. En el servidor hay que aplicarla antes del build.
- Si quien hace el checklist no está registrado como trabajador, su nombre no se guarda (la tabla solo
  tiene `operador_id`). Hace falta una columna, es decir, otra migración.
