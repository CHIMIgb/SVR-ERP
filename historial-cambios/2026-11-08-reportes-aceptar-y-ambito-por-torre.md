# /reportes — ámbito por torre, botón Aceptar (RESPONSABLE = quien acepta), truncado y "Levantó"

**Fecha:** 2026-11-08
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

1. **Vista por área (la base de la vista del empleado):** `findAll/findStats` reciben
   el usuario del JWT y aplican `aplicarAmbito`:
   - nivel 100 (Administrador) → ve todo;
   - el resto → solo los incidentes de **su torre** (`users.torre` ?? `roles.torre`);
   - sin torre (Trabajador) → solo **sus propios** reportes (`usuario_id`).
   El scope aplica igual a stats (las tarjetas cuentan su ámbito).
2. **ACEPTAR:** nuevo `POST /:id/aceptar` (permiso `editar` — residentes y técnicos):
   solo incidentes **Nuevos** y **sin responsable** → la columna RESPONSABLE se llena
   con el **nombre de quien lo acepta** (persona del usuario: nombre+apellidos),
   con guard anti-carrera (`updateMany` condicional; dobles → `YA_ACEPTADO` 409
   auditado) y estados: `SOLO_NUEVOS_SE_ACEPTAN`. Solo aceptar/rechazar por si es
   aceptable ("no acepto" = no hago nada; sigue Sin asignar).
3. **Descripción (tabla): truncado CSS por ancho de columna** (`block truncate` +
   `max-w-sm`) — puntos suspensivos automáticos al llegar al ancho; el texto
   completo vive en el Tooltip y en el detalle. Fuera el truncate manual de 90.
4. **Detalle:** bloque **"Levantó"** con nombre, **teléfono** (persona de la BD —
   columna ya existía) y **rol** del que levanta (`reportadoPor` en `GET /:id`).
   Teléfonos demo sembradas para los 5 usuarios de plantilla (migración
   `20261108210000_telefonos_demo_personas`, idempotente WHERE telefono IS NULL).

## Archivos tocados

- `apps/api` — service (`aplicarAmbito`, `aceptar`, `datosDelReportador`), controller,
  specs (+3 unit, +2 integración)
- `apps/web` — `lib/api.ts` (`aceptar`, `ReportadoPorDTO`), `reportes/page.tsx`
  (Aceptar en fila y detalle, truncado, bloque Levantó)

## Pruebas / verificación

- Unitarios **75/75** (+aceptar), integración real **26/26** (aceptar real con
  audit SUCCESS, doble acepto → FAIL, detalle reportadoPor).
- E2E real: admin crea incidente de MICRÓNICOS → **técnico** (torre Mecanico) solo
  ve categoría=Mecanico (5 de 35) y al **aceptar** la columna queda
  "Rubén Técnico de Flota"; cobrador y trabajador → **FORBIDDEN** al intentar
  aceptar (RBAC real); trabajador sin torre ve 0 (solo los suyos); demo borrado.
- `tsc --noEmit` api+web; eslint página 0.

## Pendientes y riesgos

- El administrador ve todo; el filtro "solo mi torre" aplica también al
  Administrativo (su torre es Administrativo — verá administra y los suyos;
  incluido el área? si quiere ver TODOS los de su módulo lo hablamos).
- El "no acepto" explícito (rechazar con motivo) no existe — no aceptar = queda
  visible para la torre. Si quieres declinar formal, es el mismo endpoint con flag.
