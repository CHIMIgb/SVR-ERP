# 2026-11-13 — B5.6 (Opción A): lectura y descarte POR USUARIO (`notificaciones_lecturas`)

## Qué se hizo

Resuelve el riesgo documentado de B5 ("la lectura es compartida por rol") y el
matiz de la basura: ahora **cada usuario tiene su propio estado** de lectura y
descarte.

- **`apps/api/prisma/schema.prisma`**:
  - Tabla puente nueva **`notificaciones_lecturas`**: PK compuesta
    `(notificacion_id, user_id)`, `leido_en` (timestamp, cuándo leyó),
    `descartada` (booleano, ocultar solo para mí), `creado_en`.
    FK a `notificaciones` (ON DELETE CASCADE — si la notificación se expira,
    sus lecturas mueren con ella) y a `users`. Índice por `user_id`.
  - `notificaciones` **pierde** `leido_en` y `descartada` (nacieron el mismo
    día y el estado por usuario los sustituye — una sola fuente de verdad).
- **Migración `20261113040000_notificaciones_lecturas`** — solo lo propio
  (DROP índice/columnas + CREATE TABLE/índice/2 FKs). Aplicada con el método
  de esta BD (`db execute` + `migrate resolve --applied`).

## Verificación

- `npx prisma validate` OK.
- `psql`: `notificaciones_lecturas` con sus 5 columnas; `notificaciones` sin
  `leido_en` ni `descartada` (0 columnas viejas).
- Migración registrada en `_prisma_migrations`; cliente regenerado.
- `migrate diff` tras aplicar: solo el drift preexistente documentado.

## Pendientes / riesgos

- El backend sigue leyendo/escribiendo las columnas eliminadas — **se rompe
  hasta B5.7** (siguiente commit: rewire del service). No levantar la API para
  probar notificaciones antes de ese commit.
