# 2026-11-14 — Horas estándar de 12 (a.m./p.m.) en /ventas y /ventas/corte

## El problema

El cliente reportó mezcla de formatos: algunas horas en 24 ("14:35") y otras
en 12 ("02:35 p.m."). Pidió estandarizar TODO en 12 horas.

**Causa raíz (análisis):** `es-MX` en Intl default es **12 horas con
a.m./p.m.** (verificado en Node: `toLocaleTimeString('es-MX')` → "02:35
p.m."). Por eso lo que usa `toLocaleTimeString` ya salía bien (Hora actual,
tickets, historial, lista del corte y la hora de retiros que el backend
persiste — backend SIN cambios). La parte en **24 horas** venía de:

1. Los **horarios de turno configurados** (`turnoConfig.apertura/cierre`,
   strings "HH:mm" de la BD) mostrados **crudos** en banners y mensajes:
   - `/ventas` — banner "Fuera de horario de atención" ("El turno es de 08:00 a 22:00 hrs").
   - `/ventas/corte` — banner "Fuera de la ventana de cierre".
   - `CorteCaja` — "Turno de X a Y hrs · Cierre permitido...", aviso de
     turno cerrado, aviso "no está permitido cerrar caja".
2. El **subtitle del modal de cierre** en `CorteCaja` (`pad(getHours())`
   manual → "CAJA-PV · 14:35 hrs") y el **reporte impreso** del corte
   (`time: hour` en `generateClosureHtml`).

## Qué se hizo

- **`lib/formatters.ts`** — nuevo helper `formatHora12(hhmm)`:
  "22:00" → "10:00 p.m."; maneja medianoche ("00:00" → "12:00 a.m.") y
  mediodía ("12:00" → "12:00 p.m."); entrada inválida (>23h, >59min o no
  "HH:mm") se devuelve tal cual.
- **`/ventas/page.tsx`** — banner de fuera de horario con `formatHora12`.
- **`/ventas/corte/page.tsx`** — banner de ventana de cierre con `formatHora12`.
- **`components/pos/CorteCaja.tsx`** — los 3 mensajes de horario con
  `formatHora12`, subtitle del cierre (`10:05 p.m.`) y el `time` del HTML
  impreso del corte.

Ya quedaban en 12h sin tocar: "Hora actual" de los banners
(`toLocaleTimeString`), tickets/historial/lista del corte
(`formatTicketDate`), y la `hora` de retiros persistida por el backend.

## Verificación

- Helper probado por script: 22:00→10:00 p.m., 08:00→08:00 a.m.,
  12:00→12:00 p.m., 00:00→12:00 a.m., 13:05→01:05 p.m., "25:70"/"abc"→ tal cual.
- `npx tsc --noEmit` (web): limpio.
- eslint: solo el error **preexistente** de `CorteCaja.tsx:116`
  (react-hooks/immutability — `setCierreHoyData` usado antes de declararse;
  verificado con `git stash`: existe sin mis cambios) + warnings preexistentes.
- Smoke visual en navegador pendiente (sin navegador).

## Pendientes / riesgos

- El **editor del horario de turno** (si existe pantalla de config) sigue
  capturando "HH:mm" 24h — es el formato de BD, correcto mantenerlo; solo
  la VISUALIZACIÓN es 12h.
- El mensaje de error del **backend** al cerrar fuera de ventana
  (`ventas.service.ts` ~línea 825: "El cierre se habilita después de las
  22:00...") muestra las horas crudas de la config en 24h — es un toast
  que casi nunca aparece (el frontend bloquea antes); si el cliente lo
  pide, se corrige en el backend aparte.
- La "Hora actual" de los banners usa la zona del navegador (sin
  `timeZone: APP_TIMEZONE`) — comportamiento preexistente, no se tocó.
