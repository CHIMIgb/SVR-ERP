# 2026-11-13 — B5.1: tabla `notificaciones` del ERP

## Qué se hizo

Fase B5.1 (notificaciones funcionales):

- **`apps/api/prisma/schema.prisma`**:
  - Enum **`TipoNotificacion`** (`ALERTA`, `INFO`).
  - Modelo **`notificaciones`**: `id`, `tipo` (default INFO), `titulo`
    VarChar(200), `cuerpo`, `referencia_tipo`, `referencia_id` (nullable — el
    evento que lo originó), `audiencia_rol_id` (nullable = visible a todos los
    roles), `leido_en` (nullable; lectura COMPARTIDA por rol, decisión del
    spec F1), `creado_en`, `creado_por`.
  - Índices: `audiencia_rol_id`, `leido_en`, `creado_en`.
  - Back-relations: `roles.notificaciones_audiencia` y la de `users` por
    `creado_por`.
- **Migración `20261113030000_notificaciones`** — solo lo propio (enum, tabla,
  3 índices, 2 FKs). Aplicada con el método de esta BD (`db execute` +
  `migrate resolve --applied`), registrada en `_prisma_migrations`.

## Verificación

- `npx prisma validate` OK; `migrate diff` tras aplicar solo muestra el drift
  preexistente documentado.
- `psql`: tabla `notificaciones` con sus 10 columnas.
- `npx prisma generate` regenerado.
- Nota de proceso: un edit intermedio dañó sin querer el modelo
  `niveles_bloqueo`; se restauró byte a byte (diff final contra el commit
  anterior contiene SOLO los cambios de B5.1).

## Pendientes / riesgos

- Tabla vacía: nada emite todavía (service en B5.2, eventos en B5.3).
- La lectura compartida por rol es una decisión explícita del spec F1: si el
  cliente quiere buzón individual, el diseño cambia (fila por usuario).
