# Trabajadores: la baja desactiva también la cuenta de la app

**Fecha:** 2026-11-21
**Autor:** P4chec0php

## Cambios realizados
- **Antes**, dar de baja a un trabajador (baja y finiquito, o eliminar) solo marcaba su registro. Su cuenta de
  la app (`users`, enlazada por `trabajadores.usuario_id`) seguía activa, y el login con PIN solo revisa la
  cuenta. Un ex-trabajador seguía entrando a la PWA: no podía checar, porque la API ya bloquea al inactivo, pero
  sí levantaba reportes y veía notificaciones.
- **Ahora**, en la misma transacción de la baja, la cuenta queda `activo=false` y se cierran sus sesiones
  (`motivo_cierre = 'trabajador_dado_de_baja'`). Es la misma regla que usa Sistema al desactivar una cuenta
  (`UsuariosService.cambiarEstado`). El JWT revisa `users.activo` en cada petición, así que el corte es
  inmediato.
- **Guardas** antes de la baja, auditadas con `fallir()`:
  - nadie registra su propia baja (`NO_PUEDE_DARSE_DE_BAJA_A_SI_MISMO`);
  - no se desactiva la única cuenta de Administrador (`ULTIMO_ADMINISTRADOR`, misma regla que
    `validarNoUltimoAdmin`);
  - la cuenta de un Administrador solo la da de baja otro Administrador (`JERARQUIA_INSUFICIENTE`, 403, la misma
    jerarquía que el reinicio de PIN). Sin esto, el permiso de baja de RRHH alcanzaba para desactivar la cuenta
    de un Administrador.
- La desactivación se audita en la cuenta (`USUARIO_ACTUALIZADO`, entidad `users`, `motivo:
  trabajador_dado_de_baja`).
- **Modal de baja:** avisa que el trabajador pierde el acceso a la app, con su número de empleado, y la
  notificación lo dice.

## Cosas nuevas
- `validarBajaDeCuenta`, `desactivarCuentaPorBaja` y `auditarCuentaDesactivada` (privados) en
  `TrabajadoresService`.

## Archivos tocados
- `apps/api/src/trabajadores/trabajadores.service.ts` (modificado)
- `apps/api/src/trabajadores/trabajadores.service.spec.ts` (modificado)
- `apps/api/src/trabajadores/trabajadores.integration.spec.ts` (modificado)
- `apps/web/src/components/workers/LiquidacionModal.tsx` (modificado)

## Pruebas / verificación
- **Unitarias de trabajadores:** 10 nuevas. Antes del arreglo fallaban 7. Trabajadores: 106/106. Suite completa
  de la API: 1452/1452.
- **Integración completa:** 290/301. Las 11 que fallan son de `reportes-campo`, `proveedores`, `roles` y
  `criba`, y fallan igual sin este cambio: a la BD local le faltan un valor del enum `AuditAction` y datos
  semilla de esos módulos.
- **Integración contra Postgres real:** 2 nuevas (finiquito y eliminar). La cuenta queda inactiva, las sesiones
  cerradas con su motivo y la desactivación auditada. Trabajadores: 27/27.
- **Smoke contra la API local, con login real:** alta con cuenta (número y PIN temporal), el trabajador entra
  con su PIN y el admin registra la baja. Después de la baja:
  - su token da 401;
  - su refresh da 401;
  - no puede volver a entrar;
  - en la BD, su cuenta está inactiva y sin sesiones abiertas, y la desactivación quedó auditada.
  El trabajador de prueba se borró al terminar.
- `npx tsc --noEmit` (API y web) y `eslint` del modal: limpios.

## Pendientes y riesgos
- Las bajas anteriores a este cambio no se corrigen solas. En local no hay ninguna con la cuenta activa. En el
  servidor se puede revisar con:
  `SELECT count(*) FROM trabajadores t JOIN users u ON u.id = t.usuario_id WHERE (t.estado = 'INACTIVO' OR t.eliminado_en IS NOT NULL) AND u.activo AND u.eliminado_en IS NULL;`
- La cuenta no se reactiva sola: hoy un trabajador dado de baja no se reactiva desde Trabajadores (regla que ya
  existía). Si se recontrata, su cuenta se activa en Sistema.
- **Riesgo aceptado**, igual que en Sistema (`UsuariosService.cambiarEstado`): el conteo de Administradores va
  fuera de la transacción. Si se dan de baja al mismo tiempo los dos últimos Administradores, podrían pasar las
  dos. Cerrarlo pide un bloqueo (`SELECT … FOR UPDATE`) en los dos lugares.
