# 2026-11-13 — B5.10: notificaciones del flujo de reportes de campo (5 eventos)

## Qué se hizo

Los 5 flujos que pidió el cliente, conectados en `reportes-campo.service.ts`
(módulo importa `NotificacionesModule`; emisión después del audit SUCCESS):

| Flujo | Disparo | Emisión | Audiencia |
|---|---|---|---|
| **Se crea un reporte** | `create` | `emitirATorre(torre)` — la torre destino del reporte | **Toda el área** (usuarios con ese `torre`) |
| **Alguien lo acepta** | `aceptar` | `emitirAUsuario(existente.usuario_id)` — *"Fulano aceptó tu reporte REP-…"* (nombre del aceptador resuelto de su cuenta) | El **creador** |
| **Se reasigna** | `asignar` | `emitirATrabajador(asignadoA)` — *"Te asignaron el reporte…"* | El **nuevo asignado** (cuenta resuelta por nombre) |
| **Se cierra** (estado CERRADO) | `cambiarEstado` | `emitirATrabajador(existente.asignado_a_id)` — *"Cerraron el reporte que tenías asignado"* | El **asignado**, si tiene; si no, nada |
| **Se publican actividades** | `agregarActividad` | Si publicó el **creador** → el asignado; si publicó el asignado (u otro) → el **creador** — *"Nueva actividad… Autor: texto"* | **La otra parte** |

Detalles:
- Helper `nombreDeUsuario(userId)` (nombre completo vía persona) para el
  "quién aceptó".
- El creador no recibe su propio aviso (actor excluido por el filtro del
  buzón); el aviso de creación tampoco le llega a él.
- Spec de reportes con el provider mock de `NotificacionesService`.

## Verificación

- `npx tsc --noEmit` (api): limpio.
- Unit `src/reportes-campo`: **103/103**.
- Smoke real pendiente del cierre (B5.11/docs): crear reporte con un usuario
  de torre X y verlo en el buzón de otro usuario de la misma torre.

## Pendientes / riesgos

- **Match trabajador→cuenta por nombre** (limitación del schema): si dos
  personas se llaman igual, la notificación del asignado no se emite (queda
  loggeada). A futuro, una FK `users.trabajador_id` lo haría exacto.
- El aviso de creación va al área del reporte: si el reporte va a OTRA torre
  ("otra torre" explícita), el creador no lo recibe (correcto: es para el área
  que atiende).
