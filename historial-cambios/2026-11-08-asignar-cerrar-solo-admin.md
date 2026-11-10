# /reportes — Asignar y Cerrar exclusivos de Administrador · opciones sin paréntesis · nota P9 (prioridad)

**Fecha:** 2026-11-08
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

1. **Solo el Administrador puede asignar/reasignar y CERRAR**:
   - Front: el modal Ver muestra **Asignar/Reasignar** y **Cerrar incidente**
     únicamente a admins (`esAdminReportes`); los demás roles siguen el flujo con
     Aceptar (tabla) e Iniciar (detalle).
   - Backend con el mismo cortafuegos (por si el front distribución): `asignar`
      → `ASIGNAR_SOLO_ADMIN` 403; `cambiarEstado CERRADO` → `CERRAR_SOLO_ADMIN`
      403 (Iniciar NUEVO→EN_CURSO sigue abierto a los roles con editar).
   - ACEPTAR sin cambios: la torre toma el incidente y RESPONSABLE = quien
     acepta.
2. **Select de Área sin paréntesis:** optgroups reescritos con raya
   ("Administración — jefes y personas en oficina", "Residentes — ...",
   "Técnicos — ...") y la opción "Misma área" sin el texto "(tu área: X)" — el
   hint bajo el campo ya muestra esa información al elegirla.
3. **P9 documentado en IMPLEMENTACIONES-A-FUTURO.md**: el campo `prioridad`
   de /reportes se **retirará en el futuro** — cuando la empresa termine de
   poblar las subcategorías por torre, estas agruparán un nivel de prioridad y
   se asignará automático (guía de cliente 2026-11-08).

## Archivos tocados

- `apps/api/src/reportes-campo/service.ts` (guardas admin en asignar y cerrar)
- `apps/web/src/app/(dashboard)/reportes/page.tsx` (gating esAdminReportes, textos)
- `docs-planes/IMPLEMENTACIONES-A-FUTURO.md` (P9)

## Pruebas / verificación

- Unitarios **80/80** (+2 nuevos: ASIGNAR_SOLO_ADMIN / CERRAR_SOLO_ADMIN con
  audit FAIL) · integración real **26/26**.
- E2E real: técnico **cerrar → 403**, técnico **iniciar → En curso** (permitido à su rol),
  técnico **asignar → 403**; demo limpiado. `tsc --noEmit` api+web · página eslint 0.

## Pendientes y riesgos

- Los duties de seguimiento (comentarios/adjuntos) siguen siendo de los roles con
  editar — sin cambio. Si "administrativo" (nivel 80) también debe poder cerrar,
  es mover el umbral (hoy: nivel 100 de Administrador).
