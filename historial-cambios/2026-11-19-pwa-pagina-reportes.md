# Página /m/reportes — primera vista real de la PWA (2/2)

**Fecha:** 2026-11-19
**Autor:** agente
**Plan de origen:** plan `/m/reportes` autorizado el 2026-11-19 (commit 2 de 2, tras `5a82ebc1`)

## Cambios realizados
- **`apps/web/src/app/(pwa)/m/reportes/page.tsx`** reemplaza el `PantallaPlaceholder`:
  - **Cero lógica de ámbito en la vista:** `reportesCampoApi.listar()` trae lo que toca por JWT (`aplicarAmbito` del backend) — propios (Trabajador) / equipo (Residente) / torre (Técnico) / todo (Administrador). El subtítulo solo lo nombra.
  - Stats mini con `reportesCampoApi.stats()` (Nuevos / En curso / Críticos) usando `StatsCard` del kit con `loading` (spinner SOLO en el valor).
  - Chips de estado (Todos/Nuevos/En curso/Cerrados — valores API UPPERCASE en el query) + búsqueda con debounce de 400 ms (recarga server-side, `recargar` con primer statement `await` para respetar `react-hooks/set-state-in-effect`).
  - Lista paginada server-side (10 por página) con cards `TarjetaReporte` + botón «Cargar más»; skeleton inicial con `Skeleton variant="card"`; vacío con `EmptyState`; error con banner + `role="alert"`; refetch con `RefreshOverlay`.
  - Acción de tarjeta **Aceptar** solo si `puedeEditar` (leído de la vista de escritorio `/reportes`, permiso ya existente — sin permisos nuevos) y estado `Nuevo`; con guard anti-carrera del backend y feedback inline (`mensajeErrorApi`).
  - Detalle en `Modal` del kit: descripción, categoría, quién reportó, ubicación (proyecto o coordenadas), asignado, teléfono `tel:`, bitácora (actividades en solo lectura) y acciones de estado (Aceptar / En curso / Cerrar) gated por `puedeEditar` — **requieren conexión**, nunca van a la cola.
  - Captura offline-first con `ModalNuevoReporte` (encola + sincroniza; commit `5a82ebc1`) y `EstadoCola` con `refreshKey` — aquí vive la decisión humana de conflictos (Descartar/Reintentar).
  - Recarga total al volver la señal (evento `online`) y tras encolar/ACK.
- **Corrección a `TarjetaReporte` (commit 1):** al conectar la página descubrí que el API ya serializa `estado`/`prioridad`/`categoria` como texto es-MX (`ESTADO_LABELS`/`PRIORIDAD_LABELS`/`CATEGORIA_LABELS` del service: 'Nuevo', 'Crítica', 'Mecanico'...), no en UPPERCASE. Se eliminaron los mapas de etiquetas duplicados de la tarjeta (mostrar el valor tal cual, variantes de Badge claveadas por el texto español) y se actualizó su doc en `COMPONENTS.md` §16.4.

## Cosas nuevas
- Primera pantalla `/m/*` con módulo real: fija el patrón de las siguientes vistas (stats mini + cards + captura en cola + detalle modal).

## Archivos tocados
- `apps/web/src/app/(pwa)/m/reportes/page.tsx` (reemplaza placeholder)
- `apps/web/src/components/pwa/TarjetaReporte/TarjetaReporte.tsx` + `index.ts` (corrección de contrato)
- `COMPONENTS.md` (§16.4 ajustada)
- `historial-cambios/2026-11-19-pwa-pagina-reportes.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit` en `apps/web`: 0 errores.
- `npm run lint` en `apps/web`: 0 errores, 37 warnings preexistentes (sin añadir excepciones a `eslint.config.mjs`).
- `git diff --check`: sin errores.
- Backend: **sin cambios** (verificado: la página consume solo endpoints existentes; los query params `search/estado/page/limit` y el payload de create con `idempotenciaKey` ya están en el contrato).
- **Smoke manual pendiente (a ejecutar en la sesión de pruebas):** con `npm run dev` + API en `:3001` y sesión real — crear reporte con señal (folio en BD), avión activado (item en cola + badge), reconectar (ACK + folio), Aceptar como Técnico, cerrar como quien aceptó, y la vista en 320px. El camino del 409 sigue sin caso real forzable; `EstadoCola` lo cubre si aparece.

## Pendientes y riesgos
- Adjuntos/fotos: fuera de esta fase (el spec los secuencia después de la captura base).
- Comentary (actividades) es solo lectura: escribir comentarios llega con su fase.
- «Presionar» (nudge a la torre del Residente, spec §8.3): queda para después.
- Sin pruebas de render (deuda activa de infra frontend); smoke manual obligatorio documentado arriba.
- Sin push: el commit queda local, como indica la regla del repo.
