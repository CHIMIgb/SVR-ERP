# Componentes PWA de reportes: tarjeta, estado de cola y captura offline (1/2 de /m/reportes)

**Fecha:** 2026-11-19
**Autor:** agente
**Plan de origen:** plan `/m/reportes` autorizado el 2026-11-19 (commit 1 de 2)

## Cambios realizados
- Tres componentes nuevos en `src/components/pwa/` con el patrón `.tsx` + `.styles.ts` + `index.ts`, documentados en `COMPONENTS.md` (§16.4-16.6):
  - **`TarjetaReporte`** — card móvil de un reporte: folio, badges de estado/prioridad (variantes del `Badge` del kit), descripción truncada, meta y acciones Ver + una acción opcional del rol con targets ≥44px. Presentacional; exporta etiquetas es-MX (`ETIQUETA_ESTADO/CATEGORIA/PRIORIDAD`) reutilizables.
  - **`EstadoCola`** — resumen de la cola offline en pantalla: cada item con su estado (`Pendiente`/`Error de red`/`Conflicto`) y, para los **conflictos (409)**, los botones Descartar/Reintentar que consumen `descartar()`/`reencolar()` del commit `7af7881c`. Se oculta con la cola vacía; refresca por evento `online`, sondeo de 30 s y prop `refreshKey`.
  - **`ModalNuevoReporte`** — captura **offline-first**: SIEMPRE encola (`encolar('/reportes-campo', …)` — la key de idempotencia es el UUID del teléfono, ya aceptada por el API en `9902ee96`) y dispara `sincronizarAhora()`; con ACK se cierra solo, sin señal muestra «quedó guardado». Requiere descripción ≥5 y subcategoría o el toggle «es de mi área» (el backend valida `CATEGORIA_REQUERIDA`). GPS best-effort (`latitud/longitud` opcionales del DTO). Reinicia sus campos al cerrar.
- Validación previa en BD (solo lectura): los roles consolidados heredaron `puede_ver` de `/m/reportes` (Técnico nivel 70 activo ✓, Administrador ✓, Residente ✓, Trabajador ✓) y los permisos de crear/editar siguen viniendo de la vista de escritorio `/reportes` (Residente: editar sí / crear no — se respeta el RBAC existente, sin permisos nuevos).

## Cosas nuevas
- Primera pieza de UI real de la PWA: los tres componentes fijan el patrón para las siguientes vistas `/m/*`.

## Archivos tocados
- `apps/web/src/components/pwa/TarjetaReporte/` (3 archivos, nuevo)
- `apps/web/src/components/pwa/EstadoCola/` (3 archivos, nuevo)
- `apps/web/src/components/pwa/ModalNuevoReporte/` (3 archivos, nuevo)
- `COMPONENTS.md` (secciones 16.4-16.6)
- `historial-cambios/2026-11-19-pwa-componentes-reportes.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit` en `apps/web`: 0 errores.
- `npm run lint` en `apps/web`: 0 errores, 37 warnings preexistentes.
- Ajuste durante lint: la regla activa `react-hooks/set-state-in-effect` rechazó el reset síncrono en el efecto del modal — se reestructuró al **cerrar** (cada apertura parte con el catálogo en «cargando» y el efecto solo hace trabajo asíncrono con IIFE + guard `vivo`), sin añadir el archivo a la lista de excepciones de `eslint.config.mjs`.
- `git diff --check`: sin errores.
- Sin pruebas de render (infra de tests front no existe — deuda activa); el smoke visual llega con la página (commit 2) en 320px.

## Pendientes y riesgos
- El modal no consume `proyectos()` (ubicación por obra): el spec lo pide para reportes con obra asociada; quedó fuera de esta primera iteración, la captura usa GPS.
- El hook `useCola` (badge global del shell) no se encadenó a `EstadoCola` — llevan sondeos independientes (30 s cada uno); es redundancia barata, no un bug.
- Sin push: el commit queda local, como indica la regla del repo.
