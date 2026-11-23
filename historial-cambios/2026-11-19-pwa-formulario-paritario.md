# Formulario de reporte PWA con paridad 1:1 del escritorio (2/2)

**Fecha:** 2026-11-19
**Autor:** agente
**Plan de origen:** paridad de inputs del formulario de reportes con el escritorio (autorizado 2026-11-19, tras `4de6720f`)

## Cambios realizados
- **`ModalNuevoReporte` reescrito con los MISMOS inputs del escritorio `/reportes`:**
  1. **Área (a la que se envía)** — requerido: «Misma área» + optgroups (Administración / Residentes / Técnicos) con los mismos labels; hint dinámico con la torre del usuario (`user.torre`). Select nativo (el kit `Select` no soporta optgroups — igual que el escritorio).
  2. **Subcategoría** — opcional, deshabilitada hasta elegir área y **filtrada por el área elegida** (idéntico: `subcategoriasFiltradas` con `categoriaLabel` de la torre del usuario si es misma área).
  3. **Ubicación** — toggle **Proyecto / Ubicación GPS**: proyecto en proceso (`reportesCampoApi.proyectos()`), GPS **se captura al guardar** (con `isSecureContext` + los mismos mensajes del escritorio si HTTPS falta o el GPS falla).
  4. **Prioridad** — opcional (Baja/Media/Alta/Crítica).
  5. **Descripción** — requerida, hint «La fecha y hora se registran automáticamente al guardar».
  6. **Imágenes de la avería** — opcional: máx 4, 2 MB, conversión WebP local, preview + quitar, y se adjuntan tras el ACK (viajan con el item de la cola, no en el payload).
- **Payload idéntico al escritorio:** `mismaArea` (siempre presente, como el escritorio) o `categoria`; `subcategoriaId` solo si NO es misma área; `proyectoId` o `latitud/longitud`; `usuario` = nombre completo de la persona; `prioridad` opcional. Validaciones idénticas (área, proyecto si modo proyecto, descripción) con mensajes literales del escritorio.
- **Página `/m/reportes`:** pasa `torreUsuario={user?.torre}` y el nombre completo (`nombre + apellidos`, igual que `nombreReporta` del escritorio).
- `COMPONENTS.md` §16.6 actualizada (props nuevas, comportamiento paritario, cuándo NO).

## Cosas nuevas
- Primer flujo con fotos offline de punta a punta: captura sin señal → cola (reporte + WebP en el item) → reconexión → ACK → adjunte automático.

## Archivos tocados
- `apps/web/src/components/pwa/ModalNuevoReporte/ModalNuevoReporte.tsx` + `.styles.ts` (reescritura)
- `apps/web/src/app/(pwa)/m/reportes/page.tsx` (props nombre completo + torre)
- `COMPONENTS.md`
- `historial-cambios/2026-11-19-pwa-formulario-paritario.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit`: 0 errores. `npm run lint`: 0 errores, 37 warnings preexistentes (se eliminaron los 2 warnings nuevos que el primer corte introdujo).
- `git diff --check`: sin errores.
- **Smoke manual pendiente:** con `npm run dev` + API, crear reporte con foto con señal (folio + adjunto en BD), y con avión (cola con adjuntos → reconectar → adjunte). Revisar el select de Área con optgroups en 320px.

## Pendientes y riesgos
- Los catálogos (subcategorías/proyectos) se cargan al abrir el modal: sin señal la subcategoría queda vacía y solo «Misma área» + GPS funcionan (la captura NUNCA se bloquea).
- El select de Área es nativo con estilos propios (`.styles.ts`): si el kit `Select` crece con soporte de optgroups, migrar y borrar la excepción.
- Sin push: el commit queda local.
