# Integraciones: mock de NotificacionesService destraba los TestingModule

**Fecha:** 2026-11-18
**Autor:** agente

## Cambios realizados
- Los specs de integración de ventas, proveedores y reportes-campo no llegaban a BD: el `TestingModule` fallaba con `Nest can't resolve dependencies ... (NotificacionesService)`. Se agregó un provider mock con los 4 métodos que se invocan (`emitirARol`, `emitirATorre`, `emitirATrabajador`, `emitirAUsuario`), todos `jest.fn()`.
- Se usó mock y no el servicio real porque estos specs son de auditoría con BD real: instanciar el real insertaría notificaciones de prueba y arrastraría sus dependencias. El mock es lo mínimo que destraba el arranque.

## Cosas nuevas
- Ninguna (solo providers dentro de los tests).

## Archivos tocados
- `apps/api/src/ventas/ventas.integration.spec.ts` (modificado)
- `apps/api/src/proveedores/proveedores.integration.spec.ts` (modificado)
- `apps/api/src/reportes-campo/reportes-campo.integration.spec.ts` (modificado)
- `historial-cambios/2026-11-18-integraciones-notificaciones-mock.md` (creado)

## Pruebas / verificación
- `cd apps/api; npx jest --config jest.integration.config.js --runInBand src/proveedores/proveedores.integration.spec.ts` → 1 suite, 9/9 pruebas, exit 0.
- `... src/ventas/ventas.integration.spec.ts` → 6 pasan / 6 fallan, exit 1. Los errores de DI desaparecieron; los 6 fallos son de negocio/datos (detalle abajo).
- `... src/reportes-campo/reportes-campo.integration.spec.ts` → 32 pasan / 1 falla, exit 1. Igual: DI destrabado, queda un fallo de fixture.
- `src/usuarios/roles.integration.spec.ts` no se tocó: pasa 8/8 en la revisión previa, no reprodujo el fallo reportado.

## Pendientes y riesgos
- **Ventas (6 fallos preexistentes, fuera del plan autorizado):** (a) `BadRequestException: Fuera de horario de atención. El turno es de 08:00 a 16:00 hrs.` — los specs se corrieron ~19:10 y la validación de horario del service bloquea la creación; (b) un `expect(audits[0].entity_id).toBe(idFantasma)` recibe otro UUID. No se arreglaron de paso.
- **Reportes-campo (1 fallo preexistente):** `usuarioDemo('soldador@svr-constructora.com')` devuelve `null` — ese usuario demo desapareció al consolidar los roles técnicos en `Técnico`. El fixture del spec está viejo. No se arregló.
- Los specs ahora sí insertan y limpian datos reales en `svr_erp`; antes fallaban antes de llegar a BD. `registro_auditoria` sigue siendo inmutable y no se limpia.
