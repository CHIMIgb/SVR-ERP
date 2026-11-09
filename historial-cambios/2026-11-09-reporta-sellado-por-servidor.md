# Fix: "Reporta" sellado por el servidor + ajustes de tests

**Fecha:** 2026-11-08
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

Bug del usuario: INC0046 decía "Reporta: Carlos Soldador de Planta" pero en la BD
sin dueño admin (usuario_id = nivel 100), por lo que soldador no podia editarlo
(correcto por la regla de edición) y al aceptar quedó RESPONSABLE = Carlos SVR.

Causa raíz: el campo "Reporta" venía del FRONT (nombreReporta() del user en
pantalla) mientras el dueño real (usuario_id) es el usuario del TOKEN. Con
sesiones mezcladas de dos cuentas (tabs con el mismo refresh token), texto y
dueño se desalineaban.

Fix: el backend ahora SELLON "Reporta" con la persona del token real
(`datosDelReportador`), ignorando el nombre que manda el front (create y update
mantiene solo su nombre). Nunca más texto/dueño desalineados; el dueño real es
siempre el del token, y todos los botones/blockers usan esa identidad ya
correcta. Tests: 3 unitarios promover mocks al nuevo contract (persona en
users.findUnique) + uno nuevo que asserta "Reporta" sellado.

## Pendientes y riesgos

- none (besides note above); INC0046 titularѬ es admin (creado con sesión
  admin) — el creador real que lo quiera editar: con el admin account.
