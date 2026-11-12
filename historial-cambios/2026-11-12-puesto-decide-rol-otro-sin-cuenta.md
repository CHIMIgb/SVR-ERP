# 2026-11-12 — El puesto decide el rol del alta + "Otro" sin cuenta + reportes_campo.eliminar solo Administrador

## Decisión del SVR (12-nov)

1. **No todos llevan acceso al alta**: el rol ya no es obligatorio — **el rol
   sale del PUESTO**, y con el puesto **"Otro"** no se genera usuario ni PIN.
2. **RRHH/Administrativo y reportes**: aceptado que el personal de oficina
   cree reportes (como todos los roles salvo Residente, que solo da
   seguimiento), **quitando `reportes_campo.eliminar` a todo rol que no sea
   Administrador** — borrar reportes es solo del Administrador.

## Cambios

**BD — migración `20261112010000_puesto_rol_y_otro` (idempotente):**
- `categorias_puesto.rol_id` (FK a roles, `ON DELETE SET NULL`): el rol que
  recibe la cuenta cuando el alta lleva ese puesto. Mapeo sembrado (solo
  llena NULL, editable luego en la Vista B): Operador/Chofer→Trabajador,
  Mecánico/Diésel/Soldador/Mantenimiento→Técnico, Ingeniero→Residente,
  RRHH/Administrativo→Administrativo.
- Puesto nuevo **`Otro`** (sin rol, sin torre).
- `DELETE role_permissions` de `reportes_campo.eliminar` en todo rol ≠
  Administrador (estaba en Administrativo; ahora solo lo tiene el
  Administrador, verificado).
- DOWN best-effort documentado.

**API (`apps/api/src/trabajadores`):**
- DTO: `CreateTrabajadorDto.rolId` **opcional** (override explícito);
  `CATEGORIAS_PUESTO` += `Otro`.
- `create()`: sin `rolId` → resuelve el rol del puesto (validado contra
  `ROLES_ASIGNABLES_WHERE` — nunca Administrador); puesto sin rol → **sin
  cuenta**: ni persona (solo existía para el user), ni user, ni numero, ni
  encargado (se ignora — el jefe vive en el user). Respuesta sin `identidad`;
  auditoría SUCCESS con `newValue.acceso = 'sin_cuenta'`.
- `catalogos()` expone `puestos: [{nombre, rolId, rolNombre}]` para el front.

**Front (`apps/web`):**
- El alta **ya no trae select de rol**: nota derivada del catálogo —
  "Tendrá acceso como **{rol}**…" o "Este puesto no incluye acceso a la app
  móvil" (con "Otro" en el select, etiquetado "(sin acceso a la app)").
- Filtro de la vista con "Otro". La sección de acceso de la EDICIÓN (#8)
  queda intacta (dar/quitar acceso y rol manual como override).

## Verificación / pruebas

- Unit: trabajadores 52/52 — 3 tests nuevos (rol del puesto con
  `users_roles` apuntando al rol mapeado, "Otro" sin persona/user con
  auditoría `sin_cuenta`, encargado ignorado sin rol).
- Integración BD real: trabajadores **25/25** — 2 tests nuevos (alta por
  puesto → rol Técnico, numero `TEC-…`, torre MECANICO; "Otro" → sin persona
  ni user, auditoría `sin_cuenta`).
- BD verificada: mapeo completo (10 puestos con su rol), Otro sin cuenta,
  `reportes_campo.eliminar` solo en Administrador.
- Suite completa: **1316/1318** (los 2 de cobranza, pre-existentes).
- `tsc --noEmit` limpio (api y web); eslint limpio.

## Pendientes / riesgos

- Smoke visual del alta (nota derivada del puesto y "Otro") — no hay infra
  front.
- Un puesto creado DESPUÉS sin `rol_id` → sin cuenta (comportamiento
  esperado); en la Vista B se podrá asignar el rol del puesto.
- `llevaMaquina` del form sigue en Operador/Chofer — "Otro" no lleva máquina
  (no lo pedía la máquina del puesto).
- Si el SVR quiere cambiar el mapeo puesto→rol, se hace con SQL o desde la
  Vista B (columna en BD, sin código).
