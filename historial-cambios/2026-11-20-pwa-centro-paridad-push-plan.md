# Centro de alertas PWA con el diseño del escritorio + plan de Web Push

**Fecha:** 2026-11-20
**Autor:** agente
**Origen:** captura del usuario del «Centro de Alertas» del escritorio — «¿no podrías hacer algo como esto en la pwa?» + «¿las notificaciones podrían llegar como las de cualquier otra aplicación?»

## Cambios realizados
- **`NotificacionesModal` rediseñado con paridad del escritorio** (Topbar):
  - Encabezado «**Centro de Alertas** / **N no leídas**» con las acciones de
    ícono a la derecha: `CheckCheck` (**marcar todas leídas**) y `Trash2`
    (**vaciar/descartar**) — targets ≥44px, visibles solo con notificaciones.
  - Estado vacío con **campana grande** + «Sin notificaciones» (igual que la
    captura del escritorio).
  - La lista de items y el tap-para-marcar-leída quedan como estaban.
  - Se retiró el `EmptyState` del kit y el botón de texto del cuerpo —
    ambos reemplazados por el diseño del escritorio; `ModalHeader` ya no se
    usa en este modal (el encabezado es personalizado con acciones).
- **Plan formalizado:** `docs-planes/docs-pwa/PLAN-NOTIFICACIONES-PUSH-PWA.md`
  — las notificaciones push nativas (Web Push) por fases: (a) infra backend
  (`web-push` + VAPID + tabla `push_suscripciones` + endpoints), (b) hook de
  envío en `emitir()` con resolución de usuarios del alcance, (c) handlers en
  `/sw.js` + UX de permiso/suscripción, (d) verificación en dispositivos.
  Incluye las restricciones duras: iOS 16.4+ con app instalada, SW solo en
  producción (sin push en dev), «para todos» en push, y el pendiente de
  transporte (client_max_body_size).

## Archivos tocados
- `apps/web/src/components/pwa/NotificacionesModal/NotificacionesModal.tsx` + `.styles.ts`
- `COMPONENTS-PWA.md` (§8 actualizada)
- `docs-planes/docs-pwa/PLAN-NOTIFICACIONES-PUSH-PWA.md` (creado — solo plan, sin código)
- `historial-cambios/2026-11-20-pwa-centro-paridad-push-plan.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit`: 0 errores. `npm run lint`: 0 errores, 37 warnings preexistentes.
- `git diff --check`: sin errores.
- Smoke pendiente: el centro en el teléfono (header con acciones, vacío con campana).

## Pendientes y riesgos
- **Web Push NO está implementado** (solo plan documentado): requiere
  dispositivos reales, build de producción en el teléfono (el SW no corre en
  dev) y las claves VAPID — se ejecuta por fases cuando el usuario ordene.
- Sin push: el commit queda local.
