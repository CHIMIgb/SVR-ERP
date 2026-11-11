# Fix P14 — IsUUID rechazaba los IDs del seed (rolId/encargadoId)

**Fecha:** 2026-11-11
**Autor:** agente SVR-ERP (GLM-5.3-Flash)

## Cambios realizados
- El alta de Trabajadores fallaba con 400 "rolId debe ser un UUID válido" aunque el
  usuario sí hubiera elegido un rol: los IDs del seed (`e0000000-0000-0000-0000-0000000000a5`,
  `c0000000-…`) tienen dígito de versión `0`, y `@IsUUID` de class-validator los rechaza
  incluso en modo `all` (verificado con `validator.isUUID` → false; regex laxo → true).
- Se reemplaza `@IsUUID` por `@Matches(UUID_LAXO)` (regex sin dígito de versión, igual
  criterio que el tipo `@db.Uuid` de la BD) en `rolId` y `encargadoId` del DTO.

## Archivos tocados
- `apps/api/src/trabajadores/dto/create-trabajador.dto.ts` (modificado)
- `apps/api/src/trabajadores/dto/trabajadores.dto.spec.ts` (base con ID estilo seed
  como regresión del bug)

## Pruebas / verificación
- `npm run test -- --testPathPattern="trabajadores"` → 84/84 ✓
- POST real contra la API corriendo con rol del seed → 201 con
  `identidad { numeroEmpleado: TRA-008, pinTemporal, temporalHasta +24h }` ✓
- Limpieza manual de datos de prueba: trabajador/user/persona del curl y residuo de la
  corrida de integración fallida (rol `ZZRolP14 a1d1abf1`, user "Residente IT").

## Pendientes y riesgos
- Otros DTOs que usan `@IsUUID` podrían fallar igual si reciben IDs del seed
  (solo se tocó P14, donde se demostró el problema).
