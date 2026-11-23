# Detalle móvil con imágenes y comentarios (paridad con el escritorio)

**Fecha:** 2026-11-19
**Autor:** agente
**Plan de origen:** análisis autorizado el 2026-11-19 («al ver un reporte en la pwa no aparecen las opciones de añadir imagen o publicar»)

## Cambios realizados
- `(pwa)/m/reportes/page.tsx` — el detalle ahora tiene las tres piezas que el
  escritorio muestra y el móvil no replicó:
  1. **Imágenes del reporte** (visible a todos): grid de adjuntos con enlace
     (data-URI, pestaña nueva), contador `N/4` y «Sin imágenes todavía».
  2. **Adjuntar imagen** — condición literal del escritorio:
     `puedeEditar && !esResidente && estado !== 'Cerrado'` (L1402). WebP local
     vía `convertirAWebp` (lib compartida), límites 4 × 2 MB, mensajes
     idénticos, `reportesCampoApi.adjuntar()` + refetch del detalle.
  3. **Comentar** — textarea + Publicar gated `puedeEditar && estado !==
     'Cerrado'` con `reportesCampoApi.comentar()` + refetch. **Divergencia
     consciente vs escritorio:** el escritorio muestra la caja a cualquiera
     que vea el detalle (los sin permiso recibirían 403 del server, que exige
     `reportes_campo:editar`); en móvil se gatea por `puedeEditar` para no
     pintar botones que 403 — mismas capacidades reales.
- Estados nuevos (`comentarioTexto/comentando/adjuntando`), botón Publicar
  ≥44px con `loading`, errores inline con `mensajeErrorApi`/mensaje de conexión.
- Acciones interactivas → requieren conexión (regla del spec §7c); sin señal,
  error de conexión visible y el detalle en pantalla queda intacto.

## Archivos tocados
- `apps/web/src/app/(pwa)/m/reportes/page.tsx`
- `historial-cambios/2026-11-19-pwa-detalle-imagenes-comentarios.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit`: 0 errores (faltó importar `Textarea` en el primer corte — corregido).
- `npm run lint`: 0 errores, 37 warnings preexistentes.
- `git diff --check`: sin errores.
- **Smoke pendiente en el teléfono:** abrir un reporte → publicar comentario (aparece en bitácora), adjuntar imagen (aparece en grid), y con un reporte Cerrado verificar que ambas opciones desaparecen. En 320px el grid de imágenes.

## Pendientes y riesgos
- Sin caso «borrar adjunto» (el escritorio tampoco lo tiene).
- Sin push: el commit queda local.
