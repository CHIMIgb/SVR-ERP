# 2026-11-12 — docs: gráfica organizacional en README + reglas sincronizadas a AGENTS.md y al agente .opencode

## Qué se documentó

1. **README — gráfica de la estructura organizacional**: diagrama ASCII con la
   representación visual de los 5 roles de negocio + Administrador (sistema),
   sus puestos y la torre de /reportes a la que cada puesto pertenece
   (Residente→RESIDENTE; RRHH/Administrativo→ADMINISTRATIVO; los 4 puestos
   técnicos→sus torres; Trabajador sin torre→envía a la torre que
   corresponde). Se eliminó la duplicación de la nota de la torre que quedó
   al insertar la gráfica.
2. **AGENTS.md — sección RBAC actualizada**: modelo organizacional vigente
   (5 roles + torre al puesto vía `users.torre`, con precedencia en
   /reportes; RRHH y los 4 técnicos consolidados) + **⚠️ Vigilancia de
   permisos** (regla dura del permiso #107 en adelante: verificar duplicados,
   seed + rol en el mismo cambio, y que cada endpoint use SU permiso propio).
3. **`.opencode/agent/svr-erp.md` sincronizado con AGENTS.md** — se agregaron
   las reglas que faltaban: regla de oro de código existente, escritorio/PWA
   independientes con las reglas duras móviles, loaders/skeletons,
   `mensajeErrorApi`, estilos (inline prohibido, `*.styles.ts`,
   `scrollbar-none`), convención de idioma en la BD, deuda de tests
   frontend, gotchas extra (Turbopack panics, sin code splitting,
   framer-motion muerto) y la sección RBAC nueva con la vigilancia de
   permisos. Además se actualizó la línea obsoleta de "Seeds dev: roles=2,
   users=2" al estado real (6 roles, 5 de negocio, torre en el puesto).

## Verificación / pruebas

- Solo docs (README.md, AGENTS.md, .opencode/agent/svr-erp.md) — sin código.
- Estructura del README verificada por numeración de líneas: sección →
  gráfica → nota → tabla → vigilancia, sin duplicados.

## Pendientes / riesgos

- La gráfica es ASCII: se revisa en el renderizado de GitHub; si algún
  visor rompe el box-drawing, queda el detalle en la tabla contigua.
- Dos archivos de reglas (AGENTS.md y el agente) siguen siendo fuente
  duplicada: cualquier regla nueva se agrega en ambos — así lo pidió el
  usuario.
