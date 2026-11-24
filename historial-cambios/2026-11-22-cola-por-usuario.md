# La cola es del usuario: B ya no envía lo pendiente de A

**Fecha:** 2026-11-22
**Autor:** SVR-ERP Dev (agente)

## Cambios realizados
- Punto importante de la tercera revisión: `ElementoCola` ahora guarda
  `usuarioId` (el dueño de la captura, leído del perfil de sesión al
  encolar) y el envío usa SOLO el token del dueño — el caso "A se le
  vence la sesión, B entra al teléfono y el sincronizador manda las
  capturas de A a nombre de B" ya no puede ocurrir. Lo de A queda
  dormido y se envía cuando A vuelve a entrar.
- Filtrado por usuario en los CUATRO puntos que tocan la cola:
  sincronizador (envío), `contarPendientes` (badge de la nav), `EstadoCola`
  (visibilidad y decisiones humanas) — items de otro usuario invisibles
  mientras otro use el teléfono. Los items VIEJOS sin `usuarioId` no se
  envían solos ni se muestran (no se sabe de quién son; mueren en el
  logout). La ruta de sesión vencida queda cubierta: no limpia la cola,
  pero ya no puede enviarla con otro token (cierra el pendiente I-2).
- `limpiarCola()` en logout sigue borrando TODO (teléfono compartido),
  como estaba diseñado.

## Archivos tocados
- apps/web/src/lib/pwa/offline.ts (campo usuarioId, `usuarioSesionId()`,
  encolar, contarPendientes)
- apps/web/src/lib/pwa/sincronizador.ts (filtro de envío)
- apps/web/src/components/pwa/EstadoCola/EstadoCola.tsx (visibilidad)
- apps/web/src/lib/pwa/offline.test.ts (reorganizado + 4 tests nuevos)
- apps/web/src/lib/pwa/sincronizador.test.ts (3 tests nuevos, items con dueño)
- COMPONENTS-PWA.md (§6 EstadoCola: alcance por usuario)

## Pruebas / verificación
- `npx tsc --noEmit` en apps/web: limpio.
- `npm run lint`: 0 errores, 38 warnings preexistentes.
- `npm test -- --runInBand`: 6 suites, 27/27 (item ajeno no se envía,
  item viejo sin dueño no se envía, sin sesión no envía nada, encolar
  guarda el usuarioId, usuarioSesionId lee/null/corrupto).
- `git diff --check`: falso positivo CRLF conocido en
  `sincronizador.test.ts` (documentado en el commit del menor 1).
- Smoke en teléfono (cambio de usuario con cola): NO realizado.

## Pendientes y riesgos
- Items viejos sin `usuarioId` quedan huérfanos hasta el logout: en un
  teléfono que tenga capturas pendientes de ANTES de actualizar la app,
  el usuario las perderá de vista (shortcut: no hay forma de saber de
  quién son; ventana de actualización corta, el logout las limpia).
- El badge/EstadoCola ahora solo cuentan lo del usuario activo: si B
  entra con capturas de A dormidas, el badge muestra 0 aunque existan en
  IndexedDB — comportamiento intencional (privacidad + honestidad del
  contador), documentado en COMPONENTS-PWA §6.
