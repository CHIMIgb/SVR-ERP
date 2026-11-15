# 2026-11-13 — Trabajadores demo (uno por puesto/área) + el alta enlaza la cuenta

## Qué se hizo

### 1. Bug que introduje en B5.2 (encontrado al crear los trabajadores)

El permiso `sistema.notificaciones.ver` repartido a **todos** los roles chocó
con el filtro anti-elevación del alta de trabajadores
(`role_permissions: { none: { permissions: { modulo: 'sistema' } } }`): con
ese permiso, TODOS los roles "tenían permisos de sistema" y el alta
rechazaba a todos los puestos con rol ("El rol asociado al puesto no es
válido o no es asignable"). **Corrección:**
`apps/api/src/trabajadores/trabajadores.service.ts` — `ROLES_ASIGNABLES_WHERE`
excluye solo `recurso ≠ 'notificaciones'` (el centro de alertas es de todos;
el resto de permisos de sistema sigue bloqueando la elevación). Spec
actualizado.

### 2. El alta de trabajadores ahora ENLAZA la cuenta (`trabajadores.usuario_id`)

La transacción del alta (que ya crea persona + user + numero_empleado + PIN
temporal) ahora escribe `usuario_id = nuevoUserId` en la fila del trabajador
(FK de B5.11). Sin esto, los trabajadores nuevos nacían con cuenta pero sin
enlace y la notificación al asignado no los alcanzaba.

### 3. 9 trabajadores demo creados vía API (uno por puesto del catálogo)

Cubren los 5 roles y las 6 torres; todos con cuenta enlazada (backfill
re-ejecutado) y número de empleado:

| Nombre | Puesto | Torre | Cuenta |
|---|---|---|---|
| Ricardo Amaya Delgado | Ingeniero Residente | RESIDENTE | RES-015 |
| Sofía Herrera Nieves | Encargada de RRHH | ADMINISTRATIVO | ADM-003 |
| Gerardo Palafox Marín | Administrativo de Oficina | ADMINISTRATIVO | ADM-004 |
| Roberto Cárdenas Solís | Mecánico de Flota | MECANICO | TEC-019 |
| Hugo Ramírez Cota | Técnico Diésel | DIESEL | TEC-020 |
| Iván Barrios Zamudio | Soldador Certificado | SOLDADOR | TEC-021 |
| Erick Tapia Ledesma | Mantenimiento de Patio | MANTENIMIENTO | TEC-022 |
| Óscar Vega Angulo | Chofer de Volteo | (sin torre) | TRA-99416 |
| Misael Duarte Robles | Operador de Criba | (sin torre) | TRA-99417 |

Sueldos demo ($5,000 fiscal / $3,500 efectivo, Mixto), entrada 07:00,
fecha 2026-11-13. **Su PIN es temporal de 24h** (generado en el alta) — para
probar como ellos hay que usar el reinicio de PIN o cambiarlo desde admin.

## Verificación

- `npx tsc --noEmit` (api): limpio.
- `npx jest src/trabajadores`: **97/97**.
- `psql`: los 9 con su cuenta enlazada y su torre correcta.
- El backfill es idempotente (solo enlaza `usuario_id IS NULL` con
  coincidencia de nombre ÚNICA).

## Pendientes / riesgos

- Los trabajadores sin cuenta siguen existiendo (los demo antiguos T001-T006
  sin FK): su notificación de asignación no se entrega (queda loggeada).
- La emisión al trabajador depende del match nombre↔cuenta para el
  backfill; el alta nueva ya enlaza directo (exacto).
