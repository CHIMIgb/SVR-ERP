# 2026-11-20 — Push solo a usuarios ACTIVOS — menor 2 PR #23

## Cambios realizados

**Menor 2 de la review del PR #23:** `usuariosDelAlcance` filtraba `users_roles.activo`
pero NO `users.activo` en la rama de rol, y en la rama de destinatario personal no
consultaba nada — una cuenta dada de baja con suscripción push vigente seguía
recibiendo avisos (cierres de caja, nómina pagada, alertas).

Fix en `notificaciones.service.ts — usuariosDelAlcance`:
- **Rama rol:** `users_users_roles_user_idTousers: { activo: true }` en el `where` —
  filtra por el USUARIO enlazado (Prisma filtra to-one así; compiló sin fricción).
- **Rama destinatario personal:** ahora consulta `users.findUnique({ select: { id,
  activo } })` y solo incluye al destinatario si está activo; inactivo/inexistente →
  `[]` (sin push).
- Ramas de torre y "para todos": ya filtraban `users.activo` ✓ (sin cambios).

## Cosas nuevas

- Ninguna (filtro de filas existentes).

## Archivos tocados

- `apps/api/src/notificaciones/notificaciones.service.ts`
- `apps/api/src/notificaciones/notificaciones.service.spec.ts` — assert del where de la
  rama rol actualizado + 3 tests (destinatario dado de baja → []; destinatario activo →
  incluido; test "fase b" ahora mockea el destinatario activo).

## Verificación / pruebas

- `npm test -- --runInBand notificaciones` → 47/47.
- `npm test -- --runInBand` (suite completa API) → 1485/1485.
- `npm run build` → limpio.
- Nota: la consulta con filtro de relación to-one la valida el assert del `where`
  (mocks); la respuesta real de PostgreSQL ante `users.activo = false` es el
  comportamiento estándar del motor — no requiere integration spec (el filtro ya
  existía en las ramas de torre/"todos" con el mismo patrón).

## Pendientes / riesgos

- Las suscripciones push de una cuenta dada de baja SIGUEN en `push_suscripciones`
  (no se borran al dar de baja el usuario) — ahora quedan dormidas (el alcance las
  excluye). Si el cliente pide, un `deleteMany` al dar de baja sería la limpieza
  definitiva, pero es feature de otro módulo (usuarios).
