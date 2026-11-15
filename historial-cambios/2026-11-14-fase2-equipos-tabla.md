# 2026-11-14 — /equipos rediseñada a tabla (decisión del cliente) + 3 residentes de demo

## Qué se hizo

Rediseño de la vista `/equipos` según la propuesta del cliente:

- **Tabla única** (DataTable, plantilla del repo): una fila por **residente**
  con columnas Residente (nombre + rol + número de empleado), Área,
  Trabajadores (conteo) y **Acciones**: `Ver equipo` + `Asignar`.
- **Modal "Ver equipo"**: lista los trabajadores del residente con sus
  acciones `Reasignar` / `Quitar` junto a cada uno (se abren sus modales de
  confirmación; solo lectura si no hay permiso de editar).
- **Modal "Asignar"**: select de candidatos **sin jefe** (los que ya trae
  `GET /equipos`) para el residente elegido.
- Se quitaron los cards por residente y el panel suelto de "sin jefe".
- `StatsCards` se conservan (residentes / sin asignar / total enlazados).

**Backend — solo residentes en la tabla (decisión del cliente):**
`findEquipos()` ahora lista únicamente usuarios con rol **'Residente'**
(se quitó el "o con subordinados"). Commit `64fa330e`. Tests actualizados:
el test de integración usa el rol real 'Residente' para el jefe de prueba.

**3 residentes de ejemplo creados vía `POST /usuarios`** (auditan
`USUARIO_CREADO`, con email + contraseña de escritorio, rol Residente):
Ramiro Angulo, Saúl Osuna, Enrique Lugo
(`*.@svr-constructora.com` / `Residente123`). El listado ahora muestra
4 residentes: Óscar (4 trabajadores de demo) + los 3 nuevos con equipo vacío.

## Verificación

- `npx tsc --noEmit` (web y api): limpio. `npx jest src/usuarios`:
  34/34 unitarios; integración: 13/13.
- eslint: solo el error patrón preexistente (`set-state-in-effect` en el
  useEffect de carga) y se limpiaron los warnings (unused import, deps).
- Smoke real: `GET /equipos` → 4 residentes; el ciclo de asignación ya
  verificado en la fase anterior sigue igual (el backend no cambió en la
  parte de escritura).
- Smoke visual en navegador pendiente (sin navegador).

## Pendientes / riesgos

- Los subordinados de un jefe que NO es residente quedan fuera de esta
  vista (decisión del cliente: solo residentes) — hoy no existe ningún caso
  real (el vínculo es usuario↔usuario, se puede dar con administrativos
  según P10). Si pasa, esos trabajadores solo se reasignan por SQL o se
  ajusta el filtro.
- El modal de asignar usa un `<select>` simple de candidatos — si un día
  hay cientos de usuarios sin jefe, se cambia a un mini-buscador.
