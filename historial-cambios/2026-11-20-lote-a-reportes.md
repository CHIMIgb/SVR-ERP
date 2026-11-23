# Lote A — tiempo relativo, lupa y conteos en los chips (paridad de mockups)

**Fecha:** 2026-11-20
**Autor:** agente
**Origen:** análisis de los 3 mockups de la vista reportes autorizado por el usuario (lote A: lo de costo bajo y puro cliente)

## Cambios realizados
- **`lib/formatters.ts`:** nuevo helper **`haceTiempo(fecha, hora?)`** —
  tiempo relativo es-MX («hace un momento / hace 14 min / hace 2 h / ayer /
  hace 3 días / meses / años») que interpreta el muro `fecha+hora` en la
  zona del .env (APP_TIMEZONE, dual-parse de `toLocaleString`) aunque el
  dispositivo esté en otra zona.
- **`TarjetaReporte`:** la meta ahora muestra `categoría · persona · hace 2 h`
  (mockup 1) — la fecha exacta queda en el detalle. Se retiró el helper
  `fechaCorta` interno (solo lo usaba la meta).
- **`/m/reportes`:** el buscador tiene **ícono de lupa** (`Search` absoluto +
  `pl-9`).
- **Chips con conteo:** «Nuevos 2 · En curso 1 · Cerrados 8» (mockups 1-3) —
  alimentados por los `stats` que ya cargan (spinner respetado: el conteo
  aparece cuando hay datos). «Todos» sin conteo.

## Analizados y NO en este lote (requieren backend o decisión de negocio)
- **KPI mensual del técnico** («23 resueltos este mes, +5 vs octubre»):
  endpoint nuevo de stats por mes/usuario — candidato a la siguiente fase.
- **Presionar / Llamar técnico / ¿Por qué no se resuelve?** (mockup 2,
  residente): flujo de nudge — requiere reglas («ningún técnico lo ha
  aceptado» es calculable; «esperando refacción» es texto libre) y
  endpoint. Ya anotado en el plan del módulo.
- **Badge «Atrasado»**: regla SLA a definir con el cliente (¿cuántas horas
  sin aceptar?).
- **«+ Nuevo reporte» full-width arriba**: solo reorganización visual; el
  header actual cumple.

## Archivos tocados
- `apps/web/src/lib/formatters.ts`
- `apps/web/src/components/pwa/TarjetaReporte/TarjetaReporte.tsx`
- `apps/web/src/app/(pwa)/m/reportes/page.tsx`
- `COMPONENTS-PWA.md` (§5: meta con tiempo relativo)
- `historial-cambios/2026-11-20-lote-a-reportes.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit`: 0 errores. `npm run lint`: 0 errores, 38 warnings preexistentes.
- `git diff --check`: sin errores.
- Smoke pendiente: «hace X» en las tarjetas (la zona del .env corrige si el
  dispositivo está en otra zona), lupa visible, conteos por chip.

## Pendientes y riesgos
- El tiempo relativo se recalcula en cada render: con la lista en pantalla
  no «envejece» en vivo (solo al recargar/acciones) — suficiente para el uso.
- Sin push: el commit queda local.
