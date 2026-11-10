# /reportes por rol: todos crean excepto Residentes · Residentes ven los de sus trabajadores

**Fecha:** 2026-11-08
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

RBAC del flujo alineado al negocio del cliente:

1. **Todos minoristas menos los Residentes pueden crear.** Residente perdió
   `reportes_campo.crear` (rol permiso + flag `puede_crear` de la vista → el
   botón "Nuevo Reporte" desaparece para él). **Cobrador suma crear** (levantaba
   reportes desde criba/POS). Técnico/Trabajador/Administrativo sin changes.
2. **Residentes solo ven los reportes de SUS trabajadores** (+ los suyos) y
   pueden dar seguimiento (aceptar/cerrar/comentar — ya tenían `editar`).
   Para computablizarlo se agregó el vínculo orgánico que faltaba:
   `users.jefe_user_id` (residente jefe de cada trabajador, FK self, índice).
   `aplicarAmbito` ahora cubre los cuatro casos: admin (nivel 100) todo;
   Residente = reportes de usuarios a su cargo + los suyos; el resto su torre;
   sin torre (Trabajador) solo los suyos.
3. Demo: el usuario Trabajador queda a cargo del usuario Residente (SQL
   idempotente en la migración).

## Archivos tocados

- Migration `20261108220000_rbac_reportes_por_rol_y_jefes` + schema (jefe_user_id self-relation)
- `apps/api/src/reportes-campo/service.aplicarAmbito` (rama Residente)
- README pendiente de referenciar la relación (jefe/residente en tabla de roles)

## Pruebas / verificación

- Unitarios **75/75** · integración real **26/26** · `tsc --noEmit` api+web.
- E2E real: residente crear → **FORBIDDEN** y flag `puedeCrear=false` en su
  perfil; trabajador creó INC0041 y **el residente lo ve** (scope jefe);
  residente delete → FORBIDDEN (seguimiento solamente). Admin borra el demo.

## Pendientes y riesgos

- La asignación jefe↔trabajador hoy es por SQL; cuando exista el panel de
  usuarios se expone ahí (misma columna).
- Si el negocio quiere que los residentes también vean reportes de OTRÁS torres
  levantados EN SUS proyectos (no solo los de sus trabajadores directos), se
  amplia el scope con `reportes_campo.proyecto_id IN (proyectos a su cargo)`.
