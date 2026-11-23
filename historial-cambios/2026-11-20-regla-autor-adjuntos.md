# Regla del autor para subir fotos (opción 2) — backend

**Fecha:** 2026-11-20
**Autor:** agente
**Origen:** hallazgo del 19-nov — Trabajador/Cobrador (solo `crear`) no podían adjuntar fotos ni siquiera a SU reporte recién creado (403 del guard `editar`); la PWA perdería las fotos en silencio y el escritorio las perdía con toast.

## Cambios realizados
- **`reportes-campo.controller.ts`:** la ruta `POST /:id/adjuntos` **ya no usa `@RequirePermission(editar)`** — la decisión de permisos vive en el service (la regla exige OR(editar, crear-con-condiciones), que el guard no soporta). JwtAuthGuard sigue.
- **`reportes-campo.service.ts`:**
  - Nuevo helper `permisosReportesDe(userId)` → `{ crear, editar }` leyendo los `role_permissions` de los roles activos del actor (Administrador nivel 100 → ambos, sin depender del seed).
  - Nueva regla en `adjuntar` (después del ámbito, antes del mime):
    - Con **`editar`** → igual que antes (ámbito + estado).
    - Con **solo `crear`** → permitido **si el reporte es SUYO (`usuario_id`) y sigue `Nuevo`**; en otro caso → 403 `ADJUNTO_SOLO_AUTOR_NUEVO` con FAIL auditado.
    - Sin ninguno → el mismo FAIL.
  - **Auditorías previas intactas:** `REPORTE_NO_ENCONTRADO`, `INCIDENTE_CERRADO`, `RESIDENTE_SOLO_SEGUIMIENTO`, `REPORTE_ACCESO_DENEGADO` (ámbito), `MIME_NO_PERMITIDO`, `ADJUNTO_MUY_GRANDE`, `LIMITE_ADJUNTOS` siguen firmando igual.
- Semántica del fallo en reportes ajenos: **el ámbito corta primero** (`REPORTE_ACCESO_DENEGADO`) — `ADJUNTO_SOLO_AUTOR_NUEVO` aparece cuando el reporte es propio pero ya no está Nuevo.

## Tests (los 4 estándares)
- **Unitarios** (`reportes-campo.service.spec.ts`): 76 pasan (antes 73). Nuevos: autor con solo `crear` adjunta a SU Nuevo (SUCCESS); reporte ajeno → ámbito corta (`REPORTE_ACCESO_DENEGADO`); propio en EN_CURSO → `ADJUNTO_SOLO_AUTOR_NUEVO`; sin permisos → mismo FAIL sin insertar. Los tests previos de adjuntar mockean ahora un usuario con permisos (`permissions:` — el nombre real de la relación de Prisma).
- **Integración (BD real):** 38 pasan (antes 35). Nuevos: Trabajador real (`trabajador@`) adjunta a SU Nuevo → SUCCESS en `registro_auditoria`; a reporte ajeno → FAIL real `REPORTE_ACCESO_DENEGADO` + 0 adjuntos; su propio reporte pasado a EN_CURSO → FAIL real `ADJUNTO_SOLO_AUTOR_NUEVO`.

## Archivos tocados
- `apps/api/src/reportes-campo/reportes-campo.service.ts`
- `apps/api/src/reportes-campo/reportes-campo.controller.ts`
- `apps/api/src/reportes-campo/reportes-campo.service.spec.ts`
- `apps/api/src/reportes-campo/reportes-campo.integration.spec.ts`
- `historial-cambios/2026-11-20-regla-autor-adjuntos.md` (creado)

## Verificación / pruebas
- `npx prisma validate`: OK. `npm run build`: OK. `npx tsc --noEmit`: 0 errores.
- `npm run test -- --runInBand --testPathPattern="reportes-campo"`: 76/76.
- `npm run test:integration -- --testPathPattern="reportes-campo"`: 38/38 (BD real, `registro_auditoria` inmutable intacta).
- El resto del módulo no usa este patrón (ningún otro endpoint necesita OR de permisos).

## Pendientes y riesgos
- Otros módulos podrían tener el mismo agujero (crear sin editar = no pueden completar su captura): se revisarán al tocar cada módulo.
- La ruta de adjuntos queda sin `PermissionsGuard`: cualquier usuario autenticado alcanza el service, que deniega con FAIL auditado. Es deliberado (regla del autor) y documentado en el controller.
- Sin push: el commit queda local.
