# Corregir los specs de integración rotos y hacerlos deterministas

**Fecha:** 2026-11-18
**Autor:** Agente (autorizado por el usuario — "Arreglarlo completo")

## Contexto

El workflow `integration` fallaba en GitHub. Con el dump viejo había errores de
esquema; con un dump al día seguían fallando 56 de 292 tests sobre la BD local,
incluso antes de tocar nada. Causas distintas por suite:

- `proveedores`, `ventas`, `reportes-campo`: los servicios inyectan
  `NotificacionesService` (agregado en su constructor) y los `TestingModule` de
  los specs no lo proveían — Nest no podía instanciar el servicio.
- `reportes-campo`: el usuario semilla `pedro.chofer@svr-constructora.com` está
  eliminado desde la consolidación de roles.
- `gps`: la hora se calculaba con el `TZ` del sistema (en local, `America/Mazatlan`,
  UTC-7) en vez del `America/Mexico_City` del `.env`.
- `auth/pin`: los intentos y bloqueos por IP de corridas anteriores (`10.98.0.x`)
  sobrevivían al usuario de prueba y escalaban el bloqueo a 60 minutos.
- `ventas`: los tests dependían del horario configurado (la suite cruzó las
  16:00 CDMX) y el test de `CLIENTE_NO_ENCONTRADO` tomaba la última auditoría
  sin filtrar por su propio `entity_id` (auditoría es inmutable y acumula
  corridas).
- En paralelo, una suite borraba máquinas mientras `gps` simulaba posiciones
  (FK violada en `rastreo_gps`).

## Cambios realizados

- Los 3 specs con DI rota reciben un mock de `NotificacionesService` con los 4
  métodos `emitir*`, igual que sus specs unitarios. No se tocó ningún servicio
  de negocio.
- `reportes-campo`: usar `trabajador@svr-constructora.com` (activo, mismo jefe
  residente que el usuario eliminado).
- `jest.integration.config.js`:
  - `require('dotenv').config()` en el proceso principal para que los workers
    hereden el `TZ` del `.env` (zona horaria sigue teniendo una sola fuente).
  - `maxWorkers: 1`: los specs comparten una BD efímera, en paralelo se pisan.
- `auth/pin`: limpieza de `usuarios_bloqueados` e `intentos_login` para las IPs
  de prueba, en `beforeAll` y en `limpiar()`, para que el spec sea idempotente.
- `ventas`: fija el turno `00:00–23:59` en `beforeAll` y lo restaura en
  `afterAll` (invalida el caché de config en ambos puntos); el test de cliente
  inexistente filtra la auditoría por `entity_id`.

## Archivos tocados

- `apps/api/jest.integration.config.js` (modificado)
- `apps/api/src/auth/pin/pin.integration.spec.ts` (modificado)
- `apps/api/src/proveedores/proveedores.integration.spec.ts` (modificado)
- `apps/api/src/reportes-campo/reportes-campo.integration.spec.ts` (modificado)
- `apps/api/src/ventas/ventas.integration.spec.ts` (modificado)
- `historial-cambios/2026-11-18-integration-specs-deterministas.md` (creado)

## Pruebas / verificación

- `npm run test:integration` contra `svr_erp` local: **26 suites, 292 tests
  pasados** (antes 5 suites y 56 tests fallidos).
- `npm run test:integration` contra el dump limpio restaurado en BD efímera:
  **26 suites, 292 tests pasados** en 90 s.
- La configuración de turno de `svr_erp` quedó restaurada a `08:00/16:00`
  después de correr el spec de ventas.

## Pendientes y riesgos

- Falta confirmar la corrida del workflow `integration` en GitHub con estos
  cambios y el dump regenerado (se registra en otro archivo de historial).
- Con `maxWorkers: 1` la suite tarda ~90 s en vez de ~45 s; es el precio de
  eliminar las carreras entre specs que comparten la misma BD.
- Sigue apareciendo un aviso de `worker process failed to exit gracefully` al
  terminar; no falla ningún test, pero indica una conexión/handle sin cerrar.
