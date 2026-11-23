# Fuga de notificaciones de TORRE visibles para todas las torres (fix del buzón)

**Fecha:** 2026-11-20
**Autor:** agente
**Origen:** pregunta del usuario — «un reporte que va a la torre Diesel, ¿lo ven solo los técnicos de torre Diesel o todos?»

## El hallazgo (verificado con BD y API reales)
- **Diseño:** sí filtra por torre — `emitirATorre` marca `audiencia_torre` y el
  buzón la cruza contra `users.torre` del destinatario (la torre del USUARIO,
  escrita desde el puesto, no la del rol).
- **Realidad antes del fix:** la rama `{ audiencia_rol_id: null }` del where
  (pensada para las filas «para todos») también casaba con las filas
  dirigidas SOLO por torre (que tienen `audiencia_rol_id` null) → el aviso de
  la torre DIESEL era visible para un técnico Mecanico. Probado: insertando
  la fila y consultando el buzón de `TEC-007` (torre Mecanico) — la veía.

## Cambios realizados
- `notificaciones.service.ts` — `filtroDeBuzon`: la rama «para todos» ahora
  exige las **tres** audiencias vacías
  (`audiencia_rol_id = null AND audiencia_torre = null AND
  destinatario_user_id = null`). Una fila dirigida por torre solo entra por
  la rama de SU torre.
- Tests: el where esperado de `findMine` actualizado + test nuevo «una fila
  dirigida solo por TORRE no entra por la rama para todos».

## Verificación / pruebas
- `npm run build`: OK. Unit notificaciones: 18/18 (2 casos de where).
- **End-to-end (BD + API real):** insertadas 2 filas de prueba — `TEC-007`
  (torre Mecanico) **NO** ve la de torre DIESEL (antes: la veía) y **SÍ** ve
  la «para todos». Limpieza de las filas de prueba.
- Las emisiones existentes (reportes-campo, nómina, proveedores, ventas) no
  cambian: solo cambia quién las VE.

## Archivos tocados
- `apps/api/src/notificaciones/notificaciones.service.ts`
- `apps/api/src/notificaciones/notificaciones.service.spec.ts`
- `historial-cambios/2026-11-20-fuga-notificaciones-torre.md` (creado)

## Pendientes y riesgos
- Impacto en buzones reales: notificaciones de torre que antes todos veían
  ahora solo las ven los de esa torre — es el comportamiento diseñado, pero
  el usuario puede percibir «desaparecieron» avisos.
- La PWA sigue sin ver notificaciones (campana muerta, sin
  NotificationProvider) — el eslabón pendiente ya identificado.
- Sin push: el commit queda local.
