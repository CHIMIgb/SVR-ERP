# Centro de alertas PWA como burbuja flotante compacta (paridad del escritorio)

**Fecha:** 2026-11-20
**Autor:** agente
**Origen:** pedido del usuario con capturas — «la hagas como de la mitad del tamaño y que aparezca como una burbuja flotante como en escritorio, con su propio scroll»

## Cambios realizados
- **`NotificacionesModal` rediseñado** de modal centrada de página a
  **burbuja flotante compacta anclada arriba a la derecha** (bajo la
  campana, paridad del «Centro de Alertas» del escritorio):
  - Ancho `min(20rem, 100vw-24px)` — la mitad del ancho anterior — y
    **altura acotada** `calc(100dvh-5.5rem)` con **lista con su propio
    scroll** (la tarjeta del kit es flex + el cuerpo con
    `overflow-y-auto`).
  - Anclada con `contentClassName` del kit `Modal`
    (`self-start ml-auto mr-3 mt-2`) — sin posiciones manuales ni
    `style={{}}`.
  - **Items compactos estilo escritorio**: ícono por tipo (ShieldAlert
    roja / CheckCircle verde), título truncado con la **fecha a la
    derecha**, cuerpo a 2 líneas, punto de no leída a la derecha; tap
    marca leída.
  - Sin pie «Cerrar»: se cierra con tap fuera (overlay), Escape o la
    propia campana (toggle) — como el popover del escritorio.
- **Banner de push compacto** conservado con sus 4 estados
  (`por-activar`/`activadas`/`bloqueadas`/`no-soportado`).
- `COMPONENTS-PWA.md` §8 actualizada.

## Archivos tocados
- `apps/web/src/components/pwa/NotificacionesModal/NotificacionesModal.tsx` + `.styles.ts`
- `COMPONENTS-PWA.md` (§8)
- `historial-cambios/2026-11-20-notificaciones-burbuja.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit`: 0 errores. `npm run lint`: 0 errores, 37 warnings preexistentes.
- `git diff --check`: sin errores.
- Smoke pendiente en el teléfono: burbuja bajo la campana, scroll propio,
  cierre por tap fuera y por campana.

## Pendientes y riesgos
- El ancho en teléfonos angostos queda casi a todo lo ancho menos márgenes
  (min(20rem, 100vw-24px)) — la «mitad» real se aprecia en pantallas
  ≥400px; si la quieres más chica en el teléfono, se baja a 18rem.
- Sin push: el commit queda local.
