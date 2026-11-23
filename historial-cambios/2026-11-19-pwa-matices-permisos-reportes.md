# PWA /m/reportes con los matices de permisos del escritorio (quedan iguales)

**Fecha:** 2026-11-19
**Autor:** agente
**Continuación de:** `2026-11-19-role-vistas-reportes-alineadas.md` (migración DB)

## Cambios realizados
- `(pwa)/m/reportes/page.tsx` replica ahora las condiciones LITERALES de los
  botones del escritorio `/reportes`:
  - `esAdminReportes` = rol con nivel ≥100 (solo Admin edita ajenos, cierra, asigna).
  - `esResidente` = solo seguimiento (el server rechaza con `RESIDENTE_SOLO_SEGUIMIENTO`).
  - **Card (Aceptar):** `puedeEditar && !esResidente && estado === 'Nuevo' && !asignadoANombre` — las 4 condiciones del escritorio.
  - **Detalle:** el pie quedó con el flujo real del escritorio — **Iniciar** solo si
    `Nuevo && asignadoANombre` (el responsable ya aceptó), **Cerrar incidente**
    solo `esAdminReportes && estado !== 'Cerrado'`. Se quitó el Aceptar/«En curso»
    del detalle que yo había inventado (la aceptación es acción de tarjeta, como
    en el escritorio).
  - Parámetro muerto `esDetalle` de `aceptar()` eliminado.
- Con la migración DB del commit hermano (`role_vistas` alineadas),
  Cobrador/Trabajador dejan de ver Aceptar/Editar y Técnico no ve eliminar —
  la UI y el server quedan en la misma página en ambas apps.

## Archivos tocados
- `apps/web/src/app/(pwa)/m/reportes/page.tsx`
- `historial-cambios/2026-11-19-pwa-matices-permisos-reportes.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit`: 0 errores. `npm run lint`: 0 errores, 37 warnings preexistentes.
- `git diff --check`: sin errores.
- **Smoke pendiente en el teléfono:** Residente (RES-014) no ve Aceptar; Cobrador (COB-003) no ve Aceptar ni Editar; Técnico (TEC-007) acepta → Iniciar; Admin (ADM-01) ve Cerrar incidente.

## Pendientes y riesgos
- **Asignar/Reasignar responsable es del escritorio** (modal con lista de trabajadores, `esAdminReportes`): en la PWA no existe todavía — el Admin móvil no puede asignar desde el teléfono (anotado; es un módulo aparte).
- El «Editar» de reportes tampoco existe en la PWA (sigue en escritorio, como el resto de la paridad del modal).
- Sin push: el commit queda local.
