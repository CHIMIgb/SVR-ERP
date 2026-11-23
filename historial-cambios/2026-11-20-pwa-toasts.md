# Toasts en la PWA + paridad con los toasts de /reportes del escritorio

**Fecha:** 2026-11-20
**Autor:** agente
**Origen:** autorización del usuario — «todos los que están en reportes en escritorio colócalos en la pwa» (continúa al fix de `tamano`)

## Cambios realizados
- **`(pwa)/layout.tsx`:** monta `ToastProvider` del kit compartido
  (`@/components/layout/Toast` — el mismo del escritorio). Los toasts usan
  la posición/estilos del kit; nada nuevo inventado.
- **`/m/reportes/page.tsx`:** el estado inline `mensaje` (texto bajo la
  lista) se reemplazó por toasts con los MISMOS textos del escritorio:
  - Éxitos: «Aceptado… — quedaste como responsable.», «Imagen adjuntada
    exitosamente.», «Responsable asignado exitosamente.», «Reporte <estado>.»
    → `success`.
  - Errores (mensajeErrorApi, catch de conexión, validaciones de asignar)
    → `error`.
  - El banner de error de carga (lista) sigue inline — es estado de pantalla,
    no feedback de acción.
- **`ModalNuevoReporte`:** validaciones y GPS con los mismos mensajes del
  escritorio → `error` («Selecciona el área…», «Tu navegador bloquea el GPS…»,
  etc.); **ACK → «Incidente registrado exitosamente.»** (`success`, literal
  del escritorio); **sin señal → «Tu reporte quedó guardado… se enviará solo.»**
  (`info`, caso que el escritorio no tiene). El estado `error` inline del
  modal se eliminó (y su clase `errorGeneral` de los `.styles.ts`).
- Las capturas de estado por item (`EstadoCola`) siguen siendo UI viva, no
  toasts: el toast desaparece, la cola no.

## Archivos tocados
- `apps/web/src/app/(pwa)/layout.tsx`
- `apps/web/src/app/(pwa)/m/reportes/page.tsx`
- `apps/web/src/components/pwa/ModalNuevoReporte/ModalNuevoReporte.tsx` + `.styles.ts`
- `historial-cambios/2026-11-20-pwa-toasts.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit`: 0 errores. `npm run lint`: 0 errores, 37 warnings preexistentes.
- `git diff --check`: sin errores.
- Los cambios se aplicaron con scripts line-based sobre ~30 llamadas
  (`setMensaje`→`showToast`, `setError`→`showToast`), verificando después
  que no quedara ningún resto (`setMensaje`/`setError` = 0 coincidencias).
- Smoke pendiente: toasts visibles en el teléfono (aceptar, comentar, adjuntar,
  asignar, enviar reporte con y sin señal).

## Pendientes y riesgos
- El toast del kit aparece esquina (top-right): en móvil con la notificación
  del sistema podría solaparse visualmente — si molesta, ajuste de posición
  solo móvil (se evalúa en smoke).
- Otras pantallas `/m/*` futuras ya tienen el contexto listo (una sola
  montura en el layout).
- Sin push: el commit queda local.
