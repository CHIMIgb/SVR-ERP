# /reportes pasa a tabla (patrón /inventario) — fuera las tarjetas

**Fecha:** 2026-11-04
**Autor:** agente OpenCode (a petición del usuario)

## Cambios realizados
- El feed de tarjetas de `/reportes` se reemplaza por un **`<DataTable>`**
  (componente existente de `src/components/ui/DataTable`, el mismo patrón de la
  vista /inventario, con scroll horizontal y sombras en móvil).
- **Ajuste posterior (commit 6d7d9639):** la Descripción ya no se corta con
  '…' a 1 línea — colapsa a máximo **2 líneas** (`line-clamp-2`, native de
  Tailwind; el Tooltip sigue mostrando el texto completo). Los botones de
  acción dejaron de ser solo os iconos: icono + texto ("Asignar"/"Reasignar",
  "Marcar X", "Facturar", "Editar", "Eliminar").
- **Ajuste posterior (bc7aad15):** columnas más anchas — Descripción 420px
  (texto hasta ~448px útiles) y Acciones 440px con los botones SIEMPRE en
  una sola fila (se quitó el wrap).
- Columnas: **Fecha/Hora · Área** (icono+color del tipo) **· Reporta** (usuario,
  cliente debajo) **· Obra/Máq. · Prioridad · Estado** (Badges) **· Responsable**
  (quién le cae; si ya está resuelto, muestra en verde quién resolvió con Tooltip
  de la fecha) **· Descripción** (line-clamp-2 con Tooltip del texto completo +
  mini-chips de detalles costo/litros + servicio facturable) **· Acciones**
  (iconos+texto con Tooltip por RBAC: Asignar/Reasignar · Marcar etapa · Facturar ·
  Editar · Eliminar).
- Regla del negocio intacta: botón de avanzar exige responsable antes de
  "Marcar Resuelto" (igual que en tarjetas).
- Sin cambios: PageHeader, banner de críticos, StatsCards, chips de área con
  conteos, SearchBar + panel de filtros, 6 modales, paginación server-side,
  toda la lógica/handlers.

## Archivos tocados
- `apps/web/src/app/(dashboard)/reportes/page.tsx` (solo este archivo)

## Pruebas / verificación
- `npx tsc --noEmit` (web) ✔; eslint del archivo: 0 errores/warnings ✔.
- Upgrade visual en navegador pendiente del usuario.

## Pendientes y riesgos
- Ninguno funcional; en pantallas angostas la tabla scrollea horizontal por
  diseño (regla #1 responsive).
