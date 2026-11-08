# /reportes — columnas nuevas (ID, Ubicación, Responsable, Descripción breve) + categoría

**Fecha:** 2026-11-08
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

Parte web del rediseño de `/reportes` autorizado — la tabla queda exactamente con las
columnas pedidas por el cliente:

- **ID** (nueva): folio `INC0001` del backend (font-black; "—" si no tuviera).
- **Fecha / Reporta / Prioridad / Estado**: intactas.
- **Ubicación**: era "Obra / Máq." — mismo contenido (obra + código de máquina abajo), label nuevo.
- **Responsable**: ahora muestra la **categoría torre** (badge de color por torre:
  Mecanico/Soldador/Diesel/Mantenimiento/Administrativo/Residente) y debajo la
  **persona asignada** o "Sin asignar"/"Resuelto" — el régimen de asignación por
  persona (modal Asignar/Reasignar y gateo de Resuelto) queda intacto.
- **Descripción breve**: texto truncado a 90 caracteres con Tooltip del texto
  completo; se conservan los chips de litros/costo/servicio.
- **Eliminada**: columna **Área** (todavía usable como filtro y en modales).
  Quedaban muertos `getTipoIcon`/`getTipoColor` — borrados junto con sus iconos
  sin uso (Wrench, Fuel, User, HardHat, Users, Briefcase).

Modal Crear/Editar: campo **"Categoría (encargado de resolver)"** (select de las 6
torres, requerido, hint "El reporte sale para toda esa torre"), apoyado en el
`categoria` del backend (feat(api) commit `1c60fffd`).

## Cosas nuevas

- `CATEGORIAS` (enum UI) y `categoriaVariant` (colores por torre) en la página.
- Tipos `CategoriaReporte`/`CategoriaReporteApi` en `lib/api.ts` + `categoria`
  en `ReporteCampoDTO` y `ReporteCampoCreateInput` (requerida al crear).

## Archivos tocados

- `apps/web/src/lib/api.ts` (tipos + campos)
- `apps/web/src/app/(dashboard)/reportes/page.tsx` (columnas, modales, limpieza de código muerto)

## Pruebas / verificación

- `npx tsc --noEmit` (web) OK.
- E2E contra API corriendo: `POST /reportes-campo` con `categoria:
  MANTENIMIENTO` → `INC0024` consecutivo y `categoria: "Mantenimiento"`;
  listado muestra folios `INCxxxx` y categorías de filas viejas con backfill
  (Mecanico) y filas sin categoría (vacío). Reporte de prueba eliminado via
  DELETE (soft delete auditado).

## Pendientes y riesgos

- El enrutado real "le cae a todos los mecánicos" llega con la PWA móvil
  (nueva-info): aquí solo se persiste y muestra la categoría.
- Filas demo sin categoría muestran "Sin categoría"/"—" hasta editarse.
