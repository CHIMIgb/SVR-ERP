# 2026-11-20 — Adjuntos de reportes: los permisos respetan users_roles.activo (bloqueante 3 PR #23)

## Cambios realizados

**Bloqueante 3 de la review del PR #23:** la ruta `POST /reportes-campo/:id/adjuntos` NO
pasa por `PermissionsGuard` (la decisión vive en el service), y sus helpers
`esUsuarioAdmin` / `permisosReportesDe` consultaban los roles SIN filtrar
`users_roles.activo` ni `permissions.activo`. Un rol desactivado seguía concediendo
crear/editar (y nivel 100) para subir fotos — cosa que el guard sí corta en las rutas
protegidas.

Fix (mismo criterio del `PermissionsGuard`):
- `esUsuarioAdmin`: `where: { activo: true }` en la relación `users_roles`.
- `permisosReportesDe`: `where: { activo: true }` en la relación de roles + el flag
  `activo` en el select de permissions filtrado en JS — la relación
  `role_permissions → permissions` es 1-1 y **Prisma no admite `where` en relaciones
  to-one** (TS2353 al intentarlo); el guard resuelve lo mismo (línea 80).

**Efecto intencional en los demás callers de `esUsuarioAdmin`** (listar archivados,
editar ajenos, cerrar, cambiar estado): un rol de Administrador desactivado deja de
conceder admin-ness en todo el módulo — coherencia con el criterio del guard, no
cambio accidental de alcance. `esRolResidente` NO se tocó (solo alimenta el ámbito de
rutas de lectura que ya pasan por el guard).

## Cosas nuevas

- Ninguna (filtro de filas existentes en consultas existentes).

## Archivos tocados

- `apps/api/src/reportes-campo/reportes-campo.service.ts` — 2 helpers.
- `apps/api/src/reportes-campo/reportes-campo.service.spec.ts` — 3 tests nuevos +
  los mocks de permisos de `adjuntar` ganan `activo: true` (el service ahora lo exige).
- `apps/api/src/reportes-campo/reportes-campo.integration.spec.ts` — describe nuevo
  "ROL DESACTIVADO" con BD real.

## Verificación / pruebas

- Unitarios: 79/79 (incluye: la consulta pide roles con `activo: true`; permissions con
  el flag `activo`; actor sin roles activos → 403 `ADJUNTO_SOLO_AUTOR_NUEVO` + FAIL).
- **Integración (BD real): 39/39**, el test nuevo demuestra el bug corregido:
  persona + user de prueba (torre DIESEL) con `users_roles` hacia el rol
  Administrador del seed pero `activo: false` → `adjuntar` rechaza con 403
  `ADJUNTO_SOLO_AUTOR_NUEVO` FAIL auditado; al cambiar SOLO `activo → true` el mismo
  usuario adjunta con SUCCESS. El filtro de la BD es el que decide — sin mocks.
- `npm test -- --runInBand` (suite completa API) → 1483/1483.
- `npm run build` → limpio.

## Pendientes / riesgos

- El user/persona de prueba del integration NO se borra: las filas de
  `registro_auditoria` (inmutable) lo referencian y el trigger bloquea el DELETE de
  users — convención del repo (emails únicos por TEST_ID los aíslan). Solo se limpian
  adjuntos, users_roles y reportes.
- Los otros callers de `esUsuarioAdmin` cambian de comportamiento con roles
  desactivados (por diseño): si algún flujo dependía de "admin aunque el rol esté
  desactivado", eso ya no existe — no identifiqué ninguno que deba tenerlo.
