# PWA: asistencia del equipo para el Residente

**Fecha:** 2026-11-20
**Autor:** P4chec0php

## Cambios realizados
- **`/m/asistencia` con pestañas para quien tiene equipo** (permiso `rrhh.mi_equipo:ver`: Residente y
  Administrador). "Mi equipo" abre por defecto, como en el diseño del residente; "Mi asistencia" es la
  pantalla propia de la rebanada 2 (el residente también checa). Trabajador y Técnico siguen viendo solo su
  asistencia, sin pestañas. `?vista=mia` o `?vista=equipo` abre una pestaña directo.
- **Mi equipo:** contadores (presentes de cuántos, retardos, faltan), filtros Todos / Presentes / Faltan con
  conteo y la lista con el estado del día de cada trabajador ("Presente 7:48", "Tarde 8:12", "Tarde ·
  sin justificar", "No asistió", "Sin checar", "En tolerancia", "De vacaciones") y botón de llamar (en
  naranja para quien no ha llegado). Usa `GET /asistencia/equipo` de la rebanada 1; sin sueldos.
- **Inicio:** bloque "Mi equipo hoy" con "Ver lista" (abre la pestaña del equipo). Al administrador sin gente
  a su cargo no se le muestra; al residente sin equipo se le explica que la oficina lo arma en Equipos. El
  botón de la tarjeta del día abre "Mi asistencia".
- **Diferencias con el diseño:** sin selector de obra (el equipo va por persona, `users.jefe_user_id`, no por
  obra) y en lugar de un botón único "Llamar a quien no asistió" cada uno de los que faltan tiene el suyo
  (un solo botón no puede marcar a varios).

## Cosas nuevas
- `apps/web/src/app/(pwa)/m/asistencia/EquipoAsistencia.tsx` (vista del equipo).
- `apps/web/src/app/(pwa)/m/asistencia/MiAsistencia.tsx` (la pantalla propia, movida desde `page.tsx`).
- `asistenciaApi.equipo()` y los tipos `EquipoAsistenciaDTO` / `MiembroAsistenciaEquipoDTO` (este nombre
  para no chocar con `MiembroEquipoDTO` de la vista /equipos).
- `clasificarMiembro()`, `puedeVerEquipo()` e `iniciales()` en `lib/pwa/asistencia-propia.ts`.

## Archivos tocados
- `apps/web/src/app/(pwa)/m/asistencia/page.tsx`
- `apps/web/src/app/(pwa)/m/asistencia/MiAsistencia.tsx`
- `apps/web/src/app/(pwa)/m/asistencia/EquipoAsistencia.tsx`
- `apps/web/src/app/(pwa)/m/page.tsx`
- `apps/web/src/lib/api.ts`
- `apps/web/src/lib/pwa/asistencia-propia.ts`

## Verificación
- `npx tsc --noEmit` en `apps/web`: sin errores en el código (los de `*.test.tsx` y `jest.config.ts` ya
  existían). `npm run lint`: 0 errores.
- Navegador: Chrome headless emulando un Android, login real del residente por número de empleado y PIN,
  con 4 trabajadores a su cargo cuyas asistencias se registraron por el endpoint real de RRHH (uno a tiempo,
  uno tarde, uno sin venir y uno de vacaciones). Capturas a 390, 768, 1024 y 1440 px en claro y oscuro del
  Inicio, las dos pestañas y los filtros. Probados los enlaces del Inicio a cada pestaña. Datos temporales
  creados y borrados al terminar.
- La prueba encontró un caso: pasadas las 17:00 la API marca "Falta" la omisión sin resolver aunque el
  trabajador sí checó; se muestra como "Tarde · sin justificar" (cuenta entre los presentes, en rojo porque
  para nómina es falta hasta que la oficina resuelva), no como "No asistió".

## Pendientes
- "Reportes abiertos" y "Requieren tu atención" del Inicio del residente: son del módulo de reportes (chimi).
- Si el cliente quiere el equipo por obra (todos los de sus obras aunque no tengan cuenta), cambia el filtro
  en la API (`findEquipo`).
