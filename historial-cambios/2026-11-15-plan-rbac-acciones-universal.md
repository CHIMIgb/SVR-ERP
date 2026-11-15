# Análisis documentado — RBAC de acciones universal (ocultar botones sin permiso)

**Fecha:** 2026-11-15
**Autor:** Agente (análisis pedido por el usuario; solo documentación, sin código)

## Cambios realizados
- Auditoría completa del RBAC con las reglas decididas por el usuario: ocultar del
  todo los botones/acciones sin permiso, fuente de verdad = permisos granulares
  `(modulo, recurso, accion)`, alcance escritorio + PWA, backend sigue validando.
- Estructura verificada contra la BD: 107 permisos, 228 rutas / 216 decoradores en
  32 controladores (exentos legítimos: auth y PIN — recurso propio), 85 combos
  únicos exigidos, **0 combos usados que no existan en BD**.
- Hallazgo clave: `role_permissions` (defiende el backend) y los flags de
  `role_vistas` (gatilla los botones) son dos asignaciones independientes que nada
  cruza → ahí nace el desalineamiento que el usuario observó.
- 22 permisos en BD que ningún endpoint exige, clasificados: (A) features no
  construidas (documentos, configuración, reportes, exportar de cotizaciones/
  inventario/reportes_campo, flota editar/eliminar, ventas.cancelar,
  mantenimiento.aprobar…), (B) acciones client-side (SPEI, asistencia/combustible
  export, dashboard). No hace falta migración para el gating.
- Desalineamientos concretos encontrados (botón flag ≠ endpoint): el más claro,
  "Sincronizar asistencia" en /nomina — botón por flag `puedeEditar`, endpoint
  exige `rrhh.nomina.procesar`. El frontend usa flags de vista en ~27 vistas y
  `user.permisos` solo en 2.
- Plan universal en 6 fases con dueños: F1 helper `puede()/usePuede()` en
  `lib/permisos.ts` (compartido escritorio+PWA) → F2 vistas Ops/Com (este dev) →
  F3 RRHH/Maquinaria/Sistema (otro dev) → F4 PWA → F5 pantalla /roles (la pestaña
  Permisos pasa a ser la única fuente de acciones) → F6 huérfanos (decisión de
  producto). Incluye tabla de mapeo de acciones especiales y riesgos.

## Archivos tocados
- `docs-planes/PLAN-RBAC-ACCIONES-UNIVERSAL-2026-11-15.md` (nuevo — el análisis completo)

## Verificación
- Solo documentación: no se tocó código; no aplica tsc/eslint/tests.
- Datos verificados con psql (catálogo de permisos) y barrido regex de los 32
  controladores (`@RequirePermission`) y las 27 vistas (flags vs permisos).

## Pendientes / riesgos
- Nada ejecutado: plan PROPUESTO, pendiente autorización de F1/F2 y coordinación
  F3/F4/F5 con el otro dev.
- Conteo 107 vs el 106 histórico de la doc: revisar posible duplicado invisible al
  tocar el seed la próxima vez.
- Si se aprueba F1-F5, un rol que hoy ve botones por flag `true` sin el permiso
  real dejará de verlos — cambio de UX a avisar antes de pushear.
