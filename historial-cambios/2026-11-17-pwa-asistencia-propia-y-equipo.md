# PWA, rebanada 1: asistencia propia y del equipo (backend)

**Fecha:** 2026-11-17
**Autor:** P4chec0php

## Cambios realizados
- **Endpoints de autoservicio para la PWA.** Hasta ahora checar asistencia pedía `rrhh.asistencia:crear`, y ese
  endpoint recibe el `trabajadorId` en el body: dárselo a un trabajador le permitía checar por cualquier
  compañero. Y ver asistencia (`rrhh.asistencia:ver`) mostraba a todos. Ahora hay endpoints aparte donde el
  trabajador **sale siempre del token** (`trabajadores.usuario_id`, el enlace B5.11):
  - `GET /api/asistencia/mia`: datos del trabajador (sin sueldos), obras donde puede checar (con aviso si aún
    no tienen ubicación), registro de hoy o turno nocturno abierto, y su semana.
  - `POST /api/asistencia/mia/entrada`: sin `trabajadorId` (si se manda, 400). Solo en obras de sus proyectos
    activos: otra obra da 403 `OBRA_NO_ASIGNADA`; sin proyectos, 400 `SIN_OBRA_ASIGNADA`. Por dentro reusa
    `marcarEntrada()`: geocerca, una entrada por día, tarde = omisión.
  - `POST /api/asistencia/mia/salida`: reusa `marcarSalida()` (incluye turno nocturno). Sin `trabajadorId` ni
    el override manual de horas, que es de la administradora.
  - `GET /api/asistencia/equipo?fecha=`: trabajadores cuya cuenta tiene al usuario como jefe
    (`users.jefe_user_id`, lo que se arma en `/equipos`), con teléfono y estado del día, y totales. Sin sueldos.
  - Cuenta sin trabajador enlazado: 404 `SIN_TRABAJADOR_ENLAZADO` (auditado en entrada y salida).
- **Permisos nuevos, separados de los de RRHH.** `rrhh.mi_asistencia:ver|crear` para todos los roles activos
  (la asistencia es universal) y `rrhh.mi_equipo:ver` para Residente y Administrador.
- `findSemanal()` acepta una lista interna de trabajadores (la usa el equipo); sus llamadas existentes no
  cambian.

## Cosas nuevas
- Migración `20261117010000_asistencia_propia_permisos` (aditiva e idempotente: `ON CONFLICT DO NOTHING` y
  `NOT EXISTS`).
- DTOs `MarcarEntradaPropiaDto`, `MarcarSalidaPropiaDto`, `QueryEquipoDto`.

## Archivos tocados
- `apps/api/prisma/migrations/20261117010000_asistencia_propia_permisos/migration.sql`
- `apps/api/src/asistencia/asistencia.controller.ts`
- `apps/api/src/asistencia/asistencia.service.ts`
- `apps/api/src/asistencia/dto/marcar-propia.dto.ts`
- `apps/api/src/asistencia/dto/query-equipo.dto.ts`
- `apps/api/src/asistencia/asistencia.controller.spec.ts`
- `apps/api/src/asistencia/asistencia.service.spec.ts`
- `apps/api/src/asistencia/dto/marcar-propia.dto.spec.ts`
- `apps/api/src/asistencia/asistencia-propia.integration.spec.ts`
- `RBAC.md` (sección 8: permisos de autoservicio)

## Verificación
- `npx tsc --noEmit` en `apps/api`: sin errores.
- Unitarias de asistencia: 146/146. Suite completa: 1441/1443; las 2 que fallan son de `cobranza.service.spec`
  y ya fallaban en `main` sin este cambio.
- Integración nueva contra Postgres real: 7/7 (obra ajena 403 sin registro, cuenta sin trabajador 404
  auditado, entrada y segunda entrada, equipo sin sueldos, salida). Limpia sus datos; la cuenta del trabajador
  de prueba queda dada de baja porque es actor en `registro_auditoria` (inmutable).
- Smoke con la API corriendo y login real (trabajador, residente, admin y RRHH): 401 sin token, 400 con
  `trabajadorId` en el body, 403 en obra ajena, 201 entrada, 400 segunda entrada, 403 al listado y al marcaje
  de RRHH desde el rol Trabajador, 200 equipo del residente sin sueldos, 404 sin trabajador enlazado, 200
  salida.
- Migración aplicada en la BD local y re-ejecutada sin cambios (idempotente).

## Pendientes
- **Servidor:** aplicar `20261117010000_asistencia_propia_permisos` antes de levantar este build.
- Foto obligatoria y motivo del retardo: esperan respuesta del cliente (el DTO se extiende sin romper nada).
- El equipo solo incluye trabajadores con cuenta enlazada que tienen al usuario como jefe; si el cliente quiere
  a todos los de sus obras, cambia el filtro.
- Las pantallas `/m/asistencia` y `/m` (Inicio) son la rebanada 2.
- Integración de ventas, proveedores, roles y reportes de campo, y 2 unitarias de cobranza, fallan en `main`
  (no relacionado con este cambio).
