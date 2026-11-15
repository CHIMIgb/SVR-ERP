# 2026-11-13 — Basura del centro de alertas: descartar notificaciones (desaparecen y no vuelven)

## Qué se hizo

Ajuste pedido tras B5.4: el icono de basura del "Centro de alertas" ahora
**descarta de verdad** — las notificaciones desaparecen y NO vuelven a
aparecer, pero la fila permanece en la BD.

- **BD** (migración `20261113032000_notificaciones_descartada`):
  - Columna **`descartada`** `BOOLEAN NOT NULL DEFAULT false`.
  - `AuditAction.NOTIFICACION_DESCARTADA` con `ALTER TYPE ADD VALUE`
    (no recrea el tipo; el drift preexistente queda intacto).
- **Backend** (`notificaciones.service.ts` + controller):
  - `findMine` y `marcarTodas` filtran `descartada: false` (lo descartado no
    reaparece en el buzón ni en el conteo).
  - **`descartarTodas(userId)`** — `PATCH /notificaciones/descartar-todas`:
    marca el buzón del usuario como descartado y audita SUCCESS con el
    conteo (`AuditAction.NOTIFICACION_DESCARTADA`, severidad WARNING).
- **Web**: el icono de basura (`clearNotifications`) ahora llama a la API
  (antes solo vaciaba el estado local y al siguiente polling reaparecían).

**Sobre el "leido booleano"**: ya existe — el buzón expone `leida: boolean`
derivada de `leido_en` (el timestamp además dice CUÁNDO se leyó; el booleano
solo diría si). No se agregó un segundo campo redundante.

**Matiz por diseño (importante):** las notificaciones se comparten POR ROL
(una fila por evento, spec F1) — descartarlas con la basura las oculta para
**todo el rol destinatario**, no solo para el usuario que clicó. Si el
cliente quiere "ocultar solo para mí", se cambia a filas por usuario (otro
diseño).

## Verificación

- `npx prisma validate` OK; migración aplicada y registrada; columna y valor
  de enum verificados en BD.
- `npx tsc --noEmit` (api y web): limpios.
- Unit `src/notificaciones`: **8/8** (buzón filtra descartadas; nuevo test de
  `descartarTodas` con audit SUCCESS y conteo).
- Smoke real: buzón total=1 → `descartar-todas` → `descartadas=1` → buzón
  `total=0`; en BD la fila sigue existiendo con `descartada = true` ✓.

## Pendientes / riesgos

- Smoke visual del icono pendiente (sin navegador).
- Si el equipo espera ocultado por usuario, el diseño actual lo oculta por
  rol (decisión documentada arriba).
