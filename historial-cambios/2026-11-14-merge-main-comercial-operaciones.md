# main traído a comercial-operaciones + fix del spec de integración de nómina

**Fecha:** 2026-11-14
**Autor:** Agente

## Cambios realizados
- **Merge de `origin/main` en `comercial-operaciones`** (commit `2255d8d8`, sin conflictos): la rama
  estaba 6 commits detrás de main (todo el PR #19): sueldo diario ÷7, prorrateo de ingreso, nómina
  pagada cerrada, candado transaccional en `registrarAjuste` y `sincronizarAsistencia`, salida nocturna
  cruzando medianoche, y el fix del menú de Maquinaria/Mantenimiento (`Sidebar.tsx`). Ahora la rama
  contiene ambos árboles de trabajo y el merge a main futuro será limpio.
- **Fix del spec de integración de nómina:** `NominaService` ganó la dependencia
  `NotificacionesService` (cambio propio de esta rama) pero `nomina.integration.spec.ts` no la tenía en
  sus providers — las 9 pruebas de integración de nómina estaban rotas en la rama (error de resolución
  de dependencias de Nest; nadie las había corrido). Se agrega `NotificacionesService` real (constructor
  simple: PrismaService + AuditService, ya presentes) con su import.

## Archivos tocados
- Merge de `origin/main` (15 archivos: nomina, asistencia, trabajadores, Sidebar, LiquidacionModal,
  DECISIONS.md, historiales).
- `apps/api/src/nomina/nomina.integration.spec.ts` (providers + import)

## Verificación
- `npx prisma generate` tras el checkout de la rama (el cliente estaba desactualizado: era la causa de
  ~90 errores de tsc con `TipoNotificacion`, `notificaciones`, `cotizacion_items`, etc. — código y
  migraciones de la rama ya existían, solo faltaba regenerar).
- `npx prisma migrate status`: schema de `svr-erp-backup` al día (el `.env` de esta rama apunta a esa
  BD, que ya tiene las tablas de las migraciones propias: notificaciones, cotizacion_items,
  materiales_criba).
- `npx tsc --noEmit` en `apps/api` y `apps/web`: sin errores.
- Unitarias de nómina/asistencia/trabajadores: 250/250.
- Integración de nómina contra Postgres real: 9/9 (incluye el candado del sync y el 409 del ajuste).
- Integración de trabajadores: 25/25 — con esta BD el problema del rol `Tecnico` con permiso de
  módulo `sistema` no se manifiesta; en `svr_erp` (la BD del PR #19) sí falla. Es estado de datos,
  no código.

## Pendientes / riesgos
- En la BD `svr_erp` sigue el estado que bloquea el alta con rol `Tecnico` (permiso
  `sistema/notificaciones/ver` en roles de negocio). Revisar los seeds al tocar ese módulo.
